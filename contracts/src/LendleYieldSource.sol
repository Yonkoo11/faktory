// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ILendingPool - Lendle/Aave v2 lending pool interface
interface ILendingPool {
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);

    // Note: getReserveData is called via low-level call to avoid stack issues
}

/// @title IProtocolDataProvider - Lendle data provider interface
interface IProtocolDataProvider {
    function getReserveTokensAddresses(address asset) external view returns (
        address aTokenAddress,
        address stableDebtTokenAddress,
        address variableDebtTokenAddress
    );
}

/// @title LendleYieldSource - Real yield integration with Lendle on Mantle
/// @notice Connects Faktory Protocol to real DeFi yield via Lendle lending
/// @dev Supports depositing assets to Lendle and earning real APY
contract LendleYieldSource is Ownable {
    using SafeERC20 for IERC20;

    // Lendle addresses on Mantle Mainnet
    // These should be updated based on actual Lendle deployment
    address public lendingPool;
    address public dataProvider;

    // Supported assets for yield generation
    mapping(address => bool) public supportedAssets;

    // Track deposits per invoice
    struct YieldPosition {
        address asset;
        uint256 principal;
        uint256 depositTime;
        address aToken;
        address owner; // Who deposited - only they can withdraw
    }

    // Authorized vault that can deposit/withdraw on behalf of users
    address public authorizedVault;

    mapping(uint256 => YieldPosition) public positions;

    // RAY constant for Aave/Lendle math (27 decimals)
    uint256 constant RAY = 1e27;

    event Deposited(uint256 indexed tokenId, address asset, uint256 amount, address aToken, address owner);
    event Withdrawn(uint256 indexed tokenId, address asset, uint256 amount, uint256 yield);
    event AssetSupported(address asset, bool supported);
    event AuthorizedVaultSet(address vault);

    constructor(address _lendingPool, address _dataProvider) Ownable(msg.sender) {
        lendingPool = _lendingPool;
        dataProvider = _dataProvider;
    }

    /// @notice Set the authorized vault that can deposit/withdraw
    function setAuthorizedVault(address vault) external onlyOwner {
        authorizedVault = vault;
        emit AuthorizedVaultSet(vault);
    }

    /// @notice Add support for an asset
    function setAssetSupport(address asset, bool supported) external onlyOwner {
        supportedAssets[asset] = supported;
        emit AssetSupported(asset, supported);
    }

    /// @notice Deposit assets to Lendle for real yield
    /// @param tokenId The invoice token ID
    /// @param asset The asset to deposit (e.g., USDC, USDT, WETH)
    /// @param amount The amount to deposit
    function deposit(uint256 tokenId, address asset, uint256 amount) external {
        require(supportedAssets[asset], "Asset not supported");
        require(positions[tokenId].principal == 0, "Position exists");

        // Get aToken address
        (address aToken,,) = IProtocolDataProvider(dataProvider).getReserveTokensAddresses(asset);
        require(aToken != address(0), "Invalid reserve");

        // Transfer asset from caller
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Approve lending pool
        IERC20(asset).safeIncreaseAllowance(lendingPool, amount);

        // Deposit to Lendle
        ILendingPool(lendingPool).deposit(asset, amount, address(this), 0);

        // Record position with owner
        positions[tokenId] = YieldPosition({
            asset: asset,
            principal: amount,
            depositTime: block.timestamp,
            aToken: aToken,
            owner: msg.sender
        });

        emit Deposited(tokenId, asset, amount, aToken, msg.sender);
    }

    /// @notice Withdraw assets and yield from Lendle
    /// @param tokenId The invoice token ID
    /// @param to The address to send funds to
    function withdraw(uint256 tokenId, address to) external returns (uint256 totalAmount, uint256 yieldAmount) {
        YieldPosition memory pos = positions[tokenId];
        require(pos.principal > 0, "No position");

        // Only the position owner or authorized vault can withdraw
        require(
            msg.sender == pos.owner || msg.sender == authorizedVault || msg.sender == owner(),
            "Not authorized to withdraw"
        );

        // Get current aToken balance (includes accrued yield)
        uint256 aTokenBalance = IERC20(pos.aToken).balanceOf(address(this));

        // Withdraw from Lendle
        totalAmount = ILendingPool(lendingPool).withdraw(pos.asset, type(uint256).max, to);

        // Calculate yield
        yieldAmount = totalAmount > pos.principal ? totalAmount - pos.principal : 0;

        // Clear position
        delete positions[tokenId];

        emit Withdrawn(tokenId, pos.asset, totalAmount, yieldAmount);
    }

    /// @notice Get current yield for a position
    /// @param tokenId The invoice token ID
    function getCurrentYield(uint256 tokenId) external view returns (uint256) {
        YieldPosition memory pos = positions[tokenId];
        if (pos.principal == 0) return 0;

        // Get current aToken balance (includes yield)
        uint256 currentBalance = IERC20(pos.aToken).balanceOf(address(this));

        return currentBalance > pos.principal ? currentBalance - pos.principal : 0;
    }

    /// @notice Get real-time APY for an asset from Lendle
    /// @param asset The asset address
    /// @return apy The current supply APY in basis points (100 = 1%)
    function getCurrentAPY(address asset) external view returns (uint256 apy) {
        // Use low-level call to avoid stack too deep with complex Aave v2 structs
        (bool success, bytes memory data) = lendingPool.staticcall(
            abi.encodeWithSignature("getReserveData(address)", asset)
        );
        require(success, "Failed to get reserve data");

        // Aave v2 / Lendle ReserveData struct layout:
        // [0-31]:   configuration (ReserveConfigurationMap)
        // [32-63]:  liquidityIndex (uint128, packed)
        // [64-95]:  variableBorrowIndex (uint128, packed)
        // [96-127]: currentLiquidityRate (uint128)
        // ABI encoding uses 32 bytes per slot + 32 byte length prefix
        require(data.length >= 128, "Invalid reserve data length");

        uint256 currentLiquidityRate;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Load from: data pointer + 32 (length prefix) + 96 (4th slot)
            currentLiquidityRate := mload(add(data, 128))
        }

        // Convert from ray (27 decimals) to basis points (2 decimals)
        // Safe: currentLiquidityRate is uint128, division cannot overflow
        apy = currentLiquidityRate / 1e23;
    }

    /// @notice Get position details
    function getPosition(uint256 tokenId) external view returns (
        address asset,
        uint256 principal,
        uint256 currentValue,
        uint256 depositTime
    ) {
        YieldPosition memory pos = positions[tokenId];
        asset = pos.asset;
        principal = pos.principal;
        depositTime = pos.depositTime;

        if (pos.aToken != address(0)) {
            currentValue = IERC20(pos.aToken).balanceOf(address(this));
        }
    }

    /// @notice Update Lendle addresses (for upgrades)
    function setAddresses(address _lendingPool, address _dataProvider) external onlyOwner {
        lendingPool = _lendingPool;
        dataProvider = _dataProvider;
    }

    /// @notice Emergency withdraw (owner only)
    function emergencyWithdraw(address asset, uint256 amount, address to) external onlyOwner {
        IERC20(asset).safeTransfer(to, amount);
    }
}
