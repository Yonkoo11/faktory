// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./InvoiceNFT.sol";

/// @title FaktoryOracle - Simulated oracle for invoice risk assessment
/// @notice Provides mock risk scores and payment probabilities for demo
/// @dev Part of Faktory Protocol - Production integrates with RedStone on Mantle
contract MockOracle is Ownable {

    // ============ Structs ============

    struct RiskData {
        uint8 riskScore;           // 0-100 (higher = lower risk)
        uint8 paymentProbability;  // 0-100
        uint256 lastUpdate;
        bool exists;
    }

    // ============ State ============

    InvoiceNFT public invoiceNFT;
    mapping(uint256 => RiskData) public riskData;

    // Default values for new invoices
    uint8 public defaultRiskScore = 75;
    uint8 public defaultPaymentProb = 80;

    // Authorized data providers
    mapping(address => bool) public dataProviders;

    // ============ Events ============

    event RiskDataUpdated(
        uint256 indexed tokenId,
        uint8 riskScore,
        uint8 paymentProbability
    );

    event DataProviderAdded(address indexed provider);
    event DataProviderRemoved(address indexed provider);

    // ============ Modifiers ============

    modifier onlyDataProvider() {
        require(dataProviders[msg.sender] || msg.sender == owner(), "Not provider");
        _;
    }

    // ============ Constructor ============

    constructor(address _invoiceNFT) Ownable(msg.sender) {
        invoiceNFT = InvoiceNFT(_invoiceNFT);
        dataProviders[msg.sender] = true;
    }

    // ============ Admin Functions ============

    function addDataProvider(address provider) external onlyOwner {
        dataProviders[provider] = true;
        emit DataProviderAdded(provider);
    }

    function removeDataProvider(address provider) external onlyOwner {
        dataProviders[provider] = false;
        emit DataProviderRemoved(provider);
    }

    function setDefaults(uint8 riskScore, uint8 paymentProb) external onlyOwner {
        require(riskScore <= 100 && paymentProb <= 100, "Invalid values");
        defaultRiskScore = riskScore;
        defaultPaymentProb = paymentProb;
    }

    // ============ Oracle Functions ============

    /// @notice Set risk data for an invoice
    function setRiskData(
        uint256 tokenId,
        uint8 riskScore,
        uint8 paymentProbability
    ) external onlyDataProvider {
        require(riskScore <= 100, "Risk score > 100");
        require(paymentProbability <= 100, "Payment prob > 100");

        riskData[tokenId] = RiskData({
            riskScore: riskScore,
            paymentProbability: paymentProbability,
            lastUpdate: block.timestamp,
            exists: true
        });

        // Update the invoice NFT
        invoiceNFT.updateRiskMetrics(tokenId, riskScore, paymentProbability);

        emit RiskDataUpdated(tokenId, riskScore, paymentProbability);
    }

    /// @notice Batch update risk data
    function batchSetRiskData(
        uint256[] calldata tokenIds,
        uint8[] calldata riskScores,
        uint8[] calldata paymentProbs
    ) external onlyDataProvider {
        require(
            tokenIds.length == riskScores.length &&
            tokenIds.length == paymentProbs.length,
            "Array mismatch"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(riskScores[i] <= 100 && paymentProbs[i] <= 100, "Invalid");

            riskData[tokenIds[i]] = RiskData({
                riskScore: riskScores[i],
                paymentProbability: paymentProbs[i],
                lastUpdate: block.timestamp,
                exists: true
            });

            invoiceNFT.updateRiskMetrics(tokenIds[i], riskScores[i], paymentProbs[i]);

            emit RiskDataUpdated(tokenIds[i], riskScores[i], paymentProbs[i]);
        }
    }

    /// @notice Simulate risk assessment based on invoice properties
    /// @dev Generates pseudo-random risk scores for demo purposes
    function simulateRiskAssessment(uint256 tokenId) external {
        InvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(tokenId);

        // Simulate risk based on days until due
        int256 daysUntilDue = invoiceNFT.getDaysUntilDue(tokenId);

        uint8 riskScore;
        uint8 paymentProb;

        if (daysUntilDue < 0) {
            // Overdue - high risk
            riskScore = 30;
            paymentProb = 40;
        } else if (daysUntilDue < 7) {
            // Due soon - medium-high risk
            riskScore = 60;
            paymentProb = 70;
        } else if (daysUntilDue < 30) {
            // Due in a month - medium risk
            riskScore = 75;
            paymentProb = 85;
        } else {
            // Long duration - lower risk
            riskScore = 85;
            paymentProb = 92;
        }

        // Add some pseudo-randomness based on block data
        uint256 randomish = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            tokenId
        ))) % 20;

        // Adjust by +/- 10
        if (randomish < 10) {
            riskScore = riskScore > 10 ? riskScore - uint8(randomish) : 5;
            paymentProb = paymentProb > 10 ? paymentProb - uint8(randomish) : 5;
        } else {
            riskScore = riskScore + uint8(randomish - 10) > 100 ? 100 : riskScore + uint8(randomish - 10);
            paymentProb = paymentProb + uint8(randomish - 10) > 100 ? 100 : paymentProb + uint8(randomish - 10);
        }

        riskData[tokenId] = RiskData({
            riskScore: riskScore,
            paymentProbability: paymentProb,
            lastUpdate: block.timestamp,
            exists: true
        });

        invoiceNFT.updateRiskMetrics(tokenId, riskScore, paymentProb);

        emit RiskDataUpdated(tokenId, riskScore, paymentProb);
    }

    // ============ View Functions ============

    function getRiskScore(uint256 tokenId) external view returns (uint8) {
        if (riskData[tokenId].exists) {
            return riskData[tokenId].riskScore;
        }
        return defaultRiskScore;
    }

    function getPaymentProbability(uint256 tokenId) external view returns (uint8) {
        if (riskData[tokenId].exists) {
            return riskData[tokenId].paymentProbability;
        }
        return defaultPaymentProb;
    }

    function getRiskData(uint256 tokenId) external view returns (RiskData memory) {
        if (riskData[tokenId].exists) {
            return riskData[tokenId];
        }
        return RiskData({
            riskScore: defaultRiskScore,
            paymentProbability: defaultPaymentProb,
            lastUpdate: 0,
            exists: false
        });
    }

    function isStale(uint256 tokenId, uint256 maxAge) external view returns (bool) {
        if (!riskData[tokenId].exists) return true;
        return block.timestamp - riskData[tokenId].lastUpdate > maxAge;
    }
}
