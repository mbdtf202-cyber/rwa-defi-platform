// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LendingPool
 * @dev Lending pool for RWA token collateralized loans
 */
contract LendingPool is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant RISK_ADMIN_ROLE = keccak256("RISK_ADMIN_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    
    struct CollateralConfig {
        bool enabled;
        uint256 ltvRatio;           // Loan-to-Value ratio in basis points
        uint256 liquidationThreshold; // Liquidation threshold in basis points
        uint256 liquidationBonus;    // Liquidation bonus in basis points
    }
    
    struct UserPosition {
        uint256 collateralAmount;
        uint256 borrowedAmount;
        uint256 lastUpdateTime;
        uint256 accruedInterest;
    }
    
    // Collateral token => Config
    mapping(address => CollateralConfig) public collateralConfigs;
    
    // User => Collateral token => Position
    mapping(address => mapping(address => UserPosition)) public positions;
    
    // Borrowing token (stablecoin)
    IERC20 public borrowToken;
    
    // Interest rate (annual, in basis points)
    uint256 public interestRate;
    
    // Total borrowed amount
    uint256 public totalBorrowed;
    
    // Total available liquidity
    uint256 public totalLiquidity;
    
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    event CollateralDeposited(
        address indexed user,
        address indexed collateralToken,
        uint256 amount
    );
    
    event CollateralWithdrawn(
        address indexed user,
        address indexed collateralToken,
        uint256 amount
    );
    
    event Borrowed(
        address indexed user,
        uint256 amount,
        uint256 interestRate
    );
    
    event Repaid(
        address indexed user,
        uint256 amount,
        uint256 interest
    );
    
    event Liquidated(
        address indexed user,
        address indexed liquidator,
        address indexed collateralToken,
        uint256 collateralAmount,
        uint256 debtRepaid
    );
    
    event InterestRateUpdated(uint256 newRate);
    event LTVUpdated(address indexed collateralToken, uint256 newLTV);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address _borrowToken,
        uint256 _interestRate,
        address admin
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        borrowToken = IERC20(_borrowToken);
        interestRate = _interestRate;
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(RISK_ADMIN_ROLE, admin);
        _grantRole(LIQUIDATOR_ROLE, admin);
    }
    
    /**
     * @dev Configure collateral token
     */
    function setCollateralConfig(
        address collateralToken,
        bool enabled,
        uint256 ltvRatio,
        uint256 liquidationThreshold,
        uint256 liquidationBonus
    ) external onlyRole(RISK_ADMIN_ROLE) {
        require(ltvRatio <= BASIS_POINTS, "Invalid LTV");
        require(liquidationThreshold <= BASIS_POINTS, "Invalid threshold");
        require(liquidationBonus <= BASIS_POINTS, "Invalid bonus");
        require(ltvRatio < liquidationThreshold, "LTV must be < threshold");
        
        collateralConfigs[collateralToken] = CollateralConfig({
            enabled: enabled,
            ltvRatio: ltvRatio,
            liquidationThreshold: liquidationThreshold,
            liquidationBonus: liquidationBonus
        });
        
        emit LTVUpdated(collateralToken, ltvRatio);
    }
    
    /**
     * @dev Deposit collateral
     */
    function depositCollateral(
        address collateralToken,
        uint256 amount
    ) external nonReentrant {
        CollateralConfig memory config = collateralConfigs[collateralToken];
        require(config.enabled, "Collateral not enabled");
        require(amount > 0, "Invalid amount");
        
        UserPosition storage position = positions[msg.sender][collateralToken];
        
        // Update accrued interest before modifying position
        _updateInterest(msg.sender, collateralToken);
        
        // Transfer collateral
        IERC20(collateralToken).transferFrom(msg.sender, address(this), amount);
        
        position.collateralAmount += amount;
        
        emit CollateralDeposited(msg.sender, collateralToken, amount);
    }
    
    /**
     * @dev Withdraw collateral
     */
    function withdrawCollateral(
        address collateralToken,
        uint256 amount
    ) external nonReentrant {
        UserPosition storage position = positions[msg.sender][collateralToken];
        require(position.collateralAmount >= amount, "Insufficient collateral");
        
        // Update accrued interest
        _updateInterest(msg.sender, collateralToken);
        
        // Check if withdrawal would make position unhealthy
        uint256 newCollateral = position.collateralAmount - amount;
        require(
            _isHealthy(msg.sender, collateralToken, newCollateral),
            "Position would be unhealthy"
        );
        
        position.collateralAmount = newCollateral;
        
        // Transfer collateral
        IERC20(collateralToken).transfer(msg.sender, amount);
        
        emit CollateralWithdrawn(msg.sender, collateralToken, amount);
    }
    
    /**
     * @dev Borrow against collateral
     */
    function borrow(
        address collateralToken,
        uint256 amount
    ) external nonReentrant {
        CollateralConfig memory config = collateralConfigs[collateralToken];
        require(config.enabled, "Collateral not enabled");
        require(amount > 0, "Invalid amount");
        require(amount <= totalLiquidity, "Insufficient liquidity");
        
        UserPosition storage position = positions[msg.sender][collateralToken];
        require(position.collateralAmount > 0, "No collateral");
        
        // Update accrued interest
        _updateInterest(msg.sender, collateralToken);
        
        // Calculate max borrowable amount
        uint256 maxBorrow = (position.collateralAmount * config.ltvRatio) / BASIS_POINTS;
        uint256 totalDebt = position.borrowedAmount + position.accruedInterest;
        
        require(totalDebt + amount <= maxBorrow, "Exceeds borrowing capacity");
        
        position.borrowedAmount += amount;
        totalBorrowed += amount;
        totalLiquidity -= amount;
        
        // Transfer borrowed tokens
        borrowToken.transfer(msg.sender, amount);
        
        emit Borrowed(msg.sender, amount, interestRate);
    }
    
    /**
     * @dev Repay borrowed amount
     */
    function repay(
        address collateralToken,
        uint256 amount
    ) external nonReentrant {
        UserPosition storage position = positions[msg.sender][collateralToken];
        require(position.borrowedAmount > 0, "No debt");
        
        // Update accrued interest
        _updateInterest(msg.sender, collateralToken);
        
        uint256 totalDebt = position.borrowedAmount + position.accruedInterest;
        uint256 repayAmount = amount > totalDebt ? totalDebt : amount;
        
        // Transfer repayment
        borrowToken.transferFrom(msg.sender, address(this), repayAmount);
        
        // Update position
        if (repayAmount >= position.accruedInterest) {
            uint256 principalRepay = repayAmount - position.accruedInterest;
            position.accruedInterest = 0;
            position.borrowedAmount -= principalRepay;
        } else {
            position.accruedInterest -= repayAmount;
        }
        
        totalBorrowed -= repayAmount;
        totalLiquidity += repayAmount;
        
        emit Repaid(msg.sender, repayAmount, position.accruedInterest);
    }
    
    /**
     * @dev Liquidate unhealthy position
     */
    function liquidate(
        address user,
        address collateralToken
    ) external nonReentrant onlyRole(LIQUIDATOR_ROLE) {
        UserPosition storage position = positions[user][collateralToken];
        CollateralConfig memory config = collateralConfigs[collateralToken];
        
        require(position.borrowedAmount > 0, "No debt");
        
        // Update accrued interest
        _updateInterest(user, collateralToken);
        
        // Check if position is liquidatable
        uint256 totalDebt = position.borrowedAmount + position.accruedInterest;
        uint256 liquidationValue = (position.collateralAmount * config.liquidationThreshold) / BASIS_POINTS;
        
        require(totalDebt > liquidationValue, "Position is healthy");
        
        // Calculate liquidation amounts
        uint256 collateralToLiquidate = position.collateralAmount;
        uint256 bonus = (collateralToLiquidate * config.liquidationBonus) / BASIS_POINTS;
        uint256 liquidatorReward = collateralToLiquidate + bonus;
        
        // Transfer debt from liquidator
        borrowToken.transferFrom(msg.sender, address(this), totalDebt);
        
        // Transfer collateral to liquidator
        IERC20(collateralToken).transfer(msg.sender, liquidatorReward);
        
        // Clear position
        position.collateralAmount = 0;
        position.borrowedAmount = 0;
        position.accruedInterest = 0;
        
        totalBorrowed -= totalDebt;
        totalLiquidity += totalDebt;
        
        emit Liquidated(user, msg.sender, collateralToken, collateralToLiquidate, totalDebt);
    }
    
    /**
     * @dev Update interest rate
     */
    function setInterestRate(uint256 newRate) external onlyRole(RISK_ADMIN_ROLE) {
        require(newRate <= 5000, "Rate too high"); // Max 50%
        interestRate = newRate;
        emit InterestRateUpdated(newRate);
    }
    
    /**
     * @dev Add liquidity to the pool
     */
    function addLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");
        borrowToken.transferFrom(msg.sender, address(this), amount);
        totalLiquidity += amount;
    }
    
    /**
     * @dev Get user's health factor
     */
    function getHealthFactor(
        address user,
        address collateralToken
    ) external view returns (uint256) {
        UserPosition storage position = positions[user][collateralToken];
        CollateralConfig memory config = collateralConfigs[collateralToken];
        
        if (position.borrowedAmount == 0) return type(uint256).max;
        
        uint256 totalDebt = position.borrowedAmount + _calculateInterest(user, collateralToken);
        uint256 liquidationValue = (position.collateralAmount * config.liquidationThreshold) / BASIS_POINTS;
        
        return (liquidationValue * BASIS_POINTS) / totalDebt;
    }
    
    /**
     * @dev Update accrued interest for a position
     */
    function _updateInterest(address user, address collateralToken) internal {
        UserPosition storage position = positions[user][collateralToken];
        
        if (position.borrowedAmount == 0) return;
        
        uint256 interest = _calculateInterest(user, collateralToken);
        position.accruedInterest += interest;
        position.lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Calculate accrued interest
     */
    function _calculateInterest(
        address user,
        address collateralToken
    ) internal view returns (uint256) {
        UserPosition storage position = positions[user][collateralToken];
        
        if (position.borrowedAmount == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - position.lastUpdateTime;
        uint256 interest = (position.borrowedAmount * interestRate * timeElapsed) / 
                          (BASIS_POINTS * SECONDS_PER_YEAR);
        
        return interest;
    }
    
    /**
     * @dev Check if position is healthy
     */
    function _isHealthy(
        address user,
        address collateralToken,
        uint256 newCollateral
    ) internal view returns (bool) {
        UserPosition storage position = positions[user][collateralToken];
        CollateralConfig memory config = collateralConfigs[collateralToken];
        
        if (position.borrowedAmount == 0) return true;
        
        uint256 totalDebt = position.borrowedAmount + position.accruedInterest;
        uint256 maxBorrow = (newCollateral * config.ltvRatio) / BASIS_POINTS;
        
        return totalDebt <= maxBorrow;
    }
    
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(ADMIN_ROLE)
        override
    {}
}
