# Faktory Contracts Makefile

# Load environment variables
-include .env

# Default target
.PHONY: help
help:
	@echo "Faktory Contracts Deployment"
	@echo ""
	@echo "Setup:"
	@echo "  make setup        - Install dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make build        - Build contracts"
	@echo "  make test         - Run tests"
	@echo "  make anvil        - Start local Anvil node"
	@echo "  make deploy-local - Deploy to local Anvil"
	@echo ""
	@echo "Production:"
	@echo "  make deploy-sepolia  - Deploy to Mantle Sepolia"
	@echo "  make deploy-mainnet  - Deploy to Mantle Mainnet (careful!)"

# Setup
.PHONY: setup
setup:
	forge install

# Build
.PHONY: build
build:
	forge build

# Test
.PHONY: test
test:
	forge test -vvv

# Start Anvil
.PHONY: anvil
anvil:
	anvil --chain-id 31337

# Deploy to local Anvil
.PHONY: deploy-local
deploy-local:
	forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast -vvv

# Deploy to Mantle Sepolia
.PHONY: deploy-sepolia
deploy-sepolia:
	@echo "Deploying to Mantle Sepolia..."
	@echo "Make sure you have:"
	@echo "  1. PRIVATE_KEY set in .env"
	@echo "  2. MNT tokens for gas (get from faucet)"
	@echo ""
	forge script script/Deploy.s.sol:DeployScript \
		--rpc-url $(MANTLE_SEPOLIA_RPC) \
		--broadcast \
		--verify \
		-vvv

# Deploy to Mantle Mainnet (production)
.PHONY: deploy-mainnet
deploy-mainnet:
	@echo "WARNING: Deploying to MAINNET!"
	@echo "Press Ctrl+C to cancel or Enter to continue..."
	@read _
	forge script script/Deploy.s.sol:DeployScript \
		--rpc-url $(MANTLE_MAINNET_RPC) \
		--broadcast \
		--verify \
		-vvv

# Deploy production with Pyth Oracle to Sepolia
.PHONY: deploy-sepolia-production
deploy-sepolia-production:
	@echo "Deploying PRODUCTION contracts to Mantle Sepolia..."
	forge script script/DeployProduction.s.sol:DeployProductionScript \
		--rpc-url $(MANTLE_SEPOLIA_RPC) \
		--broadcast \
		-vvv
