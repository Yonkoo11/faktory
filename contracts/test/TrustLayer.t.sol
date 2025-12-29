// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BuyerConfirmation.sol";
import "../src/ReputationStaking.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 for testing
contract MockToken is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {
        _mint(msg.sender, 1_000_000 * 1e18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract BuyerConfirmationTest is Test {
    BuyerConfirmation public confirmation;

    address public issuer = address(0x1);
    address public buyer;
    uint256 public buyerPrivateKey = 0xBEEF;

    uint256 public constant INVOICE_ID = 1;
    uint256 public constant AMOUNT = 10000 * 1e18;
    uint256 public dueDate;

    function setUp() public {
        confirmation = new BuyerConfirmation();
        buyer = vm.addr(buyerPrivateKey);
        dueDate = block.timestamp + 30 days;
    }

    function _createSignature(
        uint256 invoiceId,
        uint256 amount,
        uint256 _dueDate,
        address _issuer
    ) internal view returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            invoiceId,
            amount,
            _dueDate,
            _issuer,
            block.chainid
        ));
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(buyerPrivateKey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }

    function test_ConfirmInvoice() public {
        bytes memory signature = _createSignature(INVOICE_ID, AMOUNT, dueDate, issuer);

        vm.prank(buyer);
        confirmation.confirmInvoice(INVOICE_ID, AMOUNT, dueDate, issuer, signature);

        BuyerConfirmation.Confirmation memory conf = confirmation.getConfirmation(INVOICE_ID);
        assertEq(conf.buyer, buyer);
        assertEq(conf.amount, AMOUNT);
        assertEq(conf.dueDate, dueDate);
        assertTrue(conf.confirmedAt > 0);
        assertFalse(conf.paid);
    }

    function test_ConfirmInvoice_EmitsEvent() public {
        bytes memory signature = _createSignature(INVOICE_ID, AMOUNT, dueDate, issuer);

        vm.expectEmit(true, true, true, true);
        emit BuyerConfirmation.InvoiceConfirmed(INVOICE_ID, buyer, issuer, AMOUNT, dueDate);

        vm.prank(buyer);
        confirmation.confirmInvoice(INVOICE_ID, AMOUNT, dueDate, issuer, signature);
    }

    function test_ConfirmInvoice_RevertIfAlreadyConfirmed() public {
        bytes memory signature = _createSignature(INVOICE_ID, AMOUNT, dueDate, issuer);

        vm.prank(buyer);
        confirmation.confirmInvoice(INVOICE_ID, AMOUNT, dueDate, issuer, signature);

        vm.expectRevert("Already confirmed");
        vm.prank(buyer);
        confirmation.confirmInvoice(INVOICE_ID, AMOUNT, dueDate, issuer, signature);
    }

    function test_ConfirmInvoice_RevertInvalidSignature() public {
        bytes memory signature = _createSignature(INVOICE_ID, AMOUNT, dueDate, issuer);

        vm.expectRevert("Invalid signature");
        vm.prank(address(0x999)); // Wrong signer
        confirmation.confirmInvoice(INVOICE_ID, AMOUNT, dueDate, issuer, signature);
    }

    function test_ConfirmInvoice_RevertPastDueDate() public {
        uint256 pastDueDate = block.timestamp - 1;
        bytes memory signature = _createSignature(INVOICE_ID, AMOUNT, pastDueDate, issuer);

        vm.expectRevert("Due date must be future");
        vm.prank(buyer);
        confirmation.confirmInvoice(INVOICE_ID, AMOUNT, pastDueDate, issuer, signature);
    }

    function test_RecordPayment() public {
        // First confirm
        bytes memory signature = _createSignature(INVOICE_ID, AMOUNT, dueDate, issuer);
        vm.prank(buyer);
        confirmation.confirmInvoice(INVOICE_ID, AMOUNT, dueDate, issuer, signature);

        // Set up oracle
        address oracle = address(0x123);
        confirmation.setPaymentOracle(oracle, true);

        // Record payment
        vm.prank(oracle);
        confirmation.recordPayment(INVOICE_ID, AMOUNT);

        BuyerConfirmation.Confirmation memory conf = confirmation.getConfirmation(INVOICE_ID);
        assertTrue(conf.paid);
        assertEq(conf.paidAmount, AMOUNT);
    }

    function test_RecordPayment_RevertUnauthorized() public {
        bytes memory signature = _createSignature(INVOICE_ID, AMOUNT, dueDate, issuer);
        vm.prank(buyer);
        confirmation.confirmInvoice(INVOICE_ID, AMOUNT, dueDate, issuer, signature);

        vm.expectRevert("Not authorized");
        vm.prank(address(0x999));
        confirmation.recordPayment(INVOICE_ID, AMOUNT);
    }

    function test_GetTrustTier() public {
        // Before confirmation
        assertEq(uint(confirmation.getTrustTier(INVOICE_ID)), uint(BuyerConfirmation.TrustTier.Unverified));

        // After confirmation
        bytes memory signature = _createSignature(INVOICE_ID, AMOUNT, dueDate, issuer);
        vm.prank(buyer);
        confirmation.confirmInvoice(INVOICE_ID, AMOUNT, dueDate, issuer, signature);

        assertEq(uint(confirmation.getTrustTier(INVOICE_ID)), uint(BuyerConfirmation.TrustTier.BuyerConfirmed));
    }

    function test_GetBuyerReliabilityScore_NewBuyer() public {
        assertEq(confirmation.getBuyerReliabilityScore(buyer), 50);
    }

    function test_GetBuyerReliabilityScore_PerfectHistory() public {
        address oracle = address(0x123);
        confirmation.setPaymentOracle(oracle, true);

        // Confirm and pay 5 invoices
        for (uint256 i = 1; i <= 5; i++) {
            uint256 futureDue = block.timestamp + 30 days;
            bytes memory signature = _createSignature(i, AMOUNT, futureDue, issuer);
            vm.prank(buyer);
            confirmation.confirmInvoice(i, AMOUNT, futureDue, issuer, signature);

            vm.prank(oracle);
            confirmation.recordPayment(i, AMOUNT);
        }

        // Should have 100% payment rate
        assertEq(confirmation.getBuyerReliabilityScore(buyer), 100);
    }

    function test_MarkDefaulted() public {
        bytes memory signature = _createSignature(INVOICE_ID, AMOUNT, dueDate, issuer);
        vm.prank(buyer);
        confirmation.confirmInvoice(INVOICE_ID, AMOUNT, dueDate, issuer, signature);

        address oracle = address(0x123);
        confirmation.setPaymentOracle(oracle, true);

        // Warp past due date + grace period
        vm.warp(dueDate + 31 days);

        vm.expectEmit(true, true, false, true);
        emit BuyerConfirmation.BuyerDefaulted(INVOICE_ID, buyer, AMOUNT, 31);

        vm.prank(oracle);
        confirmation.markDefaulted(INVOICE_ID, 30);
    }
}

