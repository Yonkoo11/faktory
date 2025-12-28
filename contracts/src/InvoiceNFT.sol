// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FaktoryNFT - Tokenized Invoice as RWA
/// @notice ERC721 representing tokenized invoices with privacy-preserving commitments
/// @dev Invoice data is stored as commitments (hashes) for privacy - Part of Faktory Protocol
contract InvoiceNFT is ERC721, ERC721Enumerable, Ownable {

    // ============ Structs ============

    struct Invoice {
        bytes32 dataCommitment;      // hash(invoiceData + salt) for privacy
        bytes32 amountCommitment;    // hash(amount + salt) for range proofs
        uint256 dueDate;             // Unix timestamp when invoice is due
        uint256 createdAt;           // When the invoice was tokenized
        address issuer;              // Original invoice issuer
        InvoiceStatus status;        // Current status
        uint8 riskScore;             // 0-100, set by oracle/agent
        uint8 paymentProbability;    // 0-100, set by oracle/agent
    }

    enum InvoiceStatus {
        Active,      // Invoice is active and can be used for yield
        InYield,     // Currently deposited in yield vault
        Paid,        // Invoice has been paid
        Defaulted,   // Invoice defaulted
        Cancelled    // Invoice was cancelled
    }

    // ============ State ============

    uint256 private _nextTokenId;
    mapping(uint256 => Invoice) public invoices;
    mapping(uint256 => mapping(address => bool)) public revealAuthorized;

    address public yieldVault;
    address public agentRouter;
    address public oracle;

    // ============ Events ============

    event InvoiceMinted(
        uint256 indexed tokenId,
        address indexed issuer,
        bytes32 dataCommitment,
        uint256 dueDate
    );

    event InvoiceStatusUpdated(
        uint256 indexed tokenId,
        InvoiceStatus oldStatus,
        InvoiceStatus newStatus
    );

    event RiskScoreUpdated(
        uint256 indexed tokenId,
        uint8 riskScore,
        uint8 paymentProbability
    );

    event RevealAuthorized(
        uint256 indexed tokenId,
        address indexed authorizedAddress
    );

    // ============ Modifiers ============

    modifier onlyYieldVault() {
        require(msg.sender == yieldVault, "Only YieldVault");
        _;
    }

    modifier onlyAgentOrOracle() {
        require(
            msg.sender == agentRouter || msg.sender == oracle,
            "Only Agent or Oracle"
        );
        _;
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _;
    }

    // ============ Constructor ============

    constructor() ERC721("Faktory Invoice", "FAKT") Ownable(msg.sender) {}

    // ============ Admin Functions ============

    function setYieldVault(address _yieldVault) external onlyOwner {
        require(_yieldVault != address(0), "Invalid address: zero");
        yieldVault = _yieldVault;
    }

    function setAgentRouter(address _agentRouter) external onlyOwner {
        require(_agentRouter != address(0), "Invalid address: zero");
        agentRouter = _agentRouter;
    }

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid address: zero");
        oracle = _oracle;
    }

    // ============ Core Functions ============

    /// @notice Mint a new invoice NFT
    /// @param dataCommitment Hash of invoice data for privacy
    /// @param amountCommitment Hash of amount for range proofs
    /// @param dueDate Unix timestamp when invoice is due
    /// @return tokenId The ID of the minted invoice
    function mint(
        bytes32 dataCommitment,
        bytes32 amountCommitment,
        uint256 dueDate
    ) external returns (uint256 tokenId) {
        require(dueDate > block.timestamp, "Due date must be in future");
        require(dataCommitment != bytes32(0), "Invalid data commitment");

        tokenId = _nextTokenId++;

        invoices[tokenId] = Invoice({
            dataCommitment: dataCommitment,
            amountCommitment: amountCommitment,
            dueDate: dueDate,
            createdAt: block.timestamp,
            issuer: msg.sender,
            status: InvoiceStatus.Active,
            riskScore: 50,  // Default middle score
            paymentProbability: 50
        });

        _safeMint(msg.sender, tokenId);

        emit InvoiceMinted(tokenId, msg.sender, dataCommitment, dueDate);
    }

    /// @notice Update invoice status (by YieldVault or owner)
    function updateStatus(uint256 tokenId, InvoiceStatus newStatus) external {
        require(
            msg.sender == yieldVault ||
            msg.sender == ownerOf(tokenId) ||
            msg.sender == owner(),
            "Not authorized"
        );

        Invoice storage invoice = invoices[tokenId];
        InvoiceStatus oldStatus = invoice.status;
        invoice.status = newStatus;

        emit InvoiceStatusUpdated(tokenId, oldStatus, newStatus);
    }

    /// @notice Update risk metrics (by oracle or agent)
    function updateRiskMetrics(
        uint256 tokenId,
        uint8 riskScore,
        uint8 paymentProbability
    ) external onlyAgentOrOracle {
        require(riskScore <= 100, "Risk score > 100");
        require(paymentProbability <= 100, "Payment probability > 100");

        Invoice storage invoice = invoices[tokenId];
        invoice.riskScore = riskScore;
        invoice.paymentProbability = paymentProbability;

        emit RiskScoreUpdated(tokenId, riskScore, paymentProbability);
    }

    /// @notice Authorize an address to receive invoice reveal
    function authorizeReveal(uint256 tokenId, address authorized)
        external
        onlyTokenOwner(tokenId)
    {
        revealAuthorized[tokenId][authorized] = true;
        emit RevealAuthorized(tokenId, authorized);
    }

    /// @notice Verify a data commitment reveal
    function verifyReveal(
        uint256 tokenId,
        bytes calldata invoiceData,
        bytes32 salt
    ) external view returns (bool) {
        bytes32 commitment = invoices[tokenId].dataCommitment;
        bytes32 computed = keccak256(abi.encodePacked(invoiceData, salt));
        return commitment == computed;
    }

    // ============ View Functions ============

    function getInvoice(uint256 tokenId) external view returns (Invoice memory) {
        return invoices[tokenId];
    }

    function getDaysUntilDue(uint256 tokenId) external view returns (int256) {
        uint256 dueDate = invoices[tokenId].dueDate;
        if (block.timestamp >= dueDate) {
            return -int256((block.timestamp - dueDate) / 1 days);
        }
        return int256((dueDate - block.timestamp) / 1 days);
    }

    function isActive(uint256 tokenId) external view returns (bool) {
        return invoices[tokenId].status == InvoiceStatus.Active;
    }

    /// @notice Check if an invoice is overdue
    /// @param tokenId The invoice token ID
    /// @return bool True if invoice is past due date
    function isOverdue(uint256 tokenId) external view returns (bool) {
        Invoice storage invoice = invoices[tokenId];
        return block.timestamp > invoice.dueDate &&
               (invoice.status == InvoiceStatus.Active || invoice.status == InvoiceStatus.InYield);
    }

    /// @notice Mark an overdue invoice as defaulted (callable by anyone after grace period)
    /// @param tokenId The invoice token ID
    /// @param gracePeriodDays Days after due date before marking as defaulted
    function markDefaulted(uint256 tokenId, uint256 gracePeriodDays) external {
        Invoice storage invoice = invoices[tokenId];

        require(
            invoice.status == InvoiceStatus.Active || invoice.status == InvoiceStatus.InYield,
            "Invoice not active"
        );

        uint256 gracePeriod = gracePeriodDays * 1 days;
        require(
            block.timestamp > invoice.dueDate + gracePeriod,
            "Grace period not expired"
        );

        InvoiceStatus oldStatus = invoice.status;
        invoice.status = InvoiceStatus.Defaulted;

        emit InvoiceStatusUpdated(tokenId, oldStatus, InvoiceStatus.Defaulted);
    }

    function totalInvoices() external view returns (uint256) {
        return _nextTokenId;
    }

    function getActiveInvoices() external view returns (uint256[] memory) {
        uint256 total = _nextTokenId;
        uint256 activeCount = 0;

        // Count active invoices
        for (uint256 i = 0; i < total; i++) {
            if (invoices[i].status == InvoiceStatus.Active ||
                invoices[i].status == InvoiceStatus.InYield) {
                activeCount++;
            }
        }

        // Build array
        uint256[] memory activeIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < total; i++) {
            if (invoices[i].status == InvoiceStatus.Active ||
                invoices[i].status == InvoiceStatus.InYield) {
                activeIds[index++] = i;
            }
        }

        return activeIds;
    }

    // ============ Required Overrides ============

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
