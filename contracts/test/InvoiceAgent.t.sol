// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/InvoiceNFT.sol";
import "../src/YieldVault.sol";
import "../src/PrivacyRegistry.sol";
import "../src/AgentRouter.sol";
import "../src/MockOracle.sol";

contract InvoiceAgentTest is Test {
    InvoiceNFT public invoiceNFT;
    YieldVault public yieldVault;
    PrivacyRegistry public privacyRegistry;
    AgentRouter public agentRouter;
    MockOracle public mockOracle;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public agent = address(0x3);

    function setUp() public {
        // Deploy contracts
        invoiceNFT = new InvoiceNFT();
        yieldVault = new YieldVault(address(invoiceNFT));
        privacyRegistry = new PrivacyRegistry();
        agentRouter = new AgentRouter(address(invoiceNFT), address(yieldVault));
        mockOracle = new MockOracle(address(invoiceNFT));

        // Configure
        invoiceNFT.setYieldVault(address(yieldVault));
        invoiceNFT.setAgentRouter(address(agentRouter));
        invoiceNFT.setOracle(address(mockOracle));
        yieldVault.setAgentRouter(address(agentRouter));

        // Authorize agent
        agentRouter.authorizeAgent(agent);

        // Disable rate limiting for tests
        agentRouter.setDecisionCooldown(0);

        // Fund users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    // ============ InvoiceNFT Tests ============

    function test_MintInvoice() public {
        vm.startPrank(user1);

        bytes32 dataCommitment = keccak256(abi.encodePacked("invoice_data", bytes32(uint256(123))));
        bytes32 amountCommitment = keccak256(abi.encodePacked(uint256(10000), bytes32(uint256(456))));
        uint256 dueDate = block.timestamp + 60 days;

        uint256 tokenId = invoiceNFT.mint(dataCommitment, amountCommitment, dueDate);

        assertEq(invoiceNFT.ownerOf(tokenId), user1);
        assertEq(invoiceNFT.totalInvoices(), 1);

        InvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(invoice.dataCommitment, dataCommitment);
        assertEq(invoice.dueDate, dueDate);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.InvoiceStatus.Active));

        vm.stopPrank();
    }

    function test_VerifyReveal() public {
        vm.startPrank(user1);

        bytes memory invoiceData = "client:acme,amount:10000,due:2024-03-01";
        bytes32 salt = bytes32(uint256(12345));
        bytes32 dataCommitment = keccak256(abi.encodePacked(invoiceData, salt));
        bytes32 amountCommitment = keccak256(abi.encodePacked(uint256(10000), salt));

        uint256 tokenId = invoiceNFT.mint(dataCommitment, amountCommitment, block.timestamp + 60 days);

        // Verify reveal
        bool valid = invoiceNFT.verifyReveal(tokenId, invoiceData, salt);
        assertTrue(valid);

        // Invalid reveal should fail
        bool invalid = invoiceNFT.verifyReveal(tokenId, "wrong_data", salt);
        assertFalse(invalid);

        vm.stopPrank();
    }

    // ============ YieldVault Tests ============

    function test_DepositAndWithdraw() public {
        // Mint invoice
        vm.startPrank(user1);

        bytes32 dataCommitment = keccak256("test");
        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 60 days);

        // Approve vault
        invoiceNFT.approve(address(yieldVault), tokenId);

        // Deposit
        yieldVault.deposit(tokenId, YieldVault.Strategy.Conservative, 10000 ether);

        // Check deposit
        YieldVault.Deposit memory deposit = yieldVault.getDeposit(tokenId);
        assertTrue(deposit.active);
        assertEq(uint8(deposit.strategy), uint8(YieldVault.Strategy.Conservative));
        assertEq(deposit.principal, 10000 ether);

        // Check invoice status changed
        InvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(uint8(invoice.status), uint8(InvoiceNFT.InvoiceStatus.InYield));

        // Fast forward 30 days
        vm.warp(block.timestamp + 30 days);

        // Check accrued yield
        uint256 yield = yieldVault.getAccruedYield(tokenId);
        assertGt(yield, 0);

        // Withdraw
        yieldVault.withdraw(tokenId);

        // Check invoice returned
        assertEq(invoiceNFT.ownerOf(tokenId), user1);

        vm.stopPrank();
    }

    function test_ChangeStrategy() public {
        vm.startPrank(user1);

        bytes32 dataCommitment = keccak256("test");
        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 60 days);
        invoiceNFT.approve(address(yieldVault), tokenId);
        yieldVault.deposit(tokenId, YieldVault.Strategy.Hold, 10000 ether);

        // Change strategy
        yieldVault.changeStrategy(tokenId, YieldVault.Strategy.Aggressive);

        YieldVault.Deposit memory deposit = yieldVault.getDeposit(tokenId);
        assertEq(uint8(deposit.strategy), uint8(YieldVault.Strategy.Aggressive));

        vm.stopPrank();
    }

    // ============ PrivacyRegistry Tests ============

    function test_CommitmentFlow() public {
        vm.startPrank(user1);

        bytes memory data = "secret_invoice_data";
        bytes32 salt = bytes32(uint256(999));
        bytes32 commitment = keccak256(abi.encodePacked(data, salt));

        // Register commitment
        bytes32 commitmentId = privacyRegistry.registerCommitment(commitment);

        // Verify without revealing
        bool valid = privacyRegistry.verifyCommitment(commitmentId, data, salt);
        assertTrue(valid);

        // Reveal commitment
        bool revealed = privacyRegistry.revealCommitment(commitmentId, data, salt);
        assertTrue(revealed);

        // Check it's marked as revealed
        PrivacyRegistry.Commitment memory c = privacyRegistry.getCommitment(commitmentId);
        assertTrue(c.revealed);

        vm.stopPrank();
    }

    function test_MerkleProof() public {
        // Add verified invoices
        bytes32 invoice1 = keccak256("invoice1");
        bytes32 invoice2 = keccak256("invoice2");
        bytes32 invoice3 = keccak256("invoice3");

        privacyRegistry.addVerifiedInvoice(invoice1);
        privacyRegistry.addVerifiedInvoice(invoice2);
        privacyRegistry.addVerifiedInvoice(invoice3);

        // Check direct lookup
        assertTrue(privacyRegistry.isVerified(invoice1));
        assertTrue(privacyRegistry.isVerified(invoice2));
        assertFalse(privacyRegistry.isVerified(keccak256("unknown")));

        // Check Merkle root exists
        bytes32 root = privacyRegistry.getMerkleRoot();
        assertNotEq(root, bytes32(0));
    }

    // ============ AgentRouter Tests ============

    function test_RecordAndExecuteDecision() public {
        // Setup: mint and deposit invoice
        vm.startPrank(user1);
        bytes32 dataCommitment = keccak256("test");
        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 60 days);
        invoiceNFT.approve(address(yieldVault), tokenId);
        yieldVault.deposit(tokenId, YieldVault.Strategy.Hold, 10000 ether);
        vm.stopPrank();

        // Agent records decision
        vm.startPrank(agent);
        agentRouter.recordDecision(
            tokenId,
            YieldVault.Strategy.Aggressive,
            85,
            "High confidence invoice with long duration, recommending aggressive strategy"
        );
        vm.stopPrank();

        // Check decision was recorded and executed (auto-execute is on)
        AgentRouter.AgentDecision memory decision = agentRouter.getLatestDecision(tokenId);
        assertEq(uint8(decision.recommendedStrategy), uint8(YieldVault.Strategy.Aggressive));
        assertEq(decision.confidence, 85);
        assertTrue(decision.executed);

        // Check strategy actually changed
        YieldVault.Deposit memory deposit = yieldVault.getDeposit(tokenId);
        assertEq(uint8(deposit.strategy), uint8(YieldVault.Strategy.Aggressive));
    }

    // ============ MockOracle Tests ============

    function test_OracleRiskData() public {
        vm.startPrank(user1);
        bytes32 dataCommitment = keccak256("test");
        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 60 days);
        vm.stopPrank();

        // Set risk data
        mockOracle.setRiskData(tokenId, 85, 92);

        // Check oracle data
        assertEq(mockOracle.getRiskScore(tokenId), 85);
        assertEq(mockOracle.getPaymentProbability(tokenId), 92);

        // Check invoice was updated
        InvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(tokenId);
        assertEq(invoice.riskScore, 85);
        assertEq(invoice.paymentProbability, 92);
    }

    function test_SimulateRiskAssessment() public {
        vm.startPrank(user1);
        bytes32 dataCommitment = keccak256("test");
        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 60 days);
        vm.stopPrank();

        // Simulate risk assessment
        mockOracle.simulateRiskAssessment(tokenId);

        // Check scores were set
        uint8 riskScore = mockOracle.getRiskScore(tokenId);
        uint8 paymentProb = mockOracle.getPaymentProbability(tokenId);

        assertGt(riskScore, 0);
        assertLe(riskScore, 100);
        assertGt(paymentProb, 0);
        assertLe(paymentProb, 100);
    }

    // ============ Integration Test ============

    function test_FullFlow() public {
        // 1. User mints invoice
        vm.startPrank(user1);

        bytes memory invoiceData = abi.encodePacked("client:acme,amount:10000");
        bytes32 salt = bytes32(uint256(12345));
        bytes32 dataCommitment = keccak256(abi.encodePacked(invoiceData, salt));
        bytes32 amountCommitment = keccak256(abi.encodePacked(uint256(10000), salt));

        uint256 tokenId = invoiceNFT.mint(dataCommitment, amountCommitment, block.timestamp + 60 days);

        // 2. Register privacy commitment
        bytes32 commitmentId = privacyRegistry.registerCommitment(dataCommitment);

        // 3. Deposit to yield vault
        invoiceNFT.approve(address(yieldVault), tokenId);
        yieldVault.deposit(tokenId, YieldVault.Strategy.Hold, 10000 ether);

        vm.stopPrank();

        // 4. Oracle assesses risk
        mockOracle.simulateRiskAssessment(tokenId);

        // 5. Agent analyzes and makes decision
        vm.startPrank(agent);
        agentRouter.recordDecision(
            tokenId,
            YieldVault.Strategy.Conservative,
            80,
            "Moderate risk profile, conservative strategy recommended"
        );
        vm.stopPrank();

        // 6. Time passes, yield accrues
        vm.warp(block.timestamp + 30 days);

        // 7. Check yield
        uint256 yield = yieldVault.getAccruedYield(tokenId);
        assertGt(yield, 0);

        // 8. User withdraws
        vm.startPrank(user1);
        yieldVault.withdraw(tokenId);

        // 9. Verify invoice is back with user
        assertEq(invoiceNFT.ownerOf(tokenId), user1);

        vm.stopPrank();

        console.log("Full flow completed successfully!");
        console.log("Accrued yield:", yield);
    }

    // ============ Security Tests ============

    function test_RevertOnZeroAddress() public {
        // Test InvoiceNFT zero-address checks
        vm.expectRevert("Invalid address: zero");
        invoiceNFT.setYieldVault(address(0));

        vm.expectRevert("Invalid address: zero");
        invoiceNFT.setAgentRouter(address(0));

        vm.expectRevert("Invalid address: zero");
        invoiceNFT.setOracle(address(0));

        // Test YieldVault zero-address check
        vm.expectRevert("Invalid address: zero");
        yieldVault.setAgentRouter(address(0));
    }

    function test_RevertUnauthorizedAgent() public {
        address unauthorizedAgent = address(0x999);

        vm.startPrank(user1);
        bytes32 dataCommitment = keccak256("test");
        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 60 days);
        invoiceNFT.approve(address(yieldVault), tokenId);
        yieldVault.deposit(tokenId, YieldVault.Strategy.Hold, 10000 ether);
        vm.stopPrank();

        // Unauthorized agent tries to record decision
        vm.startPrank(unauthorizedAgent);
        vm.expectRevert("Not authorized agent");
        agentRouter.recordDecision(tokenId, YieldVault.Strategy.Aggressive, 80, "Trying to hack");
        vm.stopPrank();
    }

    function test_RevertNotDepositOwner() public {
        // User1 mints and deposits
        vm.startPrank(user1);
        bytes32 dataCommitment = keccak256("test");
        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 60 days);
        invoiceNFT.approve(address(yieldVault), tokenId);
        yieldVault.deposit(tokenId, YieldVault.Strategy.Hold, 10000 ether);
        vm.stopPrank();

        // User2 tries to withdraw
        vm.startPrank(user2);
        vm.expectRevert("Not deposit owner");
        yieldVault.withdraw(tokenId);
        vm.stopPrank();
    }

    function test_RevertMintPastDueDate() public {
        vm.startPrank(user1);
        bytes32 dataCommitment = keccak256("test");

        // Try to mint with past due date
        vm.expectRevert("Due date must be in future");
        invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp - 1);
        vm.stopPrank();
    }

    function test_RevertInvalidCommitment() public {
        vm.startPrank(user1);

        // Try to mint with zero commitment
        vm.expectRevert("Invalid data commitment");
        invoiceNFT.mint(bytes32(0), keccak256("amount"), block.timestamp + 60 days);
        vm.stopPrank();
    }

    function test_RevertDoubleDeposit() public {
        vm.startPrank(user1);
        bytes32 dataCommitment = keccak256("test");
        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 60 days);
        invoiceNFT.approve(address(yieldVault), tokenId);
        yieldVault.deposit(tokenId, YieldVault.Strategy.Hold, 10000 ether);

        // Try to deposit again (should fail because token is now owned by vault)
        vm.expectRevert();
        yieldVault.deposit(tokenId, YieldVault.Strategy.Aggressive, 5000 ether);
        vm.stopPrank();
    }

    // ============ Edge Case Tests ============

    function test_OverdueInvoice() public {
        vm.startPrank(user1);
        bytes32 dataCommitment = keccak256("test");
        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 1 days);
        vm.stopPrank();

        // Fast forward past due date
        vm.warp(block.timestamp + 5 days);

        // Check days until due is negative
        int256 daysUntilDue = invoiceNFT.getDaysUntilDue(tokenId);
        assertLt(daysUntilDue, 0);
    }

    function test_MultipleDepositsFromSameUser() public {
        vm.startPrank(user1);

        // Mint and deposit multiple invoices
        for (uint256 i = 0; i < 3; i++) {
            bytes32 dataCommitment = keccak256(abi.encodePacked("invoice", i));
            uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 60 days);
            invoiceNFT.approve(address(yieldVault), tokenId);
            yieldVault.deposit(tokenId, YieldVault.Strategy.Conservative, 10000 ether);
        }

        // Verify all deposits
        assertEq(invoiceNFT.totalInvoices(), 3);
        assertEq(yieldVault.totalValueLocked(), 30000 ether);

        vm.stopPrank();
    }

    function test_YieldAccumulationOverTime() public {
        uint256 startTime = block.timestamp;

        vm.startPrank(user1);
        bytes32 dataCommitment = keccak256("test");
        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, startTime + 365 days);
        invoiceNFT.approve(address(yieldVault), tokenId);
        yieldVault.deposit(tokenId, YieldVault.Strategy.Aggressive, 10000 ether);
        vm.stopPrank();

        // Check yield at different time points
        uint256 yield1 = yieldVault.getAccruedYield(tokenId);
        assertEq(yield1, 0); // No time passed

        vm.warp(startTime + 30 days);
        uint256 yield30 = yieldVault.getAccruedYield(tokenId);

        vm.warp(startTime + 60 days); // Now 60 days total from start
        uint256 yield60 = yieldVault.getAccruedYield(tokenId);

        assertGt(yield60, yield30);
        console.log("Yield at 30 days:", yield30);
        console.log("Yield at 60 days:", yield60);
    }

    // ============ Fuzz Tests ============

    function testFuzz_MintWithValidDueDate(uint256 daysFromNow) public {
        vm.assume(daysFromNow > 0 && daysFromNow < 365 * 10); // Up to 10 years

        vm.startPrank(user1);
        bytes32 dataCommitment = keccak256(abi.encodePacked("fuzz", daysFromNow));
        uint256 dueDate = block.timestamp + (daysFromNow * 1 days);

        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, dueDate);

        assertEq(invoiceNFT.ownerOf(tokenId), user1);
        vm.stopPrank();
    }

    function testFuzz_RiskScoreValidation(uint8 riskScore, uint8 paymentProb) public {
        vm.startPrank(user1);
        bytes32 dataCommitment = keccak256("test");
        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 60 days);
        vm.stopPrank();

        if (riskScore > 100 || paymentProb > 100) {
            // Should revert for invalid values
            if (riskScore > 100) {
                vm.expectRevert("Risk score > 100");
            } else {
                vm.expectRevert("Payment prob > 100");
            }
            mockOracle.setRiskData(tokenId, riskScore, paymentProb);
        } else {
            // Should succeed for valid values
            mockOracle.setRiskData(tokenId, riskScore, paymentProb);
            assertEq(mockOracle.getRiskScore(tokenId), riskScore);
            assertEq(mockOracle.getPaymentProbability(tokenId), paymentProb);
        }
    }

    function testFuzz_DepositPrincipal(uint256 principal) public {
        // Bound to valid range: 1 to MAX_PRINCIPAL
        vm.assume(principal > 0 && principal <= yieldVault.MAX_PRINCIPAL());

        vm.startPrank(user1);
        bytes32 dataCommitment = keccak256(abi.encodePacked("fuzz", principal));
        uint256 tokenId = invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 60 days);
        invoiceNFT.approve(address(yieldVault), tokenId);
        yieldVault.deposit(tokenId, YieldVault.Strategy.Conservative, principal);

        YieldVault.Deposit memory deposit = yieldVault.getDeposit(tokenId);
        assertEq(deposit.principal, principal);
        vm.stopPrank();
    }

    // ============ Gas Optimization Tests ============

    function test_GasOptimization_BatchMint() public {
        vm.startPrank(user1);

        uint256 gasStart = gasleft();

        for (uint256 i = 0; i < 10; i++) {
            bytes32 dataCommitment = keccak256(abi.encodePacked("batch", i));
            invoiceNFT.mint(dataCommitment, dataCommitment, block.timestamp + 60 days);
        }

        uint256 gasUsed = gasStart - gasleft();
        console.log("Gas used for 10 mints:", gasUsed);
        console.log("Average gas per mint:", gasUsed / 10);

        vm.stopPrank();
    }
}
