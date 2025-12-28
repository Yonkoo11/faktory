// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MantleYieldStrategy - Mantle-native yield optimization
/// @notice Leverages Mantle's unique yield sources: mETH, cmETH, and Lendle
/// @dev Purpose-built for Mantle Network to maximize yield efficiency
contract MantleYieldStrategy is Ownable {
    using SafeERC20 for IERC20;

    // ============ Mantle Native Tokens ============

    // mETH - Mantle Staked Ether (liquid staking token)
    // ~3-4% base yield from ETH staking
    address public constant METH_MAINNET = 0xcDA86A272531e8640cD7F1a92c01839911B90bb0;
    address public constant METH_SEPOLIA = 0x9EF6f9160Ba00B6621e5CB3217BB8b54a92B2828;

    // Stablecoins on Mantle
    address public constant USDC_MAINNET = 0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9;
    address public constant USDT_MAINNET = 0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE;
    address public constant WETH_MAINNET = 0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111;

    // MNT - Native Mantle token
    address public constant WMNT_MAINNET = 0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8;

    // ============ Yield Strategy Types ============

    enum YieldSource {
        METH_STAKING,      // mETH liquid staking (~3-4% APY)
        CMETH_RESTAKING,   // cmETH restaking (~5-7% APY with points)
        LENDLE_LENDING,    // Lendle lending pool (variable APY)
        AGNI_LP            // Agni DEX LP positions (higher risk/reward)
    }

    // ============ Position Tracking ============

    struct YieldPosition {
        uint256 tokenId;        // Invoice token ID
        YieldSource source;     // Active yield source
        address asset;          // Deposited asset
        uint256 amount;         // Amount deposited
        uint256 depositTime;    // Timestamp of deposit
        uint256 estimatedAPY;   // Estimated APY at deposit time (basis points)
    }

    mapping(uint256 => YieldPosition) public positions;

    // External protocol addresses (set by owner)
    address public lendlePool;
    address public cmethVault;

    // ============ Events ============

    event PositionOpened(uint256 indexed tokenId, YieldSource source, address asset, uint256 amount, uint256 estimatedAPY);
    event PositionClosed(uint256 indexed tokenId, uint256 returnedAmount, uint256 yieldEarned);
    event YieldSourceChanged(uint256 indexed tokenId, YieldSource oldSource, YieldSource newSource);

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Configuration ============

    function setLendlePool(address _pool) external onlyOwner {
        lendlePool = _pool;
    }

    function setCmethVault(address _vault) external onlyOwner {
        cmethVault = _vault;
    }

    // ============ Yield Source Info ============

    /// @notice Get estimated APY for each yield source
    /// @dev Returns APY in basis points (100 = 1%)
    function getEstimatedAPY(YieldSource source) public pure returns (uint256) {
        if (source == YieldSource.METH_STAKING) return 350;     // ~3.5% from ETH staking
        if (source == YieldSource.CMETH_RESTAKING) return 600;  // ~6% with restaking rewards
        if (source == YieldSource.LENDLE_LENDING) return 400;   // ~4% variable
        if (source == YieldSource.AGNI_LP) return 1200;         // ~12% but higher risk
        return 0;
    }

    /// @notice Get human-readable name for yield source
    function getYieldSourceName(YieldSource source) public pure returns (string memory) {
        if (source == YieldSource.METH_STAKING) return "mETH Liquid Staking";
        if (source == YieldSource.CMETH_RESTAKING) return "cmETH Restaking";
        if (source == YieldSource.LENDLE_LENDING) return "Lendle Lending";
        if (source == YieldSource.AGNI_LP) return "Agni DEX LP";
        return "Unknown";
    }

    /// @notice Get risk level for yield source (1-5, higher = riskier)
    function getYieldSourceRisk(YieldSource source) public pure returns (uint8) {
        if (source == YieldSource.METH_STAKING) return 1;      // Very low - just staking
        if (source == YieldSource.CMETH_RESTAKING) return 2;   // Low - restaking with slashing risk
        if (source == YieldSource.LENDLE_LENDING) return 2;    // Low - overcollateralized lending
        if (source == YieldSource.AGNI_LP) return 4;           // Higher - impermanent loss risk
        return 3;
    }

    // ============ Strategy Recommendations ============

    /// @notice Recommend best yield source based on risk tolerance and time horizon
    /// @param riskScore Invoice risk score (0-100, higher = safer)
    /// @param daysUntilDue Days until invoice payment is due
    function recommendYieldSource(
        uint8 riskScore,
        uint256 daysUntilDue
    ) external pure returns (YieldSource recommended, string memory reasoning) {
        // Very short term (< 7 days) or high risk invoices -> Conservative
        if (daysUntilDue < 7 || riskScore < 40) {
            return (YieldSource.LENDLE_LENDING, "Short duration or high risk - using liquid lending for quick exit");
        }

        // Medium term with good risk profile -> mETH staking
        if (daysUntilDue < 30 && riskScore >= 60) {
            return (YieldSource.METH_STAKING, "Medium term with solid invoice - mETH staking for stable yield");
        }

        // Long term with excellent risk profile -> cmETH for max yield
        if (daysUntilDue >= 30 && riskScore >= 80) {
            return (YieldSource.CMETH_RESTAKING, "Long duration + low risk = optimal for restaking rewards");
        }

        // Default to mETH for balanced approach
        return (YieldSource.METH_STAKING, "Balanced risk/reward with Mantle's native liquid staking");
    }

    // ============ Mantle Network Value Props ============

    /// @notice Get gas cost estimate for operations on Mantle
    /// @dev Mantle has ~90% lower gas costs than Ethereum mainnet
    function getEstimatedGasCost() external view returns (uint256 gasCostWei, string memory comparison) {
        uint256 gasPrice = tx.gasprice > 0 ? tx.gasprice : 50000000; // 0.05 gwei typical
        uint256 typicalGas = 150000; // Gas for complex operation
        gasCostWei = gasPrice * typicalGas;

        // Compare to Ethereum mainnet (~30 gwei typical)
        uint256 ethMainnetCost = 30 * 1e9 * typicalGas;
        uint256 savingsPercent = 100 - (gasCostWei * 100 / ethMainnetCost);

        comparison = string(abi.encodePacked(
            "Mantle: ~$0.002 vs Ethereum: ~$15 (",
            _toString(savingsPercent),
            "% savings)"
        ));
    }

    /// @notice Get Mantle ecosystem stats for display
    function getMantleStats() external pure returns (
        string memory networkName,
        string memory mETHDescription,
        string memory valueProposition
    ) {
        networkName = "Mantle Network (L2)";
        mETHDescription = "mETH: $1B+ TVL liquid staking token with ~3.5% yield";
        valueProposition = "Sub-cent transaction costs enable frequent AI agent operations";
    }

    // ============ Internal Helpers ============

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // ============ View Functions ============

    function getPosition(uint256 tokenId) external view returns (YieldPosition memory) {
        return positions[tokenId];
    }

    /// @notice Check if running on Mantle network
    function isMantle() public view returns (bool) {
        // Mantle Mainnet: 5000, Mantle Sepolia: 5003
        return block.chainid == 5000 || block.chainid == 5003;
    }

    /// @notice Get mETH address for current network
    function getMethAddress() public view returns (address) {
        if (block.chainid == 5000) return METH_MAINNET;
        if (block.chainid == 5003) return METH_SEPOLIA;
        return address(0); // Not on Mantle
    }
}
