// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./InvoiceNFT.sol";

/// @title FaktoryVault - Manages yield strategies for tokenized invoices
/// @notice Holds invoice NFTs and simulates yield accrual based on strategies
/// @dev Part of Faktory Protocol - In production, integrates with Lendle on Mantle
contract YieldVault is Ownable, ReentrancyGuard, IERC721Receiver {

    // ============ Enums ============

    enum Strategy {
        Hold,           // No yield optimization (0% simulated APY)
        Conservative,   // Low-risk lending (3-4% simulated APY)
        Aggressive      // Higher yield pools (6-8% simulated APY)
    }

    // ============ Structs ============

    struct Deposit {
        uint256 tokenId;           // Invoice NFT token ID
        address owner;             // Original depositor
        Strategy strategy;         // Current yield strategy
        uint256 depositTime;       // When deposited
        uint256 principal;         // Simulated principal (based on invoice)
        uint256 accruedYield;      // Accumulated yield
        uint256 lastYieldUpdate;   // Last yield calculation timestamp
        bool active;               // Is deposit active
    }

    // ============ State ============

    InvoiceNFT public invoiceNFT;
    address public agentRouter;

    mapping(uint256 => Deposit) public deposits;
    uint256[] public activeDeposits;

    // APY rates in basis points (100 = 1%)
    uint256 public constant HOLD_APY = 0;
    uint256 public constant CONSERVATIVE_APY = 350;  // 3.5%
    uint256 public constant AGGRESSIVE_APY = 700;    // 7%

    // Simulated total value for demo
    uint256 public totalValueLocked;
    uint256 public totalYieldGenerated;

    // ============ Events ============

    event Deposited(
        uint256 indexed tokenId,
        address indexed owner,
        Strategy strategy,
        uint256 principal
    );

    event Withdrawn(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 principal,
        uint256 yield
    );

    event StrategyChanged(
        uint256 indexed tokenId,
        Strategy oldStrategy,
        Strategy newStrategy
    );

    event YieldAccrued(
        uint256 indexed tokenId,
        uint256 yield,
        uint256 totalAccrued
    );

    event AgentAction(
        uint256 indexed tokenId,
        string action,
        bytes data
    );

    // ============ Modifiers ============

    modifier onlyAgentRouter() {
        require(msg.sender == agentRouter, "Only AgentRouter");
        _;
    }

    modifier onlyDepositOwner(uint256 tokenId) {
        require(deposits[tokenId].owner == msg.sender, "Not deposit owner");
        _;
    }

    // ============ Constructor ============

    constructor(address _invoiceNFT) Ownable(msg.sender) {
        invoiceNFT = InvoiceNFT(_invoiceNFT);
    }

    // ============ Admin Functions ============

    function setAgentRouter(address _agentRouter) external onlyOwner {
        agentRouter = _agentRouter;
    }

    // ============ Core Functions ============

    /// @notice Deposit an invoice NFT to start earning yield
    /// @param tokenId The invoice NFT to deposit
    /// @param strategy Initial yield strategy
    /// @param simulatedPrincipal Simulated principal value for yield calculation
    function deposit(
        uint256 tokenId,
        Strategy strategy,
        uint256 simulatedPrincipal
    ) external nonReentrant {
        require(invoiceNFT.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(!deposits[tokenId].active, "Already deposited");
        require(simulatedPrincipal > 0, "Invalid principal");

        // Transfer NFT to vault
        invoiceNFT.transferFrom(msg.sender, address(this), tokenId);

        // Update invoice status
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.InvoiceStatus.InYield);

        // Create deposit record
        deposits[tokenId] = Deposit({
            tokenId: tokenId,
            owner: msg.sender,
            strategy: strategy,
            depositTime: block.timestamp,
            principal: simulatedPrincipal,
            accruedYield: 0,
            lastYieldUpdate: block.timestamp,
            active: true
        });

        activeDeposits.push(tokenId);
        totalValueLocked += simulatedPrincipal;

        emit Deposited(tokenId, msg.sender, strategy, simulatedPrincipal);
    }

    /// @notice Withdraw invoice NFT and claim accrued yield
    /// @param tokenId The invoice NFT to withdraw
    function withdraw(uint256 tokenId) external nonReentrant onlyDepositOwner(tokenId) {
        Deposit storage dep = deposits[tokenId];
        require(dep.active, "Not active");

        // Update yield before withdrawal
        _updateYield(tokenId);

        uint256 principal = dep.principal;
        uint256 yield = dep.accruedYield;

        // Mark as inactive
        dep.active = false;
        totalValueLocked -= principal;

        // Remove from active deposits
        _removeFromActiveDeposits(tokenId);

        // Update invoice status
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.InvoiceStatus.Active);

        // Transfer NFT back to owner
        invoiceNFT.transferFrom(address(this), msg.sender, tokenId);

        emit Withdrawn(tokenId, msg.sender, principal, yield);
    }

    /// @notice Change yield strategy for a deposit (by owner or agent)
    function changeStrategy(uint256 tokenId, Strategy newStrategy) external {
        Deposit storage dep = deposits[tokenId];
        require(dep.active, "Not active");
        require(
            msg.sender == dep.owner || msg.sender == agentRouter,
            "Not authorized"
        );

        // Update yield with old strategy first
        _updateYield(tokenId);

        Strategy oldStrategy = dep.strategy;
        dep.strategy = newStrategy;

        emit StrategyChanged(tokenId, oldStrategy, newStrategy);
    }

    /// @notice Agent executes a strategy action
    function executeAgentAction(
        uint256 tokenId,
        Strategy strategy,
        string calldata actionDescription
    ) external onlyAgentRouter {
        Deposit storage dep = deposits[tokenId];
        require(dep.active, "Not active");

        // Update yield
        _updateYield(tokenId);

        // Change strategy
        Strategy oldStrategy = dep.strategy;
        dep.strategy = strategy;

        emit StrategyChanged(tokenId, oldStrategy, strategy);
        emit AgentAction(tokenId, actionDescription, abi.encode(strategy));
    }

    /// @notice Batch update yields for all active deposits
    function updateAllYields() external {
        for (uint256 i = 0; i < activeDeposits.length; i++) {
            _updateYield(activeDeposits[i]);
        }
    }

    // ============ Internal Functions ============

    function _updateYield(uint256 tokenId) internal {
        Deposit storage dep = deposits[tokenId];
        if (!dep.active) return;

        uint256 timeElapsed = block.timestamp - dep.lastYieldUpdate;
        if (timeElapsed == 0) return;

        uint256 apy = _getAPY(dep.strategy);
        // yield = principal * apy * time / (365 days * 10000)
        uint256 yield = (dep.principal * apy * timeElapsed) / (365 days * 10000);

        dep.accruedYield += yield;
        dep.lastYieldUpdate = block.timestamp;
        totalYieldGenerated += yield;

        emit YieldAccrued(tokenId, yield, dep.accruedYield);
    }

    function _getAPY(Strategy strategy) internal pure returns (uint256) {
        if (strategy == Strategy.Conservative) return CONSERVATIVE_APY;
        if (strategy == Strategy.Aggressive) return AGGRESSIVE_APY;
        return HOLD_APY;
    }

    function _removeFromActiveDeposits(uint256 tokenId) internal {
        for (uint256 i = 0; i < activeDeposits.length; i++) {
            if (activeDeposits[i] == tokenId) {
                activeDeposits[i] = activeDeposits[activeDeposits.length - 1];
                activeDeposits.pop();
                break;
            }
        }
    }

    // ============ View Functions ============

    function getDeposit(uint256 tokenId) external view returns (Deposit memory) {
        return deposits[tokenId];
    }

    function getAccruedYield(uint256 tokenId) external view returns (uint256) {
        Deposit memory dep = deposits[tokenId];
        if (!dep.active) return dep.accruedYield;

        uint256 timeElapsed = block.timestamp - dep.lastYieldUpdate;
        uint256 apy = _getAPY(dep.strategy);
        uint256 pendingYield = (dep.principal * apy * timeElapsed) / (365 days * 10000);

        return dep.accruedYield + pendingYield;
    }

    function getActiveDeposits() external view returns (uint256[] memory) {
        return activeDeposits;
    }

    function getActiveDepositsCount() external view returns (uint256) {
        return activeDeposits.length;
    }

    function getStrategyName(Strategy strategy) external pure returns (string memory) {
        if (strategy == Strategy.Hold) return "Hold";
        if (strategy == Strategy.Conservative) return "Conservative";
        if (strategy == Strategy.Aggressive) return "Aggressive";
        return "Unknown";
    }

    // ============ ERC721 Receiver ============

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
