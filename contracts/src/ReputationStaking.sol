// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ReputationStaking - Fraud prevention through economic incentives
/// @notice Issuers stake collateral to unlock invoice minting; slashed for fraud
/// @dev Part of Faktory's Trust Layer - creates skin in the game
contract ReputationStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct IssuerProfile {
        uint256 stakedAmount;
        uint256 invoicesIssued;
        uint256 invoicesPaid;
        uint256 invoicesDefaulted;
        uint256 fraudPenalties;
        uint256 totalVolumeIssued;
        uint256 firstInvoiceAt;
        bool active;
    }

    // ============ State ============

    // Staking token (e.g., USDC, MNT)
    IERC20 public stakingToken;

    // Issuer profiles
    mapping(address => IssuerProfile) public profiles;

    // Minimum stake required to mint invoices
    uint256 public minStake = 100 * 1e18; // 100 tokens

    // Maximum invoice value as multiple of stake
    uint256 public maxLeverageRatio = 10; // 10x stake

    // Slash percentage for fraud (in basis points, 10000 = 100%)
    uint256 public fraudSlashRate = 5000; // 50%

    // Authorized contracts that can report fraud/payments
    mapping(address => bool) public authorizedReporters;

    // Slashed funds go to this address
    address public slashRecipient;

    // ============ Events ============

    event Staked(address indexed issuer, uint256 amount, uint256 totalStake);
    event Unstaked(address indexed issuer, uint256 amount, uint256 totalStake);
    event InvoiceRecorded(address indexed issuer, uint256 invoiceId, uint256 amount);
    event PaymentRecorded(address indexed issuer, uint256 invoiceId);
    event DefaultRecorded(address indexed issuer, uint256 invoiceId);
    event FraudSlashed(address indexed issuer, uint256 invoiceId, uint256 slashedAmount);
    event ReporterUpdated(address reporter, bool authorized);

    // ============ Constructor ============

    constructor(address _stakingToken) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid token");
        stakingToken = IERC20(_stakingToken);
        slashRecipient = msg.sender;
    }

    // ============ Admin Functions ============

    function setMinStake(uint256 _minStake) external onlyOwner {
        minStake = _minStake;
    }

    function setMaxLeverageRatio(uint256 _ratio) external onlyOwner {
        require(_ratio > 0 && _ratio <= 100, "Invalid ratio");
        maxLeverageRatio = _ratio;
    }

    function setFraudSlashRate(uint256 _rate) external onlyOwner {
        require(_rate <= 10000, "Invalid rate");
        fraudSlashRate = _rate;
    }

    function setSlashRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid address");
        slashRecipient = _recipient;
    }

    function setAuthorizedReporter(address reporter, bool authorized) external onlyOwner {
        authorizedReporters[reporter] = authorized;
        emit ReporterUpdated(reporter, authorized);
    }

    // ============ Staking Functions ============

    /// @notice Stake tokens to enable invoice minting
    /// @param amount Amount of tokens to stake
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        IssuerProfile storage profile = profiles[msg.sender];
        profile.stakedAmount += amount;
        profile.active = true;

        if (profile.firstInvoiceAt == 0) {
            profile.firstInvoiceAt = block.timestamp;
        }

        emit Staked(msg.sender, amount, profile.stakedAmount);
    }

    /// @notice Unstake tokens (only if no active invoices exceed remaining capacity)
    /// @param amount Amount of tokens to unstake
    function unstake(uint256 amount) external nonReentrant {
        IssuerProfile storage profile = profiles[msg.sender];
        require(profile.stakedAmount >= amount, "Insufficient stake");

        // Check remaining stake covers outstanding invoices
        uint256 remainingStake = profile.stakedAmount - amount;
        uint256 activeInvoiceVolume = getActiveInvoiceVolume(msg.sender);
        require(
            remainingStake * maxLeverageRatio >= activeInvoiceVolume,
            "Cannot unstake: active invoices exceed capacity"
        );

        profile.stakedAmount = remainingStake;
        if (remainingStake == 0) {
            profile.active = false;
        }

        stakingToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount, profile.stakedAmount);
    }

    // ============ Reporting Functions ============

    /// @notice Record a new invoice issued
    /// @param issuer The invoice issuer
    /// @param invoiceId The invoice token ID
    /// @param amount The invoice amount
    function recordInvoiceIssued(
        address issuer,
        uint256 invoiceId,
        uint256 amount
    ) external {
        require(authorizedReporters[msg.sender] || msg.sender == owner(), "Not authorized");

        IssuerProfile storage profile = profiles[issuer];
        require(profile.active, "Issuer not active");
        require(
            profile.stakedAmount * maxLeverageRatio >= profile.totalVolumeIssued + amount,
            "Exceeds leverage capacity"
        );

        profile.invoicesIssued++;
        profile.totalVolumeIssued += amount;

        emit InvoiceRecorded(issuer, invoiceId, amount);
    }

    /// @notice Record invoice payment
    /// @param issuer The invoice issuer
    /// @param invoiceId The invoice token ID
    function recordPayment(address issuer, uint256 invoiceId) external {
        require(authorizedReporters[msg.sender] || msg.sender == owner(), "Not authorized");

        profiles[issuer].invoicesPaid++;
        emit PaymentRecorded(issuer, invoiceId);
    }

    /// @notice Record invoice default (buyer didn't pay)
    /// @param issuer The invoice issuer
    /// @param invoiceId The invoice token ID
    function recordDefault(address issuer, uint256 invoiceId) external {
        require(authorizedReporters[msg.sender] || msg.sender == owner(), "Not authorized");

        profiles[issuer].invoicesDefaulted++;
        emit DefaultRecorded(issuer, invoiceId);
    }

    /// @notice Slash stake for fraudulent invoice
    /// @param issuer The fraudulent issuer
    /// @param invoiceId The fraudulent invoice ID
    function slashForFraud(address issuer, uint256 invoiceId) external {
        require(authorizedReporters[msg.sender] || msg.sender == owner(), "Not authorized");

        IssuerProfile storage profile = profiles[issuer];
        require(profile.stakedAmount > 0, "No stake to slash");

        uint256 slashAmount = (profile.stakedAmount * fraudSlashRate) / 10000;
        profile.stakedAmount -= slashAmount;
        profile.fraudPenalties++;

        if (profile.stakedAmount < minStake) {
            profile.active = false;
        }

        stakingToken.safeTransfer(slashRecipient, slashAmount);

        emit FraudSlashed(issuer, invoiceId, slashAmount);
    }

    // ============ View Functions ============

    /// @notice Check if issuer can mint invoice of given amount
    /// @param issuer The issuer address
    /// @param amount The invoice amount
    function canMintInvoice(address issuer, uint256 amount) external view returns (bool) {
        IssuerProfile memory profile = profiles[issuer];

        if (!profile.active) return false;
        if (profile.stakedAmount < minStake) return false;

        uint256 capacity = profile.stakedAmount * maxLeverageRatio;
        uint256 activeVolume = getActiveInvoiceVolume(issuer);

        return capacity >= activeVolume + amount;
    }

    /// @notice Get reputation score (0-1000)
    /// @param issuer The issuer address
    function getReputationScore(address issuer) external view returns (uint256) {
        IssuerProfile memory profile = profiles[issuer];

        if (profile.invoicesIssued == 0) return 500; // Neutral for new issuers

        // Base score from payment success rate (0-600)
        uint256 successRate = (profile.invoicesPaid * 600) / profile.invoicesIssued;

        // Tenure bonus (0-200, max at 1 year)
        uint256 tenureDays = (block.timestamp - profile.firstInvoiceAt) / 1 days;
        uint256 tenureBonus = tenureDays > 365 ? 200 : (tenureDays * 200) / 365;

        // Volume bonus (0-200, based on stake ratio)
        uint256 volumeBonus = profile.stakedAmount > minStake * 10
            ? 200
            : (profile.stakedAmount * 200) / (minStake * 10);

        // Penalties
        uint256 fraudPenalty = profile.fraudPenalties * 200; // -200 per fraud
        uint256 defaultPenalty = profile.invoicesDefaulted * 20; // -20 per default

        uint256 score = successRate + tenureBonus + volumeBonus;
        uint256 penalties = fraudPenalty + defaultPenalty;

        return score > penalties ? score - penalties : 0;
    }

    /// @notice Get yield multiplier based on reputation (in basis points, 10000 = 1x)
    /// @param issuer The issuer address
    function getYieldMultiplier(address issuer) external view returns (uint256) {
        uint256 score = this.getReputationScore(issuer);

        // Score 0-500: 0.8x to 1.0x (8000-10000 bp)
        // Score 500-800: 1.0x to 1.2x (10000-12000 bp)
        // Score 800-1000: 1.2x to 1.5x (12000-15000 bp)

        if (score <= 500) {
            return 8000 + (score * 4); // 8000 to 10000
        } else if (score <= 800) {
            return 10000 + ((score - 500) * 6); // 10000 to 12000 (approx)
        } else {
            return 12000 + ((score - 800) * 15); // 12000 to 15000
        }
    }

    /// @notice Get active invoice volume (simplified - actual impl would track individually)
    /// @param issuer The issuer address
    function getActiveInvoiceVolume(address issuer) public view returns (uint256) {
        IssuerProfile memory profile = profiles[issuer];
        // Simplified: assume 50% of issued volume is still active
        // Real implementation would track individual invoices
        uint256 paidVolume = (profile.totalVolumeIssued * profile.invoicesPaid) /
            (profile.invoicesIssued > 0 ? profile.invoicesIssued : 1);
        return profile.totalVolumeIssued - paidVolume;
    }

    /// @notice Get issuer profile
    function getProfile(address issuer) external view returns (IssuerProfile memory) {
        return profiles[issuer];
    }
}
