// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/InvoiceNFT.sol";
import "../src/YieldVault.sol";
import "../src/PrivacyRegistry.sol";
import "../src/AgentRouter.sol";
import "../src/MockOracle.sol";

/// @title DeployCronos - Deployment script for Cronos chain
/// @notice Deploys Faktory Protocol to Cronos testnet/mainnet for x402 PayTech Hackathon
contract DeployCronosScript is Script {
    // Pyth Oracle addresses on Cronos
    address constant PYTH_CRONOS_MAINNET = 0xE0d0e68297772Dd5a1f1D99897c581E2082dbA5B;
    address constant PYTH_CRONOS_TESTNET = 0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320;

    // Chain IDs
    uint256 constant CRONOS_MAINNET_CHAIN_ID = 25;
    uint256 constant CRONOS_TESTNET_CHAIN_ID = 338;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        bool isMainnet = vm.envOr("MAINNET", false);

        // Validate chain ID to prevent deploying to wrong network
        uint256 expectedChainId = isMainnet ? CRONOS_MAINNET_CHAIN_ID : CRONOS_TESTNET_CHAIN_ID;
        require(
            block.chainid == expectedChainId,
            string.concat(
                "Wrong chain! Expected ",
                isMainnet ? "Cronos Mainnet (25)" : "Cronos Testnet (338)",
                " but connected to chain ",
                vm.toString(block.chainid)
            )
        );

        console.log("=== Faktory Cronos Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Network:", isMainnet ? "Cronos Mainnet" : "Cronos Testnet");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy InvoiceNFT
        InvoiceNFT invoiceNFT = new InvoiceNFT();
        console.log("InvoiceNFT deployed at:", address(invoiceNFT));

        // 2. Deploy YieldVault
        YieldVault yieldVault = new YieldVault(address(invoiceNFT));
        console.log("YieldVault deployed at:", address(yieldVault));

        // 3. Deploy PrivacyRegistry
        PrivacyRegistry privacyRegistry = new PrivacyRegistry();
        console.log("PrivacyRegistry deployed at:", address(privacyRegistry));

        // 4. Deploy AgentRouter
        AgentRouter agentRouter = new AgentRouter(
            address(invoiceNFT),
            address(yieldVault)
        );
        console.log("AgentRouter deployed at:", address(agentRouter));

        // 5. Deploy MockOracle (using simulated prices for hackathon demo)
        // Note: Pyth is available on Cronos but MockOracle is simpler for demo
        MockOracle mockOracle = new MockOracle(address(invoiceNFT));
        console.log("MockOracle deployed at:", address(mockOracle));

        // 6. Configure contracts
        invoiceNFT.setYieldVault(address(yieldVault));
        invoiceNFT.setAgentRouter(address(agentRouter));
        invoiceNFT.setOracle(address(mockOracle));

        yieldVault.setAgentRouter(address(agentRouter));

        console.log("Contracts configured successfully");

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== Cronos Deployment Summary ===");
        console.log("Network:", isMainnet ? "Cronos Mainnet (25)" : "Cronos Testnet (338)");
        console.log("");
        console.log("Core Contracts:");
        console.log("  InvoiceNFT:", address(invoiceNFT));
        console.log("  YieldVault:", address(yieldVault));
        console.log("  PrivacyRegistry:", address(privacyRegistry));
        console.log("  AgentRouter:", address(agentRouter));
        console.log("  MockOracle:", address(mockOracle));
        console.log("");
        console.log("Pyth Oracle (if needed later):");
        console.log("  Cronos Testnet:", PYTH_CRONOS_TESTNET);
        console.log("  Cronos Mainnet:", PYTH_CRONOS_MAINNET);
        console.log("");
        console.log("Update your .env files with these addresses!");
    }
}
