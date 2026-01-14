// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/InvoiceNFT.sol";
import "../src/YieldVault.sol";
import "../src/PrivacyRegistry.sol";
import "../src/AgentRouter.sol";
import "../src/MockOracle.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with deployer:", deployer);

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

        // 5. Deploy MockOracle
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
        console.log("\n=== Deployment Summary ===");
        console.log("InvoiceNFT:", address(invoiceNFT));
        console.log("YieldVault:", address(yieldVault));
        console.log("PrivacyRegistry:", address(privacyRegistry));
        console.log("AgentRouter:", address(agentRouter));
        console.log("MockOracle:", address(mockOracle));
    }
}
