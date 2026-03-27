// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title IAaveV3Pool - Minimal Aave V3 Pool interface
interface IAaveV3Pool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function getReserveData(address asset) external view returns (ReserveData memory);

    struct ReserveData {
        ReserveConfigurationMap configuration;
        uint128 liquidityIndex;
        uint128 currentLiquidityRate;
        uint128 variableBorrowIndex;
        uint128 currentVariableBorrowRate;
        uint128 currentStableBorrowRate;
        uint40 lastUpdateTimestamp;
        uint16 id;
        address aTokenAddress;
        address stableDebtTokenAddress;
        address variableDebtTokenAddress;
        address interestRateStrategyAddress;
        uint128 accruedToTreasury;
        uint128 unbacked;
        uint128 isolationModeTotalDebt;
    }

    struct ReserveConfigurationMap {
        uint256 data;
    }
}

/// @title AaveV3YieldSource - Real yield via Aave V3 on multiple chains
/// @notice Deposits assets to Aave V3 lending pools for real yield generation
/// @dev Native Aave V3 integration for real yield generation
contract AaveV3YieldSource is Ownable {
    using SafeERC20 for IERC20;

    IAaveV3Pool public pool;
    address public authorizedVault;

    struct YieldPosition {
        address asset;
        uint256 principal;
        uint256 depositTime;
        address aToken;
        address depositor;
    }

    mapping(uint256 => YieldPosition) public positions;

    event Deposited(uint256 indexed tokenId, address asset, uint256 amount, address aToken, address depositor);
    event Withdrawn(uint256 indexed tokenId, address asset, uint256 totalAmount, uint256 yieldAmount);
    event AuthorizedVaultSet(address vault);
    event PoolUpdated(address newPool);

    constructor(address _pool) Ownable(msg.sender) {
        require(_pool != address(0), "Invalid pool address");
        pool = IAaveV3Pool(_pool);
    }

    function setAuthorizedVault(address _vault) external onlyOwner {
        authorizedVault = _vault;
        emit AuthorizedVaultSet(_vault);
    }

    function setPool(address _pool) external onlyOwner {
        require(_pool != address(0), "Invalid pool address");
        pool = IAaveV3Pool(_pool);
        emit PoolUpdated(_pool);
    }

    /// @notice Deposit assets to Aave V3 for yield
    /// @param tokenId Invoice token ID
    /// @param asset ERC20 asset to deposit (e.g. USDC)
    /// @param amount Amount to deposit
    function deposit(uint256 tokenId, address asset, uint256 amount) external {
        require(msg.sender == authorizedVault || msg.sender == owner(), "Not authorized");
        require(positions[tokenId].principal == 0, "Position already exists");
        require(amount > 0, "Zero amount");

        // Get aToken address from Aave
        IAaveV3Pool.ReserveData memory reserve = pool.getReserveData(asset);
        require(reserve.aTokenAddress != address(0), "Asset not supported by Aave");

        // Transfer asset from caller
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Approve and supply to Aave V3
        IERC20(asset).safeIncreaseAllowance(address(pool), amount);
        pool.supply(asset, amount, address(this), 0);

        positions[tokenId] = YieldPosition({
            asset: asset,
            principal: amount,
            depositTime: block.timestamp,
            aToken: reserve.aTokenAddress,
            depositor: msg.sender
        });

        emit Deposited(tokenId, asset, amount, reserve.aTokenAddress, msg.sender);
    }

    /// @notice Withdraw assets + yield from Aave V3
    /// @param tokenId Invoice token ID
    /// @param to Address to receive funds
    function withdraw(uint256 tokenId, address to) external returns (uint256 totalAmount, uint256 yieldAmount) {
        YieldPosition memory pos = positions[tokenId];
        require(pos.principal > 0, "No position");
        require(
            msg.sender == pos.depositor || msg.sender == authorizedVault || msg.sender == owner(),
            "Not authorized"
        );

        // Withdraw max from Aave (principal + accrued yield)
        totalAmount = pool.withdraw(pos.asset, type(uint256).max, to);
        yieldAmount = totalAmount > pos.principal ? totalAmount - pos.principal : 0;

        delete positions[tokenId];

        emit Withdrawn(tokenId, pos.asset, totalAmount, yieldAmount);
    }

    /// @notice Get current yield for a position
    function getCurrentYield(uint256 tokenId) external view returns (uint256) {
        YieldPosition memory pos = positions[tokenId];
        if (pos.principal == 0) return 0;

        uint256 currentBalance = IERC20(pos.aToken).balanceOf(address(this));
        return currentBalance > pos.principal ? currentBalance - pos.principal : 0;
    }

    /// @notice Get current supply APY for an asset in basis points (100 = 1%)
    function getCurrentAPY(address asset) external view returns (uint256) {
        IAaveV3Pool.ReserveData memory reserve = pool.getReserveData(asset);
        // currentLiquidityRate is in RAY (27 decimals), convert to basis points
        // RAY = 1e27, basis point = 1e-4
        // APY in bps = rate * 10000 / 1e27 = rate / 1e23
        return uint256(reserve.currentLiquidityRate) / 1e23;
    }

    /// @notice Get position details
    function getPosition(uint256 tokenId)
        external
        view
        returns (address asset, uint256 principal, uint256 currentValue, uint256 depositTime)
    {
        YieldPosition memory pos = positions[tokenId];
        asset = pos.asset;
        principal = pos.principal;
        depositTime = pos.depositTime;
        if (pos.aToken != address(0) && pos.principal > 0) {
            currentValue = IERC20(pos.aToken).balanceOf(address(this));
        }
    }

    /// @notice Emergency withdraw (owner only)
    function emergencyWithdraw(address asset, uint256 amount, address to) external onlyOwner {
        IERC20(asset).safeTransfer(to, amount);
    }
}
