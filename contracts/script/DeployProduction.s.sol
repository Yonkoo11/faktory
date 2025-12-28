// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/InvoiceNFT.sol";
import "../src/YieldVault.sol";
import "../src/PrivacyRegistry.sol";
import "../src/AgentRouter.sol";
import "../src/PythOracle.sol";
import "../src/LendleYieldSource.sol";

/// @title DeployProduction - Production deployment with real integrations
/// @notice Deploys Faktory Protocol with Pyth Oracle and Lendle yield on Mantle
contract DeployProductionScript is Script {
    // Pyth Oracle addresses
    address constant PYTH_MANTLE_MAINNET = 0xA2aa501b19aff244D90cc15a4Cf739D2725B5729;
    address constant PYTH_MANTLE_SEPOLIA = 0x98046Bd286715D3B0BC227Dd7a956b83D8978603;

    // Lendle addresses on Mantle Mainnet (from docs.lendle.xyz)
    address constant LENDLE_LENDING_POOL = 0xCFa5aE7c2CE8Fadc6426C1ff872cA45378Fb7cF3;
    address constant LENDLE_DATA_PROVIDER = 0x552b9e4bae485C4B7F540777d7D25614CdB84773;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        bool isMainnet = vm.envOr("MAINNET", false);

        address pythAddress = isMainnet ? PYTH_MANTLE_MAINNET : PYTH_MANTLE_SEPOLIA;

        console.log("=== Faktory Production Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Network:", isMainnet ? "Mantle Mainnet" : "Mantle Sepolia");
        console.log("Pyth Oracle:", pythAddress);

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

        // 5. Deploy PythOracle (REAL oracle using Pyth Network)
        PythOracle pythOracle = new PythOracle(pythAddress);
        console.log("PythOracle deployed at:", address(pythOracle));

        // 6. Deploy LendleYieldSource (if data provider is set)
        address lendleYieldSource = address(0);
        if (LENDLE_DATA_PROVIDER != address(0)) {
            LendleYieldSource lendle = new LendleYieldSource(
                LENDLE_LENDING_POOL,
                LENDLE_DATA_PROVIDER
            );
            lendleYieldSource = address(lendle);
            console.log("LendleYieldSource deployed at:", lendleYieldSource);
        } else {
            console.log("LendleYieldSource: Skipped (no data provider configured)");
        }

        // 7. Configure contracts
        invoiceNFT.setYieldVault(address(yieldVault));
        invoiceNFT.setAgentRouter(address(agentRouter));
        invoiceNFT.setOracle(address(pythOracle));

        yieldVault.setAgentRouter(address(agentRouter));

        console.log("Contracts configured successfully");

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== Production Deployment Summary ===");
        console.log("Network:", isMainnet ? "Mantle Mainnet (5000)" : "Mantle Sepolia (5003)");
        console.log("");
        console.log("Core Contracts:");
        console.log("  InvoiceNFT:", address(invoiceNFT));
        console.log("  YieldVault:", address(yieldVault));
        console.log("  PrivacyRegistry:", address(privacyRegistry));
        console.log("  AgentRouter:", address(agentRouter));
        console.log("");
        console.log("Real Data Sources:");
        console.log("  PythOracle:", address(pythOracle));
        console.log("  LendleYieldSource:", lendleYieldSource);
        console.log("");
        console.log("External Dependencies:");
        console.log("  Pyth Network:", pythAddress);
        if (LENDLE_DATA_PROVIDER != address(0)) {
            console.log("  Lendle LendingPool:", LENDLE_LENDING_POOL);
            console.log("  Lendle DataProvider:", LENDLE_DATA_PROVIDER);
        }
        console.log("");
        console.log("Update your .env files with these addresses!");
    }
}
