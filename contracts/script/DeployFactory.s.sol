// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/FaktoryFactory.sol";

/// @title DeployFactory - Simplified deployment using factory pattern
/// @notice Deploys entire protocol in one atomic transaction
contract DeployFactoryScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Faktory Protocol with deployer:", deployer);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy factory (can be reused for multiple deployments)
        FaktoryFactory factory = new FaktoryFactory();
        console.log("FaktoryFactory deployed at:", address(factory));

        // Deploy entire protocol atomically
        FaktoryFactory.DeployedContracts memory contracts = factory.deployProtocol();

        vm.stopBroadcast();

        // Log deployment summary
        console.log("");
        console.log("=== Faktory Protocol Deployed ===");
        console.log("InvoiceNFT:      ", contracts.invoiceNFT);
        console.log("YieldVault:      ", contracts.yieldVault);
        console.log("AgentRouter:     ", contracts.agentRouter);
        console.log("MockOracle:      ", contracts.mockOracle);
        console.log("PrivacyRegistry: ", contracts.privacyRegistry);
        console.log("");
        console.log("All contracts owned by:", deployer);
        console.log("All cross-references configured automatically");
    }
}
