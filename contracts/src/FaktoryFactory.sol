// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./InvoiceNFT.sol";
import "./YieldVault.sol";
import "./AgentRouter.sol";
import "./MockOracle.sol";
import "./PrivacyRegistry.sol";

/// @title FaktoryFactory - Atomic deployment of Faktory Protocol
/// @notice Deploys and configures all protocol contracts in a single transaction
/// @dev Eliminates circular dependency issues by handling initialization order internally
contract FaktoryFactory {

    struct DeployedContracts {
        address invoiceNFT;
        address yieldVault;
        address agentRouter;
        address mockOracle;
        address privacyRegistry;
    }

    event ProtocolDeployed(
        address indexed deployer,
        address invoiceNFT,
        address yieldVault,
        address agentRouter,
        address mockOracle,
        address privacyRegistry
    );

    /// @notice Deploy the complete Faktory Protocol stack
    /// @return contracts Struct containing all deployed contract addresses
    function deployProtocol() external returns (DeployedContracts memory contracts) {
        // Step 1: Deploy core contracts (order matters for constructor deps)
        InvoiceNFT invoiceNFT = new InvoiceNFT();
        YieldVault yieldVault = new YieldVault(address(invoiceNFT));
        AgentRouter agentRouter = new AgentRouter(address(invoiceNFT), address(yieldVault));
        MockOracle mockOracle = new MockOracle(address(invoiceNFT));
        PrivacyRegistry privacyRegistry = new PrivacyRegistry();

        // Step 2: Wire up cross-references (these are the circular deps)
        invoiceNFT.setYieldVault(address(yieldVault));
        invoiceNFT.setAgentRouter(address(agentRouter));
        invoiceNFT.setOracle(address(mockOracle));
        yieldVault.setAgentRouter(address(agentRouter));

        // Step 3: Transfer ownership to deployer
        invoiceNFT.transferOwnership(msg.sender);
        yieldVault.transferOwnership(msg.sender);
        agentRouter.transferOwnership(msg.sender);
        mockOracle.transferOwnership(msg.sender);
        privacyRegistry.transferOwnership(msg.sender);

        // Step 4: Return addresses
        contracts = DeployedContracts({
            invoiceNFT: address(invoiceNFT),
            yieldVault: address(yieldVault),
            agentRouter: address(agentRouter),
            mockOracle: address(mockOracle),
            privacyRegistry: address(privacyRegistry)
        });

        emit ProtocolDeployed(
            msg.sender,
            contracts.invoiceNFT,
            contracts.yieldVault,
            contracts.agentRouter,
            contracts.mockOracle,
            contracts.privacyRegistry
        );
    }

    /// @notice Deploy protocol with custom oracle (for production with Pyth)
    /// @param oracleAddress Pre-deployed oracle address (e.g., PythOracle)
    function deployProtocolWithOracle(address oracleAddress) external returns (DeployedContracts memory contracts) {
        require(oracleAddress != address(0), "Invalid oracle address");

        // Step 1: Deploy core contracts
        InvoiceNFT invoiceNFT = new InvoiceNFT();
        YieldVault yieldVault = new YieldVault(address(invoiceNFT));
        AgentRouter agentRouter = new AgentRouter(address(invoiceNFT), address(yieldVault));
        PrivacyRegistry privacyRegistry = new PrivacyRegistry();

        // Step 2: Wire up cross-references
        invoiceNFT.setYieldVault(address(yieldVault));
        invoiceNFT.setAgentRouter(address(agentRouter));
        invoiceNFT.setOracle(oracleAddress);
        yieldVault.setAgentRouter(address(agentRouter));

        // Step 3: Transfer ownership to deployer
        invoiceNFT.transferOwnership(msg.sender);
        yieldVault.transferOwnership(msg.sender);
        agentRouter.transferOwnership(msg.sender);
        privacyRegistry.transferOwnership(msg.sender);

        // Step 4: Return addresses
        contracts = DeployedContracts({
            invoiceNFT: address(invoiceNFT),
            yieldVault: address(yieldVault),
            agentRouter: address(agentRouter),
            mockOracle: oracleAddress,  // External oracle
            privacyRegistry: address(privacyRegistry)
        });

        emit ProtocolDeployed(
            msg.sender,
            contracts.invoiceNFT,
            contracts.yieldVault,
            contracts.agentRouter,
            contracts.mockOracle,
            contracts.privacyRegistry
        );
    }
}
