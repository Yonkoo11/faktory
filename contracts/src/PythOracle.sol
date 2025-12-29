// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/// @title PythOracle - Real-time oracle integration for Faktory Protocol
/// @notice Uses Pyth Network for real price feeds on Mantle
/// @dev Replaces MockOracle with real on-chain data
import "@openzeppelin/contracts/access/Ownable.sol";

contract PythOracle is Ownable {
    IPyth public pyth;

    // Pyth price feed IDs (from Pyth documentation)
    // ETH/USD: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
    // USDC/USD: 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a
    // MNT/USD: 0x4e3037c822d852d79af3ac80e35eb420ee3b870dca49f9344a38ef4773fb0585

    bytes32 public constant ETH_USD_FEED = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    bytes32 public constant USDC_USD_FEED = 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a;
    bytes32 public constant MNT_USD_FEED = 0x4e3037c822d852d79af3ac80e35eb420ee3b870dca49f9344a38ef4773fb0585;

    // Risk assessment data per invoice
    struct RiskData {
        uint8 riskScore;
        uint8 paymentProbability;
        uint256 lastUpdated;
        int64 collateralPrice;  // Real price from Pyth
    }

    mapping(uint256 => RiskData) public riskAssessments;

    // Price staleness threshold (1 hour)
    uint256 public constant MAX_PRICE_AGE = 3600;

    // Fallback prices (used when Pyth is unavailable)
    int64 public fallbackEthPrice = 200000000000; // $2000 with 8 decimals
    int64 public fallbackMntPrice = 80000000;     // $0.80 with 8 decimals
    bool public useFallback = false;

    // Circuit breaker - pause if too many failures
    uint256 public consecutiveFailures = 0;
    uint256 public constant MAX_FAILURES_BEFORE_FALLBACK = 3;

    // Automatic fallback timeout (24 hours default)
    uint256 public fallbackTimeout = 24 hours;
    uint256 public fallbackActivatedAt = 0;

    event FallbackActivated(string reason);
    event FallbackDeactivated();
    event FallbackPricesUpdated(int64 ethPrice, int64 mntPrice);
    event RiskAssessed(
        uint256 indexed tokenId,
        uint8 riskScore,
        uint8 paymentProbability,
        int64 collateralPrice
    );

    constructor(address _pyth) Ownable(msg.sender) {
        pyth = IPyth(_pyth);
    }

    /// @notice Get the current ETH/USD price from Pyth with fallback
    /// @return price The price with 8 decimal places
    function getEthUsdPrice() public view returns (int64) {
        if (isFallbackActive()) {
            return fallbackEthPrice;
        }
        try pyth.getPriceNoOlderThan(ETH_USD_FEED, MAX_PRICE_AGE) returns (PythStructs.Price memory price) {
            return price.price;
        } catch {
            return fallbackEthPrice;
        }
    }

    /// @notice Get the current MNT/USD price from Pyth with fallback
    /// @return price The price with 8 decimal places
    function getMntUsdPrice() public view returns (int64) {
        if (isFallbackActive()) {
            return fallbackMntPrice;
        }
        try pyth.getPriceNoOlderThan(MNT_USD_FEED, MAX_PRICE_AGE) returns (PythStructs.Price memory price) {
            return price.price;
        } catch {
            return fallbackMntPrice;
        }
    }

    /// @notice Activate fallback mode (owner only)
    function activateFallback(string calldata reason) external onlyOwner {
        useFallback = true;
        fallbackActivatedAt = block.timestamp;
        emit FallbackActivated(reason);
    }

    /// @notice Deactivate fallback mode (owner only)
    function deactivateFallback() external onlyOwner {
        useFallback = false;
        consecutiveFailures = 0;
        fallbackActivatedAt = 0;
        emit FallbackDeactivated();
    }

    /// @notice Set fallback timeout duration (owner only)
    function setFallbackTimeout(uint256 timeout) external onlyOwner {
        require(timeout >= 1 hours, "Timeout too short");
        fallbackTimeout = timeout;
    }

    /// @notice Check if fallback mode has timed out and should be auto-deactivated
    function isFallbackTimedOut() public view returns (bool) {
        if (!useFallback || fallbackActivatedAt == 0) return false;
        return block.timestamp > fallbackActivatedAt + fallbackTimeout;
    }

    /// @notice Check if fallback is currently active (accounts for timeout)
    function isFallbackActive() public view returns (bool) {
        if (!useFallback) return false;
        // Auto-deactivate if timed out
        if (isFallbackTimedOut()) return false;
        return true;
    }

    /// @notice Update fallback prices (owner only)
    function setFallbackPrices(int64 _ethPrice, int64 _mntPrice) external onlyOwner {
        require(_ethPrice > 0 && _mntPrice > 0, "Invalid prices");
        fallbackEthPrice = _ethPrice;
        fallbackMntPrice = _mntPrice;
        emit FallbackPricesUpdated(_ethPrice, _mntPrice);
    }

    /// @notice Check if prices are available from Pyth
    function isPythAvailable() public view returns (bool) {
        try pyth.getPriceNoOlderThan(ETH_USD_FEED, MAX_PRICE_AGE) returns (PythStructs.Price memory) {
            return true;
        } catch {
            return false;
        }
    }

    /// @notice Assess risk for an invoice using real market data
    /// @param tokenId The invoice token ID
    /// @param dueDate The invoice due date
    /// @param invoiceValue The invoice value in USD (18 decimals)
    /// @param collateralValue The collateral value in native token (18 decimals)
    /// @param priceUpdateData Pyth price update data (from Hermes)
    function assessRisk(
        uint256 tokenId,
        uint256 dueDate,
        uint256 invoiceValue,
        uint256 collateralValue,
        bytes[] calldata priceUpdateData
    ) external payable {
        // Update Pyth prices with fresh data
        uint256 fee = pyth.getUpdateFee(priceUpdateData);
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        // Get real-time collateral price
        PythStructs.Price memory mntPrice = pyth.getPriceNoOlderThan(MNT_USD_FEED, MAX_PRICE_AGE);
        int64 collateralPrice = mntPrice.price;

        // Calculate collateral value in USD
        // Price has 8 decimals, collateral has 18 decimals
        // Result should be in 18 decimals
        uint256 collateralUsdValue = (collateralValue * uint64(collateralPrice)) / 1e8;

        // Calculate collateralization ratio (in basis points, 10000 = 100%)
        uint256 collateralRatio = invoiceValue > 0
            ? (collateralUsdValue * 10000) / invoiceValue
            : 0;

        // Calculate days until due
        int256 daysUntilDue = int256(dueDate) - int256(block.timestamp);
        daysUntilDue = daysUntilDue / 1 days;

        // Calculate risk score based on real factors
        uint8 riskScore = calculateRiskScore(collateralRatio, daysUntilDue, collateralPrice);
        uint8 paymentProb = calculatePaymentProbability(collateralRatio, daysUntilDue);

        riskAssessments[tokenId] = RiskData({
            riskScore: riskScore,
            paymentProbability: paymentProb,
            lastUpdated: block.timestamp,
            collateralPrice: collateralPrice
        });

        emit RiskAssessed(tokenId, riskScore, paymentProb, collateralPrice);
    }

    /// @notice Calculate risk score based on real market data
    function calculateRiskScore(
        uint256 collateralRatio,
        int256 daysUntilDue,
        int64 collateralPrice
    ) internal pure returns (uint8) {
        uint256 score = 50; // Base score

        // Collateralization factor (0-40 points)
        if (collateralRatio >= 15000) { // 150%+ collateralized
            score += 40;
        } else if (collateralRatio >= 12000) { // 120%+ collateralized
            score += 30;
        } else if (collateralRatio >= 10000) { // 100%+ collateralized
            score += 20;
        } else if (collateralRatio >= 8000) { // 80%+ collateralized
            score += 10;
        }
        // Under-collateralized gets no bonus

        // Time factor (0-30 points)
        if (daysUntilDue >= 60) {
            score += 30;
        } else if (daysUntilDue >= 30) {
            score += 20;
        } else if (daysUntilDue >= 14) {
            score += 10;
        } else if (daysUntilDue >= 0) {
            score += 5;
        }
        // Overdue invoices get no time bonus

        // Price stability factor (simplified - would use volatility in production)
        // If price is above $0.50, add stability points
        if (collateralPrice > 50000000) { // $0.50 with 8 decimals
            score += 10;
        }

        // Cap at 100
        if (score > 100) score = 100;

        return uint8(score);
    }

    /// @notice Calculate payment probability based on real factors
    function calculatePaymentProbability(
        uint256 collateralRatio,
        int256 daysUntilDue
    ) internal pure returns (uint8) {
        uint256 prob = 40; // Base probability

        // Collateralization strongly affects payment probability
        if (collateralRatio >= 15000) {
            prob += 50; // Very high confidence if over-collateralized
        } else if (collateralRatio >= 12000) {
            prob += 40;
        } else if (collateralRatio >= 10000) {
            prob += 30;
        } else if (collateralRatio >= 8000) {
            prob += 15;
        }

        // Time affects probability
        if (daysUntilDue >= 30) {
            prob += 10;
        } else if (daysUntilDue < 0) {
            // Overdue reduces probability
            prob = prob > 20 ? prob - 20 : 0;
        }

        // Cap at 99 (never 100% certain)
        if (prob > 99) prob = 99;

        return uint8(prob);
    }

    /// @notice Get risk score for an invoice
    function getRiskScore(uint256 tokenId) external view returns (uint8) {
        RiskData memory data = riskAssessments[tokenId];
        // Return default if not assessed yet
        if (data.lastUpdated == 0) return 50;
        return data.riskScore;
    }

    /// @notice Get payment probability for an invoice
    function getPaymentProbability(uint256 tokenId) external view returns (uint8) {
        RiskData memory data = riskAssessments[tokenId];
        // Return default if not assessed yet
        if (data.lastUpdated == 0) return 50;
        return data.paymentProbability;
    }

    /// @notice Get full risk assessment data
    function getRiskAssessment(uint256 tokenId) external view returns (
        uint8 riskScore,
        uint8 paymentProbability,
        uint256 lastUpdated,
        int64 collateralPrice
    ) {
        RiskData memory data = riskAssessments[tokenId];
        return (
            data.riskScore,
            data.paymentProbability,
            data.lastUpdated,
            data.collateralPrice
        );
    }

    /// @notice Get Pyth update fee
    function getUpdateFee(bytes[] calldata priceUpdateData) external view returns (uint256) {
        return pyth.getUpdateFee(priceUpdateData);
    }
}
