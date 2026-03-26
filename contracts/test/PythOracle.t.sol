// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PythOracle.sol";

// Mock Pyth contract for testing
contract MockPyth {
    int64 public ethPrice = 200000000000; // $2000 with 8 decimals
    bool public shouldRevert = false;

    function setEthPrice(int64 _price) external {
        ethPrice = _price;
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
            return PythStructs.Price({price: ethPrice, conf: 1000000, expo: -8, publishTime: block.timestamp});
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
        assertEq(price, 200000000000);
    }

    function test_GetNativeUsdPrice() public view {
        int64 price = oracle.getNativeUsdPrice();
        assertEq(price, 200000000000);
    }

    function test_FallbackMode() public {
        oracle.activateFallback("Testing fallback");
        assertTrue(oracle.useFallback());

        int64 price = oracle.getEthUsdPrice();
        assertEq(price, 200000000000);

        oracle.deactivateFallback();
        assertFalse(oracle.useFallback());
    }

    function test_SetFallbackPrice() public {
        int64 newEthPrice = 300000000000; // $3000
        oracle.setFallbackPrice(newEthPrice);
        oracle.activateFallback("Testing new price");

        assertEq(oracle.getEthUsdPrice(), newEthPrice);
    }

    function test_RevertInvalidFallbackPrice() public {
        vm.expectRevert("Invalid price");
        oracle.setFallbackPrice(-1);
    }

    function test_PythAvailable() public {
        assertTrue(oracle.isPythAvailable());

        mockPyth.setShouldRevert(true);
        assertFalse(oracle.isPythAvailable());
    }

    function test_FallbackOnPythError() public {
        mockPyth.setShouldRevert(true);
        int64 price = oracle.getEthUsdPrice();
        assertEq(price, 200000000000);
    }

    function test_GetRiskScoreDefault() public view {
        uint8 score = oracle.getRiskScore(999);
        assertEq(score, 50);
    }

    function test_GetPaymentProbabilityDefault() public view {
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

    function test_OnlyOwnerCanSetFallbackPrice() public {
        vm.prank(user);
        vm.expectRevert();
        oracle.setFallbackPrice(100);
    }

    function test_FallbackTimeout() public {
        oracle.activateFallback("Testing timeout");
        assertTrue(oracle.isFallbackActive());

        // Warp past timeout (24 hours)
        vm.warp(block.timestamp + 25 hours);
        assertFalse(oracle.isFallbackActive());
        assertTrue(oracle.isFallbackTimedOut());
    }
}
