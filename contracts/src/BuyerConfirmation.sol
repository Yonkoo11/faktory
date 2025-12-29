// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title BuyerConfirmation - On-chain invoice acknowledgment protocol
/// @notice Enables buyers to cryptographically confirm they owe an invoice
/// @dev Solves the oracle problem by shifting trust to buyer signatures
contract BuyerConfirmation is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ Enums ============

    enum TrustTier {
        Unverified,      // 0: No verification, highest risk
        SelfAttested,    // 1: Issuer-only claim
        AccountingLinked,// 2: Verified via QB/Xero
        BuyerConfirmed,  // 3: Buyer signed confirmation
        Insured          // 4: Credit insurance backing
    }

    // ============ Structs ============

    struct Confirmation {
        uint256 invoiceId;
        address buyer;
        uint256 amount;
        uint256 dueDate;
        uint256 confirmedAt;
        bool paid;
        uint256 paidAmount;
        uint256 paidAt;
    }

    // ============ State ============

    mapping(uint256 => Confirmation) public confirmations;
    mapping(address => uint256[]) public buyerInvoices;
    mapping(address => BuyerStats) public buyerStats;

    struct BuyerStats {
        uint256 totalConfirmed;
        uint256 totalPaid;
        uint256 totalDefaulted;
        uint256 totalVolume;
        uint256 avgPaymentDelay; // in seconds
    }

    // Authorized payment oracles (can record payments)
    mapping(address => bool) public paymentOracles;

    // ============ Events ============

    event InvoiceConfirmed(
        uint256 indexed invoiceId,
        address indexed buyer,
        address indexed issuer,
        uint256 amount,
        uint256 dueDate
    );

    event PaymentRecorded(
        uint256 indexed invoiceId,
        address indexed buyer,
        uint256 amount,
        uint256 timestamp
    );

    event BuyerDefaulted(
        uint256 indexed invoiceId,
        address indexed buyer,
        uint256 amount,
        uint256 daysOverdue
    );

    event PaymentOracleUpdated(address oracle, bool authorized);

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Admin Functions ============

    function setPaymentOracle(address oracle, bool authorized) external onlyOwner {
        paymentOracles[oracle] = authorized;
        emit PaymentOracleUpdated(oracle, authorized);
    }

    // ============ Core Functions ============

    /// @notice Buyer confirms they owe the invoice amount
    /// @param invoiceId The invoice NFT token ID
    /// @param amount The confirmed amount owed
    /// @param dueDate The payment due date
    /// @param issuer The invoice issuer address
    /// @param signature Buyer's signature over the confirmation
    function confirmInvoice(
        uint256 invoiceId,
        uint256 amount,
        uint256 dueDate,
        address issuer,
        bytes calldata signature
    ) external {
        require(confirmations[invoiceId].confirmedAt == 0, "Already confirmed");
        require(amount > 0, "Invalid amount");
        require(dueDate > block.timestamp, "Due date must be future");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            invoiceId,
            amount,
            dueDate,
            issuer,
            block.chainid
        ));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);

        require(signer == msg.sender, "Invalid signature");

        // Store confirmation
        confirmations[invoiceId] = Confirmation({
            invoiceId: invoiceId,
            buyer: msg.sender,
            amount: amount,
            dueDate: dueDate,
            confirmedAt: block.timestamp,
            paid: false,
            paidAmount: 0,
            paidAt: 0
        });

        buyerInvoices[msg.sender].push(invoiceId);
        buyerStats[msg.sender].totalConfirmed++;
        buyerStats[msg.sender].totalVolume += amount;

        emit InvoiceConfirmed(invoiceId, msg.sender, issuer, amount, dueDate);
    }

    /// @notice Record payment for a confirmed invoice
    /// @param invoiceId The invoice NFT token ID
    /// @param amount The amount paid
    function recordPayment(uint256 invoiceId, uint256 amount) external {
        require(
            paymentOracles[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );

        Confirmation storage conf = confirmations[invoiceId];
        require(conf.confirmedAt > 0, "Not confirmed");
        require(!conf.paid, "Already paid");

        conf.paid = true;
        conf.paidAmount = amount;
        conf.paidAt = block.timestamp;

        // Update buyer stats
        BuyerStats storage stats = buyerStats[conf.buyer];
        stats.totalPaid++;

        // Calculate payment delay
        if (block.timestamp > conf.dueDate) {
            uint256 delay = block.timestamp - conf.dueDate;
            stats.avgPaymentDelay = (stats.avgPaymentDelay * (stats.totalPaid - 1) + delay) / stats.totalPaid;
        }

        emit PaymentRecorded(invoiceId, conf.buyer, amount, block.timestamp);
    }

    /// @notice Mark invoice as defaulted (past due + grace period)
    /// @param invoiceId The invoice NFT token ID
    /// @param gracePeriodDays Days after due date before default
    function markDefaulted(uint256 invoiceId, uint256 gracePeriodDays) external {
        require(
            paymentOracles[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );

        Confirmation storage conf = confirmations[invoiceId];
        require(conf.confirmedAt > 0, "Not confirmed");
        require(!conf.paid, "Already paid");

        uint256 defaultDate = conf.dueDate + (gracePeriodDays * 1 days);
        require(block.timestamp > defaultDate, "Grace period not expired");

        // Update buyer stats
        buyerStats[conf.buyer].totalDefaulted++;

        uint256 daysOverdue = (block.timestamp - conf.dueDate) / 1 days;
        emit BuyerDefaulted(invoiceId, conf.buyer, conf.amount, daysOverdue);
    }

    // ============ View Functions ============

    /// @notice Get the trust tier for an invoice
    /// @param invoiceId The invoice NFT token ID
    function getTrustTier(uint256 invoiceId) external view returns (TrustTier) {
        if (confirmations[invoiceId].confirmedAt > 0) {
            return TrustTier.BuyerConfirmed;
        }
        return TrustTier.Unverified;
    }

    /// @notice Get buyer's payment reliability score (0-100)
    /// @param buyer The buyer address
    function getBuyerReliabilityScore(address buyer) external view returns (uint8) {
        BuyerStats memory stats = buyerStats[buyer];

        if (stats.totalConfirmed == 0) return 50; // Neutral for new buyers

        // Base score from payment ratio
        uint256 paidRatio = (stats.totalPaid * 100) / stats.totalConfirmed;

        // Penalty for defaults
        uint256 defaultPenalty = stats.totalDefaulted * 10;
        if (defaultPenalty > paidRatio) return 0;

        // Penalty for late payments (max 20 points)
        uint256 latePenalty = 0;
        if (stats.avgPaymentDelay > 30 days) {
            latePenalty = 20;
        } else if (stats.avgPaymentDelay > 7 days) {
            latePenalty = 10;
        }

        uint256 score = paidRatio - defaultPenalty - latePenalty;
        return uint8(score > 100 ? 100 : score);
    }

    /// @notice Get confirmation details
    function getConfirmation(uint256 invoiceId) external view returns (Confirmation memory) {
        return confirmations[invoiceId];
    }

    /// @notice Check if invoice is confirmed
    function isConfirmed(uint256 invoiceId) external view returns (bool) {
        return confirmations[invoiceId].confirmedAt > 0;
    }

    /// @notice Get all invoices for a buyer
    function getBuyerInvoices(address buyer) external view returns (uint256[] memory) {
        return buyerInvoices[buyer];
    }
}
