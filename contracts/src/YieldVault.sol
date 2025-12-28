// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./InvoiceNFT.sol";

/// @title FaktoryVault - Manages yield strategies for tokenized invoices
/// @notice Holds invoice NFTs and simulates yield accrual based on strategies
/// @dev Part of Faktory Protocol - In production, integrates with Lendle on Mantle
contract YieldVault is Ownable, ReentrancyGuard, Pausable, IERC721Receiver {

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
    address public yieldSource; // Optional: LendleYieldSource for real yields

    mapping(uint256 => Deposit) public deposits;
    uint256[] public activeDeposits;
    mapping(uint256 => uint256) private activeDepositIndex; // tokenId => index+1 (0 means not in array)

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

    event EmergencyWithdraw(
        uint256 indexed tokenId,
        address indexed owner,
        address indexed rescuer
    );

    event DefaultHandled(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 principal,
        uint256 yieldForfeited
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
        require(_invoiceNFT != address(0), "Invalid address: zero");
        invoiceNFT = InvoiceNFT(_invoiceNFT);
    }

    // ============ Admin Functions ============

    function setAgentRouter(address _agentRouter) external onlyOwner {
        require(_agentRouter != address(0), "Invalid address: zero");
        agentRouter = _agentRouter;
    }

    /// @notice Set yield source for real DeFi yields (optional)
    /// @param _yieldSource LendleYieldSource contract address (0x0 for simulated yields)
    function setYieldSource(address _yieldSource) external onlyOwner {
        yieldSource = _yieldSource;
    }

    /// @notice Pause the vault - blocks deposits and strategy changes
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the vault
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Emergency withdraw for owner to rescue stuck NFTs
    /// @param tokenId The invoice NFT to rescue
    function emergencyWithdraw(uint256 tokenId) external onlyOwner {
        Deposit storage dep = deposits[tokenId];
        require(dep.active, "Not active");

        address originalOwner = dep.owner;
        uint256 principal = dep.principal;

        // Mark as inactive
        dep.active = false;
        totalValueLocked -= principal;

        // Remove from active deposits
        _removeFromActiveDeposits(tokenId);

        // Update invoice status
        invoiceNFT.updateStatus(tokenId, InvoiceNFT.InvoiceStatus.Active);

        // Transfer NFT back to original owner
        invoiceNFT.transferFrom(address(this), originalOwner, tokenId);

        emit EmergencyWithdraw(tokenId, originalOwner, msg.sender);
    }

    /// @notice Handle defaulted invoice - force withdrawal with forfeited yield
    /// @param tokenId The invoice NFT that defaulted
    function handleDefault(uint256 tokenId) external nonReentrant {
        Deposit storage dep = deposits[tokenId];
        require(dep.active, "Not active");

        // Verify invoice is actually defaulted
        InvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(tokenId);
        require(
            invoice.status == InvoiceNFT.InvoiceStatus.Defaulted,
            "Invoice not defaulted"
        );

        address originalOwner = dep.owner;
        uint256 principal = dep.principal;
        uint256 forfeitedYield = dep.accruedYield;

        // Mark as inactive - yield is forfeited
        dep.active = false;
        dep.accruedYield = 0;
        totalValueLocked -= principal;

        // Remove from active deposits
        _removeFromActiveDeposits(tokenId);

        // Transfer NFT back to original owner (they keep the NFT but lose yield)
        invoiceNFT.transferFrom(address(this), originalOwner, tokenId);

        emit DefaultHandled(tokenId, originalOwner, principal, forfeitedYield);
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
    ) external nonReentrant whenNotPaused {
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
        activeDepositIndex[tokenId] = activeDeposits.length; // Store index+1
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
    function changeStrategy(uint256 tokenId, Strategy newStrategy) external whenNotPaused {
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
    ) external onlyAgentRouter whenNotPaused {
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
        uint256 indexPlusOne = activeDepositIndex[tokenId];
        if (indexPlusOne == 0) return; // Not in array

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = activeDeposits.length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = activeDeposits[lastIndex];
            activeDeposits[index] = lastTokenId;
            activeDepositIndex[lastTokenId] = indexPlusOne; // Update index of moved element
        }

        activeDeposits.pop();
        delete activeDepositIndex[tokenId];
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
