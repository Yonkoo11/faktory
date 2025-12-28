// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./InvoiceNFT.sol";
import "./YieldVault.sol";

/// @title FaktoryAgent - Executes AI agent decisions on-chain
/// @notice Routes agent actions to appropriate contracts
/// @dev Part of Faktory Protocol - Agent service calls this contract to execute yield strategies
contract AgentRouter is Ownable, Pausable {

    // ============ Structs ============

    struct AgentDecision {
        uint256 tokenId;
        YieldVault.Strategy recommendedStrategy;
        string reasoning;
        uint256 confidence;        // 0-100
        uint256 timestamp;
        bool executed;
    }

    struct AgentConfig {
        uint256 minConfidence;     // Minimum confidence to auto-execute
        uint256 maxGasPrice;       // Maximum gas price for execution
        bool autoExecute;          // Whether to auto-execute decisions
        bool active;               // Is agent active
    }

    // ============ State ============

    InvoiceNFT public invoiceNFT;
    YieldVault public yieldVault;

    // Authorized agent addresses
    mapping(address => bool) public authorizedAgents;

    // Decision history
    mapping(uint256 => AgentDecision[]) public decisionHistory;
    uint256 public totalDecisions;

    // Agent configuration
    AgentConfig public config;

    // Last analysis timestamp per invoice
    mapping(uint256 => uint256) public lastAnalysis;

    // Rate limiting: minimum seconds between decisions for same invoice
    uint256 public decisionCooldown = 5 minutes;

    // ============ Events ============

    event AgentAuthorized(address indexed agent);
    event AgentDeauthorized(address indexed agent);

    event DecisionRecorded(
        uint256 indexed tokenId,
        YieldVault.Strategy strategy,
        uint256 confidence,
        string reasoning
    );

    event DecisionExecuted(
        uint256 indexed tokenId,
        YieldVault.Strategy strategy,
        address indexed executor
    );

    event AnalysisRequested(
        uint256 indexed tokenId,
        address indexed requester
    );

    event ConfigUpdated(
        uint256 minConfidence,
        uint256 maxGasPrice,
        bool autoExecute
    );

    // ============ Modifiers ============

    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[msg.sender], "Not authorized agent");
        _;
    }

    // ============ Constructor ============

    constructor(address _invoiceNFT, address _yieldVault) Ownable(msg.sender) {
        invoiceNFT = InvoiceNFT(_invoiceNFT);
        yieldVault = YieldVault(_yieldVault);

        config = AgentConfig({
            minConfidence: 70,
            maxGasPrice: 100 gwei,
            autoExecute: true,
            active: true
        });

        // Owner is first authorized agent
        authorizedAgents[msg.sender] = true;
    }

    // ============ Admin Functions ============

    function authorizeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = true;
        emit AgentAuthorized(agent);
    }

    function deauthorizeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = false;
        emit AgentDeauthorized(agent);
    }

    function updateConfig(
        uint256 minConfidence,
        uint256 maxGasPrice,
        bool autoExecute
    ) external onlyOwner {
        require(minConfidence <= 100, "Invalid confidence");
        config.minConfidence = minConfidence;
        config.maxGasPrice = maxGasPrice;
        config.autoExecute = autoExecute;

        emit ConfigUpdated(minConfidence, maxGasPrice, autoExecute);
    }

    function setActive(bool active) external onlyOwner {
        config.active = active;
    }

    function setDecisionCooldown(uint256 cooldownSeconds) external onlyOwner {
        decisionCooldown = cooldownSeconds;
    }

    /// @notice Pause the agent router - blocks all decision recording and execution
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the agent router
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Agent Functions ============

    /// @notice Record an agent decision
    /// @param tokenId The invoice token ID
    /// @param strategy Recommended strategy
    /// @param confidence Confidence level (0-100)
    /// @param reasoning Human-readable reasoning
    function recordDecision(
        uint256 tokenId,
        YieldVault.Strategy strategy,
        uint256 confidence,
        string calldata reasoning
    ) external onlyAuthorizedAgent whenNotPaused returns (uint256 decisionIndex) {
        require(config.active, "Agent not active");
        require(confidence <= 100, "Invalid confidence");
        require(
            block.timestamp >= lastAnalysis[tokenId] + decisionCooldown,
            "Decision cooldown not elapsed"
        );

        AgentDecision memory decision = AgentDecision({
            tokenId: tokenId,
            recommendedStrategy: strategy,
            reasoning: reasoning,
            confidence: confidence,
            timestamp: block.timestamp,
            executed: false
        });

        decisionHistory[tokenId].push(decision);
        decisionIndex = decisionHistory[tokenId].length - 1;
        totalDecisions++;
        lastAnalysis[tokenId] = block.timestamp;

        emit DecisionRecorded(tokenId, strategy, confidence, reasoning);

        // Auto-execute if conditions met
        if (config.autoExecute &&
            confidence >= config.minConfidence &&
            tx.gasprice <= config.maxGasPrice) {
            _executeDecision(tokenId, decisionIndex);
        }
    }

    /// @notice Execute a recorded decision
    /// @param tokenId The invoice token ID
    /// @param decisionIndex Index in decision history
    function executeDecision(uint256 tokenId, uint256 decisionIndex) external whenNotPaused {
        require(config.active, "Agent not active");
        _executeDecision(tokenId, decisionIndex);
    }

    /// @notice Batch record and execute decisions
    function batchRecordAndExecute(
        uint256[] calldata tokenIds,
        YieldVault.Strategy[] calldata strategies,
        uint256[] calldata confidences,
        string[] calldata reasonings
    ) external onlyAuthorizedAgent whenNotPaused {
        require(config.active, "Agent not active");
        require(
            tokenIds.length == strategies.length &&
            tokenIds.length == confidences.length &&
            tokenIds.length == reasonings.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 decisionIndex = _recordDecisionInternal(
                tokenIds[i],
                strategies[i],
                confidences[i],
                reasonings[i]
            );

            if (confidences[i] >= config.minConfidence) {
                _executeDecision(tokenIds[i], decisionIndex);
            }
        }
    }

    /// @notice Request analysis for an invoice
    function requestAnalysis(uint256 tokenId) external {
        emit AnalysisRequested(tokenId, msg.sender);
    }

    // ============ Internal Functions ============

    function _executeDecision(uint256 tokenId, uint256 decisionIndex) internal {
        AgentDecision storage decision = decisionHistory[tokenId][decisionIndex];
        require(!decision.executed, "Already executed");

        YieldVault.Deposit memory deposit = yieldVault.getDeposit(tokenId);

        if (deposit.active) {
            // Execute strategy change via YieldVault
            yieldVault.executeAgentAction(
                tokenId,
                decision.recommendedStrategy,
                decision.reasoning
            );
        }

        decision.executed = true;
        emit DecisionExecuted(tokenId, decision.recommendedStrategy, msg.sender);
    }

    function _recordDecisionInternal(
        uint256 tokenId,
        YieldVault.Strategy strategy,
        uint256 confidence,
        string calldata reasoning
    ) internal returns (uint256 decisionIndex) {
        require(confidence <= 100, "Invalid confidence");

        AgentDecision memory decision = AgentDecision({
            tokenId: tokenId,
            recommendedStrategy: strategy,
            reasoning: reasoning,
            confidence: confidence,
            timestamp: block.timestamp,
            executed: false
        });

        decisionHistory[tokenId].push(decision);
        decisionIndex = decisionHistory[tokenId].length - 1;
        totalDecisions++;
        lastAnalysis[tokenId] = block.timestamp;

        emit DecisionRecorded(tokenId, strategy, confidence, reasoning);
    }

    // ============ View Functions ============

    function getDecisionHistory(uint256 tokenId)
        external
        view
        returns (AgentDecision[] memory)
    {
        return decisionHistory[tokenId];
    }

    function getLatestDecision(uint256 tokenId)
        external
        view
        returns (AgentDecision memory)
    {
        uint256 length = decisionHistory[tokenId].length;
        require(length > 0, "No decisions");
        return decisionHistory[tokenId][length - 1];
    }

    function getDecisionCount(uint256 tokenId) external view returns (uint256) {
        return decisionHistory[tokenId].length;
    }

    function isAgentAuthorized(address agent) external view returns (bool) {
        return authorizedAgents[agent];
    }

    function getConfig() external view returns (AgentConfig memory) {
        return config;
    }

    function needsAnalysis(uint256 tokenId, uint256 maxAge)
        external
        view
        returns (bool)
    {
        return block.timestamp - lastAnalysis[tokenId] > maxAge;
    }
}