contract ReputationStakingTest is Test {
    ReputationStaking public staking;
    MockToken public token;

    address public issuer = address(0x1);
    address public reporter = address(0x2);

    uint256 public constant STAKE_AMOUNT = 1000 * 1e18;
    uint256 public constant INVOICE_AMOUNT = 5000 * 1e18;

    function setUp() public {
        token = new MockToken();
        staking = new ReputationStaking(address(token));

        // Fund issuer
        token.mint(issuer, 100_000 * 1e18);

        // Set up reporter
        staking.setAuthorizedReporter(reporter, true);
    }

    function test_Stake() public {
        vm.startPrank(issuer);
        token.approve(address(staking), STAKE_AMOUNT);
        staking.stake(STAKE_AMOUNT);
        vm.stopPrank();

        ReputationStaking.IssuerProfile memory profile = staking.getProfile(issuer);
        assertEq(profile.stakedAmount, STAKE_AMOUNT);
        assertTrue(profile.active);
    }

    function test_Stake_EmitsEvent() public {
        vm.startPrank(issuer);
        token.approve(address(staking), STAKE_AMOUNT);

        vm.expectEmit(true, false, false, true);
        emit ReputationStaking.Staked(issuer, STAKE_AMOUNT, STAKE_AMOUNT);

        staking.stake(STAKE_AMOUNT);
        vm.stopPrank();
    }

    function test_Unstake() public {
        // First stake
        vm.startPrank(issuer);
        token.approve(address(staking), STAKE_AMOUNT);
        staking.stake(STAKE_AMOUNT);

        uint256 balanceBefore = token.balanceOf(issuer);
        staking.unstake(STAKE_AMOUNT / 2);
        uint256 balanceAfter = token.balanceOf(issuer);
        vm.stopPrank();

        assertEq(balanceAfter - balanceBefore, STAKE_AMOUNT / 2);

        ReputationStaking.IssuerProfile memory profile = staking.getProfile(issuer);
        assertEq(profile.stakedAmount, STAKE_AMOUNT / 2);
    }

    function test_CanMintInvoice() public {
        vm.startPrank(issuer);
        token.approve(address(staking), STAKE_AMOUNT);
        staking.stake(STAKE_AMOUNT);
        vm.stopPrank();

        // With 1000 stake and 10x leverage, can mint up to 10000
        assertTrue(staking.canMintInvoice(issuer, INVOICE_AMOUNT));
        assertTrue(staking.canMintInvoice(issuer, 10000 * 1e18));
        assertFalse(staking.canMintInvoice(issuer, 10001 * 1e18));
    }

    function test_CanMintInvoice_InactiveIssuer() public {
        assertFalse(staking.canMintInvoice(issuer, INVOICE_AMOUNT));
    }

    function test_RecordInvoiceIssued() public {
        vm.startPrank(issuer);
        token.approve(address(staking), STAKE_AMOUNT);
        staking.stake(STAKE_AMOUNT);
        vm.stopPrank();

        vm.prank(reporter);
        staking.recordInvoiceIssued(issuer, 1, INVOICE_AMOUNT);

        ReputationStaking.IssuerProfile memory profile = staking.getProfile(issuer);
        assertEq(profile.invoicesIssued, 1);
        assertEq(profile.totalVolumeIssued, INVOICE_AMOUNT);
    }

    function test_RecordInvoiceIssued_RevertExceedsCapacity() public {
        vm.startPrank(issuer);
        token.approve(address(staking), STAKE_AMOUNT);
        staking.stake(STAKE_AMOUNT);
        vm.stopPrank();

        vm.expectRevert("Exceeds leverage capacity");
        vm.prank(reporter);
        staking.recordInvoiceIssued(issuer, 1, 20000 * 1e18); // Exceeds 10x leverage
    }

    function test_SlashForFraud() public {
        vm.startPrank(issuer);
        token.approve(address(staking), STAKE_AMOUNT);
        staking.stake(STAKE_AMOUNT);
        vm.stopPrank();

        uint256 expectedSlash = (STAKE_AMOUNT * 5000) / 10000; // 50%

        vm.prank(reporter);
        staking.slashForFraud(issuer, 1);

        ReputationStaking.IssuerProfile memory profile = staking.getProfile(issuer);
        assertEq(profile.stakedAmount, STAKE_AMOUNT - expectedSlash);
        assertEq(profile.fraudPenalties, 1);
    }

    function test_GetReputationScore_NewIssuer() public {
        assertEq(staking.getReputationScore(issuer), 500);
    }

    function test_GetReputationScore_GoodHistory() public {
        vm.startPrank(issuer);
        token.approve(address(staking), STAKE_AMOUNT);
        staking.stake(STAKE_AMOUNT);
        vm.stopPrank();

        // Record 10 invoices, all paid
        for (uint256 i = 1; i <= 10; i++) {
            vm.prank(reporter);
            staking.recordInvoiceIssued(issuer, i, 100 * 1e18);

            vm.prank(reporter);
            staking.recordPayment(issuer, i);
        }

        // Warp 6 months for tenure bonus
        vm.warp(block.timestamp + 180 days);

        uint256 score = staking.getReputationScore(issuer);
        assertTrue(score > 600); // Should have good score
    }

    function test_GetYieldMultiplier() public {
        // New issuer (score 500) should get 1.0x (10000 bp)
        uint256 multiplier = staking.getYieldMultiplier(issuer);
        assertEq(multiplier, 10000);

        // After staking and good history, should increase
        vm.startPrank(issuer);
        token.approve(address(staking), STAKE_AMOUNT * 10);
        staking.stake(STAKE_AMOUNT * 10);
        vm.stopPrank();

        for (uint256 i = 1; i <= 5; i++) {
            vm.prank(reporter);
            staking.recordInvoiceIssued(issuer, i, 100 * 1e18);
            vm.prank(reporter);
            staking.recordPayment(issuer, i);
        }

        vm.warp(block.timestamp + 365 days);

        multiplier = staking.getYieldMultiplier(issuer);
        assertTrue(multiplier > 10000); // Should be above 1.0x
    }

    function test_RecordDefault_AffectsScore() public {
        vm.startPrank(issuer);
        token.approve(address(staking), STAKE_AMOUNT);
        staking.stake(STAKE_AMOUNT);
        vm.stopPrank();

        // Record invoice
        vm.prank(reporter);
        staking.recordInvoiceIssued(issuer, 1, INVOICE_AMOUNT);

        // Record default
        vm.prank(reporter);
        staking.recordDefault(issuer, 1);

        ReputationStaking.IssuerProfile memory profile = staking.getProfile(issuer);
        assertEq(profile.invoicesDefaulted, 1);

        // Score should be penalized
        uint256 score = staking.getReputationScore(issuer);
        assertTrue(score < 500); // Below neutral
    }
}
