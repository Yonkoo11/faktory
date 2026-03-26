// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/InvoiceNFT.sol";
import "../src/YieldVault.sol";
import "../src/PrivacyRegistry.sol";
import "../src/AgentRouter.sol";
import "../src/PythOracle.sol";
import "../src/AaveV3YieldSource.sol";

/// @title DeployMultichain - Deploy Faktory to any supported chain
/// @notice Reads chain config and deploys with PythOracle + AaveV3YieldSource
/// @dev Usage: PYTH=0x... AAVE_POOL=0x... forge script DeployMultichain -f $RPC --broadcast
contract DeployMultichainScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Chain-specific addresses from environment
        address pythAddress = vm.envOr("PYTH", address(0));
        address aavePool = vm.envOr("AAVE_POOL", address(0));

        bool hasPyth = pythAddress != address(0);
        bool hasAave = aavePool != address(0);

        console.log("=== Faktory Multichain Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Pyth Oracle:", hasPyth ? pythAddress : address(0));
        console.log("Aave V3 Pool:", hasAave ? aavePool : address(0));

        vm.startBroadcast(deployerPrivateKey);

        // Core contracts (always deployed)
        InvoiceNFT invoiceNFT = new InvoiceNFT();
        YieldVault yieldVault = new YieldVault(address(invoiceNFT));
        PrivacyRegistry privacyRegistry = new PrivacyRegistry();
        AgentRouter agentRouter = new AgentRouter(address(invoiceNFT), address(yieldVault));

        // Oracle: PythOracle if Pyth available, otherwise skip (SKALE)
        address oracleAddress;
        if (hasPyth) {
            PythOracle pythOracle = new PythOracle(pythAddress);
            oracleAddress = address(pythOracle);
            console.log("PythOracle deployed at:", oracleAddress);
        } else {
            console.log("PythOracle: SKIPPED (no Pyth on this chain)");
        }

        // Yield source: AaveV3 if pool available, otherwise Hold only (SKALE)
        address yieldSourceAddress;
        if (hasAave) {
            AaveV3YieldSource yieldSource = new AaveV3YieldSource(aavePool);
            yieldSourceAddress = address(yieldSource);
            yieldSource.setAuthorizedVault(address(yieldVault));
            console.log("AaveV3YieldSource deployed at:", yieldSourceAddress);
        } else {
            console.log("AaveV3YieldSource: SKIPPED (Hold only on this chain)");
        }

        // Wire contracts
        invoiceNFT.setYieldVault(address(yieldVault));
        invoiceNFT.setAgentRouter(address(agentRouter));
        if (oracleAddress != address(0)) {
            invoiceNFT.setOracle(oracleAddress);
        }
        yieldVault.setAgentRouter(address(agentRouter));
        if (yieldSourceAddress != address(0)) {
            yieldVault.setYieldSource(yieldSourceAddress);
        }

        vm.stopBroadcast();

        // Output deployment addresses as JSON-like for easy parsing
        console.log("\n=== Deployment Addresses ===");
        console.log("CHAIN_ID:", vm.toString(block.chainid));
        console.log("INVOICE_NFT:", vm.toString(address(invoiceNFT)));
        console.log("YIELD_VAULT:", vm.toString(address(yieldVault)));
        console.log("PRIVACY_REGISTRY:", vm.toString(address(privacyRegistry)));
        console.log("AGENT_ROUTER:", vm.toString(address(agentRouter)));
        console.log("PYTH_ORACLE:", vm.toString(oracleAddress));
        console.log("AAVE_YIELD_SOURCE:", vm.toString(yieldSourceAddress));
    }
}
