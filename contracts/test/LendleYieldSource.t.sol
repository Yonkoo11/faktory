// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/LendleYieldSource.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 token for testing
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Mock aToken for testing
contract MockAToken is ERC20 {
    uint256 public yieldMultiplier = 100; // 100 = no extra yield

    constructor() ERC20("Mock aToken", "aUSDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setYieldMultiplier(uint256 _multiplier) external {
        yieldMultiplier = _multiplier;
    }

    // Simulate yield by returning higher balance
    function balanceOf(address account) public view override returns (uint256) {
        uint256 base = super.balanceOf(account);
        return (base * yieldMultiplier) / 100;
    }
}

// Mock Lending Pool for testing
contract MockLendingPool is ILendingPool {
    mapping(address => address) public aTokens;
    MockAToken public mockAToken;

    constructor() {
        mockAToken = new MockAToken();
    }

    function setAToken(address asset, address aToken) external {
        aTokens[asset] = aToken;
    }

    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16
    ) external override {
        // Transfer asset from caller
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        // Mint aTokens
        mockAToken.mint(onBehalfOf, amount);
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        uint256 withdrawAmount = amount == type(uint256).max
            ? mockAToken.balanceOf(msg.sender)
            : amount;

        // Transfer asset back
        IERC20(asset).transfer(to, withdrawAmount);
        return withdrawAmount;
    }

    function getAToken() external view returns (address) {
        return address(mockAToken);
    }
}

// Mock Protocol Data Provider
contract MockDataProvider is IProtocolDataProvider {
    mapping(address => address) public aTokens;

    function setAToken(address asset, address aToken) external {
        aTokens[asset] = aToken;
    }

    function getReserveTokensAddresses(address asset) external view override returns (
        address aTokenAddress,
        address stableDebtTokenAddress,
        address variableDebtTokenAddress
    ) {
        return (aTokens[asset], address(0), address(0));
    }
}

contract LendleYieldSourceTest is Test {
    LendleYieldSource public yieldSource;
    MockLendingPool public lendingPool;
    MockDataProvider public dataProvider;
    MockERC20 public usdc;
    MockAToken public aUsdc;

    address public owner = address(this);
    address public user = address(0x1);

    function setUp() public {
        // Deploy mocks
        usdc = new MockERC20("USD Coin", "USDC");
        lendingPool = new MockLendingPool();
        dataProvider = new MockDataProvider();
        aUsdc = lendingPool.mockAToken();

        // Configure data provider
        dataProvider.setAToken(address(usdc), address(aUsdc));

        // Deploy yield source
        yieldSource = new LendleYieldSource(address(lendingPool), address(dataProvider));

        // Support USDC
        yieldSource.setAssetSupport(address(usdc), true);

        // Fund user with USDC and lending pool with USDC for withdrawals
        usdc.mint(user, 10000e6);
        usdc.mint(address(lendingPool), 100000e6);

        vm.prank(user);
        usdc.approve(address(yieldSource), type(uint256).max);
    }

    function test_SetAssetSupport() public {
        assertTrue(yieldSource.supportedAssets(address(usdc)));

        yieldSource.setAssetSupport(address(usdc), false);
        assertFalse(yieldSource.supportedAssets(address(usdc)));
    }

    function test_Deposit() public {
        uint256 tokenId = 1;
        uint256 amount = 1000e6;

        vm.prank(user);
        yieldSource.deposit(tokenId, address(usdc), amount);

        (address asset, uint256 principal, , uint256 depositTime) = yieldSource.getPosition(tokenId);
        assertEq(asset, address(usdc));
        assertEq(principal, amount);
        assertTrue(depositTime > 0);
    }

    function test_RevertDepositUnsupportedAsset() public {
        MockERC20 unsupportedToken = new MockERC20("Unsupported", "UNS");

        vm.prank(user);
        vm.expectRevert("Asset not supported");
        yieldSource.deposit(1, address(unsupportedToken), 1000e6);
    }

    function test_RevertDoubleDeposit() public {
        uint256 tokenId = 1;
        uint256 amount = 1000e6;

        vm.prank(user);
        yieldSource.deposit(tokenId, address(usdc), amount);

        vm.prank(user);
        vm.expectRevert("Position exists");
        yieldSource.deposit(tokenId, address(usdc), amount);
    }

    function test_GetCurrentYield() public {
        uint256 tokenId = 1;
        uint256 amount = 1000e6;

        vm.prank(user);
        yieldSource.deposit(tokenId, address(usdc), amount);

        // Initially no yield
        uint256 yield = yieldSource.getCurrentYield(tokenId);
        assertEq(yield, 0);

        // Simulate 5% yield
        aUsdc.setYieldMultiplier(105);
        yield = yieldSource.getCurrentYield(tokenId);
        assertEq(yield, 50e6); // 5% of 1000
    }

    function test_GetCurrentYieldNoPosition() public view {
        uint256 yield = yieldSource.getCurrentYield(999);
        assertEq(yield, 0);
    }

    function test_SetAddresses() public {
        address newLendingPool = address(0x123);
        address newDataProvider = address(0x456);

        yieldSource.setAddresses(newLendingPool, newDataProvider);

        assertEq(yieldSource.lendingPool(), newLendingPool);
        assertEq(yieldSource.dataProvider(), newDataProvider);
    }

    function test_EmergencyWithdraw() public {
        // Fund the yield source with some USDC
        usdc.mint(address(yieldSource), 1000e6);

        uint256 balanceBefore = usdc.balanceOf(owner);
        yieldSource.emergencyWithdraw(address(usdc), 500e6, owner);
        uint256 balanceAfter = usdc.balanceOf(owner);

        assertEq(balanceAfter - balanceBefore, 500e6);
    }

    function test_OnlyOwnerCanSetAssetSupport() public {
        vm.prank(user);
        vm.expectRevert();
        yieldSource.setAssetSupport(address(usdc), false);
    }

    function test_OnlyOwnerCanSetAddresses() public {
        vm.prank(user);
        vm.expectRevert();
        yieldSource.setAddresses(address(0x123), address(0x456));
    }

    function test_OnlyOwnerCanEmergencyWithdraw() public {
        usdc.mint(address(yieldSource), 1000e6);

        vm.prank(user);
        vm.expectRevert();
        yieldSource.emergencyWithdraw(address(usdc), 500e6, user);
    }
}
