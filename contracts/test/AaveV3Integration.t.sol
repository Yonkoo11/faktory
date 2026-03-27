// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AaveV3YieldSource.sol";

contract AaveV3IntegrationTest is Test {
    // Base mainnet addresses
    address constant AAVE_V3_POOL = 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5;
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    AaveV3YieldSource public yieldSource;
    address public depositor = address(this);

    uint256 constant TOKEN_ID = 42;
    uint256 constant DEPOSIT_AMOUNT = 1000e6; // 1000 USDC

    function setUp() public {
        string memory rpc = vm.envOr("BASE_RPC", string(""));
        if (bytes(rpc).length == 0) {
            vm.skip(true);
            return;
        }

        vm.createSelectFork(rpc);

        yieldSource = new AaveV3YieldSource(AAVE_V3_POOL);

        // Deal USDC to this test contract
        deal(USDC, depositor, DEPOSIT_AMOUNT * 2);
    }

    function test_Deposit() public {
        // Approve and deposit
        IERC20(USDC).approve(address(yieldSource), DEPOSIT_AMOUNT);
        yieldSource.deposit(TOKEN_ID, USDC, DEPOSIT_AMOUNT);

        // aToken balance of yieldSource should equal principal (1:1 on deposit)
        IAaveV3Pool.ReserveData memory reserve = IAaveV3Pool(AAVE_V3_POOL).getReserveData(USDC);
        uint256 aTokenBalance = IERC20(reserve.aTokenAddress).balanceOf(address(yieldSource));

        // Aave V3 mints aTokens scaled by the liquidity index; 1 wei of rounding loss on deposit is expected
        assertGe(aTokenBalance + 2, DEPOSIT_AMOUNT, "aToken balance should be >= principal minus 1 wei rounding");
    }

    function test_GetCurrentAPY() public view {
        uint256 apy = yieldSource.getCurrentAPY(USDC);
        // USDC on Base Aave V3 should have a positive supply rate
        assertGt(apy, 0, "APY should be non-zero");
    }

    function test_GetCurrentYieldAfterTimeWarp() public {
        IERC20(USDC).approve(address(yieldSource), DEPOSIT_AMOUNT);
        yieldSource.deposit(TOKEN_ID, USDC, DEPOSIT_AMOUNT);

        // Warp 30 days forward so interest accrues
        vm.warp(block.timestamp + 30 days);

        uint256 yield = yieldSource.getCurrentYield(TOKEN_ID);
        assertGt(yield, 0, "Yield should be > 0 after 30 days");
    }

    function test_Withdraw() public {
        IERC20(USDC).approve(address(yieldSource), DEPOSIT_AMOUNT);
        yieldSource.deposit(TOKEN_ID, USDC, DEPOSIT_AMOUNT);

        // Warp forward so there is some accrued interest
        vm.warp(block.timestamp + 30 days);

        uint256 balanceBefore = IERC20(USDC).balanceOf(depositor);
        (uint256 totalAmount,) = yieldSource.withdraw(TOKEN_ID, depositor);

        uint256 balanceAfter = IERC20(USDC).balanceOf(depositor);

        assertGe(totalAmount, DEPOSIT_AMOUNT, "Should get back at least principal");
        assertEq(balanceAfter - balanceBefore, totalAmount, "Received amount should match return value");
    }

    function test_GetPosition() public {
        IERC20(USDC).approve(address(yieldSource), DEPOSIT_AMOUNT);
        yieldSource.deposit(TOKEN_ID, USDC, DEPOSIT_AMOUNT);

        (address asset, uint256 principal, uint256 currentValue, uint256 depositTime) =
            yieldSource.getPosition(TOKEN_ID);

        assertEq(asset, USDC, "Asset should be USDC");
        assertEq(principal, DEPOSIT_AMOUNT, "Principal should match deposit");
        // currentValue reads aToken balance which may be 1 wei below principal due to index rounding on deposit
        assertGe(currentValue + 2, DEPOSIT_AMOUNT, "Current value should be >= principal minus 1 wei rounding");
        assertGt(depositTime, 0, "Deposit time should be set");
    }
}
