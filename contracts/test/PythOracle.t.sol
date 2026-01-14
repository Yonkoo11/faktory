// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PythOracle.sol";

// Mock Pyth contract for testing (simplified - only methods used by PythOracle)
contract MockPyth {
    int64 public ethPrice = 200000000000; // $2000 with 8 decimals
    int64 public mntPrice = 80000000;     // $0.80 with 8 decimals
    bool public shouldRevert = false;

    function setEthPrice(int64 _price) external {
        ethPrice = _price;
    }

    function setMntPrice(int64 _price) external {
        mntPrice = _price;
    }

    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }

    function getUpdateFee(bytes[] calldata) external pure returns (uint256) {
        return 0;
    }

    function updatePriceFeeds(bytes[] calldata) external payable {}

    function getPriceNoOlderThan(bytes32 id, uint256) external view returns (PythStructs.Price memory) {
        require(!shouldRevert, "Mock revert");

        if (id == 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace) {
            return PythStructs.Price({
                price: ethPrice,
                conf: 1000000,
                expo: -8,
                publishTime: block.timestamp
            });
        } else if (id == 0x4e3037c822d852d79af3ac80e35eb420ee3b870dca49f9344a38ef4773fb0585) {
            return PythStructs.Price({
                price: mntPrice,
                conf: 100000,
                expo: -8,
                publishTime: block.timestamp
            });
        }

        revert("Unknown price feed");
    }

    function getValidTimePeriod() external pure returns (uint256) {
        return 3600;
    }
}

contract PythOracleTest is Test {
    PythOracle public oracle;
    MockPyth public mockPyth;

    address public owner = address(this);
    address public user = address(0x1);

    function setUp() public {
        mockPyth = new MockPyth();
        oracle = new PythOracle(address(mockPyth));
    }

    function test_GetEthUsdPrice() public view {
        int64 price = oracle.getEthUsdPrice();
        assertEq(price, 200000000000); // $2000
    }

    function test_GetMntUsdPrice() public view {
        int64 price = oracle.getMntUsdPrice();
        assertEq(price, 80000000); // $0.80
    }

    function test_FallbackMode() public {
        // Activate fallback
        oracle.activateFallback("Testing fallback");
        assertTrue(oracle.useFallback());

        // Should still return prices (fallback values)
        int64 price = oracle.getEthUsdPrice();
        assertEq(price, 200000000000);

        // Deactivate fallback
        oracle.deactivateFallback();
        assertFalse(oracle.useFallback());
    }

    function test_SetFallbackPrices() public {
        int64 newEthPrice = 300000000000; // $3000
        int64 newMntPrice = 100000000;    // $1.00

        oracle.setFallbackPrices(newEthPrice, newMntPrice);
        oracle.activateFallback("Testing new prices");

        assertEq(oracle.getEthUsdPrice(), newEthPrice);
        assertEq(oracle.getMntUsdPrice(), newMntPrice);
    }

    function test_RevertInvalidFallbackPrices() public {
        vm.expectRevert("Invalid prices");
        oracle.setFallbackPrices(-1, 100);

        vm.expectRevert("Invalid prices");
        oracle.setFallbackPrices(100, 0);
    }

    function test_PythAvailable() public {
        assertTrue(oracle.isPythAvailable());

        mockPyth.setShouldRevert(true);
        assertFalse(oracle.isPythAvailable());
    }

    function test_FallbackOnPythError() public {
        mockPyth.setShouldRevert(true);

        // Should return fallback price when Pyth reverts
        int64 price = oracle.getEthUsdPrice();
        assertEq(price, 200000000000); // Fallback price
    }

    function test_GetRiskScoreDefault() public view {
        // Unassessed token should return 50
        uint8 score = oracle.getRiskScore(999);
        assertEq(score, 50);
    }

    function test_GetPaymentProbabilityDefault() public view {
        // Unassessed token should return 50
        uint8 prob = oracle.getPaymentProbability(999);
        assertEq(prob, 50);
    }

    function test_OnlyOwnerCanActivateFallback() public {
        vm.prank(user);
        vm.expectRevert();
        oracle.activateFallback("Test");
    }

    function test_OnlyOwnerCanDeactivateFallback() public {
        oracle.activateFallback("Test");

        vm.prank(user);
        vm.expectRevert();
        oracle.deactivateFallback();
    }

    function test_OnlyOwnerCanSetFallbackPrices() public {
        vm.prank(user);
        vm.expectRevert();
        oracle.setFallbackPrices(100, 100);
    }
}
