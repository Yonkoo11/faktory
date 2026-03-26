// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/InvoiceNFT.sol";
import "../src/YieldVault.sol";
import "../src/PrivacyRegistry.sol";
import "../src/AgentRouter.sol";
import "../src/MockOracle.sol";

/// @title Deploy - Local development deployment with MockOracle
/// @notice For Anvil/local testing only. Use DeployMultichain.s.sol for testnets/mainnets.
contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts (LOCAL) with deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        InvoiceNFT invoiceNFT = new InvoiceNFT();
        YieldVault yieldVault = new YieldVault(address(invoiceNFT));
        PrivacyRegistry privacyRegistry = new PrivacyRegistry();
        AgentRouter agentRouter = new AgentRouter(address(invoiceNFT), address(yieldVault));
        MockOracle mockOracle = new MockOracle(address(invoiceNFT));

        invoiceNFT.setYieldVault(address(yieldVault));
        invoiceNFT.setAgentRouter(address(agentRouter));
        invoiceNFT.setOracle(address(mockOracle));
        yieldVault.setAgentRouter(address(agentRouter));

        vm.stopBroadcast();

        console.log("\n=== Local Deployment Summary ===");
        console.log("InvoiceNFT:", address(invoiceNFT));
        console.log("YieldVault:", address(yieldVault));
        console.log("PrivacyRegistry:", address(privacyRegistry));
        console.log("AgentRouter:", address(agentRouter));
        console.log("MockOracle:", address(mockOracle));
    }
}
