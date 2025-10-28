// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Vault
 * @dev Vault contract for managing deposits and strategies
 */
contract Vault is
    Initializable,
    ERC20Upgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant STRATEGY_ROLE = keccak256("STRATEGY_ROLE");
    
    IERC20 public asset;
    
    uint256 public managementFee; // In basis points (100 = 1%)
    uint256 public performanceFee; // In basis points
    uint256 public lastFeeCollection;
    
    address[] public strategies;
    mapping(address => bool) public isStrategy;
    mapping(address => uint256) public strategyAllocations;
    
    uint256 public constant MAX_STRATEGIES = 10;
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    event Deposited(address indexed user, uint256 assets, uint256 shares);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares);
    event StrategyAdded(address indexed strategy, uint256 allocation);
    event StrategyRemoved(address indexed strategy);
    event Harvested(uint256 profit);
    event FeesCollected(uint256 managementFees, uint256 performanceFees);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address _asset,
        string memory name,
        string memory symbol,
        address admin
    ) public initializer {
        __ERC20_init(name, symbol);
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        asset = IERC20(_asset);
        managementFee = 200; // 2%
        performanceFee = 2000; // 20%
        lastFeeCollection = block.timestamp;
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }
    
    /**
     * @dev Deposit assets and receive vault shares
     * @param assets Amount of assets to deposit
     * @return shares Amount of shares minted
     */
    function deposit(uint256 assets) 
        external 
        nonReentrant 
        returns (uint256 shares) 
    {
        require(assets > 0, "Cannot deposit 0");
        
        shares = convertToShares(assets);
        require(shares > 0, "Invalid share amount");
        
        asset.transferFrom(msg.sender, address(this), assets);
        _mint(msg.sender, shares);
        
        emit Deposited(msg.sender, assets, shares);
        return shares;
    }
    
    /**
     * @dev Withdraw assets by burning shares
     * @param shares Amount of shares to burn
     * @return assets Amount of assets withdrawn
     */
    function withdraw(uint256 shares) 
        external 
        nonReentrant 
        returns (uint256 assets) 
    {
        require(shares > 0, "Cannot withdraw 0");
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        
        assets = convertToAssets(shares);
        require(assets > 0, "Invalid asset amount");
        
        _burn(msg.sender, shares);
        asset.transfer(msg.sender, assets);
        
        emit Withdrawn(msg.sender, assets, shares);
        return assets;
    }
    
    /**
     * @dev Add a new strategy
     * @param strategy Strategy contract address
     * @param allocation Allocation percentage in basis points
     */
    function addStrategy(address strategy, uint256 allocation)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(strategy != address(0), "Invalid strategy address");
        require(!isStrategy[strategy], "Strategy already exists");
        require(strategies.length < MAX_STRATEGIES, "Max strategies reached");
        require(allocation <= FEE_DENOMINATOR, "Invalid allocation");
        
        strategies.push(strategy);
        isStrategy[strategy] = true;
        strategyAllocations[strategy] = allocation;
        
        _grantRole(STRATEGY_ROLE, strategy);
        
        emit StrategyAdded(strategy, allocation);
    }
    
    /**
     * @dev Remove a strategy
     * @param strategy Strategy contract address
     */
    function removeStrategy(address strategy)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(isStrategy[strategy], "Strategy does not exist");
        
        isStrategy[strategy] = false;
        strategyAllocations[strategy] = 0;
        
        // Remove from array
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i] == strategy) {
                strategies[i] = strategies[strategies.length - 1];
                strategies.pop();
                break;
            }
        }
        
        _revokeRole(STRATEGY_ROLE, strategy);
        
        emit StrategyRemoved(strategy);
    }
    
    /**
     * @dev Harvest profits from strategies
     * @return profit Total profit harvested
     */
    function harvest() 
        external 
        onlyRole(ADMIN_ROLE) 
        returns (uint256 profit) 
    {
        uint256 balanceBefore = asset.balanceOf(address(this));
        
        // Call harvest on each strategy
        for (uint256 i = 0; i < strategies.length; i++) {
            if (isStrategy[strategies[i]]) {
                // Strategy harvest logic would go here
                // For now, just a placeholder
            }
        }
        
        uint256 balanceAfter = asset.balanceOf(address(this));
        profit = balanceAfter > balanceBefore ? balanceAfter - balanceBefore : 0;
        
        if (profit > 0) {
            _collectPerformanceFee(profit);
            emit Harvested(profit);
        }
        
        return profit;
    }
    
    /**
     * @dev Collect management and performance fees
     */
    function collectFees() external onlyRole(ADMIN_ROLE) {
        uint256 timeSinceLastCollection = block.timestamp - lastFeeCollection;
        uint256 totalAssets = totalAssetsUnderManagement();
        
        // Calculate management fee
        uint256 managementFeeAmount = (totalAssets * managementFee * timeSinceLastCollection) 
            / (FEE_DENOMINATOR * 365 days);
        
        if (managementFeeAmount > 0) {
            uint256 shares = convertToShares(managementFeeAmount);
            _mint(msg.sender, shares);
        }
        
        lastFeeCollection = block.timestamp;
        
        emit FeesCollected(managementFeeAmount, 0);
    }
    
    /**
     * @dev Convert assets to shares
     * @param assets Amount of assets
     * @return shares Equivalent shares
     */
    function convertToShares(uint256 assets) public view returns (uint256 shares) {
        uint256 supply = totalSupply();
        if (supply == 0) {
            return assets;
        }
        return (assets * supply) / totalAssetsUnderManagement();
    }
    
    /**
     * @dev Convert shares to assets
     * @param shares Amount of shares
     * @return assets Equivalent assets
     */
    function convertToAssets(uint256 shares) public view returns (uint256 assets) {
        uint256 supply = totalSupply();
        if (supply == 0) {
            return 0;
        }
        return (shares * totalAssetsUnderManagement()) / supply;
    }
    
    /**
     * @dev Get total assets under management
     * @return Total assets
     */
    function totalAssetsUnderManagement() public view returns (uint256) {
        return asset.balanceOf(address(this));
    }
    
    /**
     * @dev Collect performance fee
     * @param profit Profit amount
     */
    function _collectPerformanceFee(uint256 profit) internal {
        uint256 feeAmount = (profit * performanceFee) / FEE_DENOMINATOR;
        if (feeAmount > 0) {
            uint256 shares = convertToShares(feeAmount);
            _mint(msg.sender, shares);
        }
    }
    
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(ADMIN_ROLE)
        override
    {}
}
