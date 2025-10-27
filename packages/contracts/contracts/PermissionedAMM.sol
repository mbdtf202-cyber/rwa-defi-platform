// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PermissionedToken.sol";

/**
 * @title PermissionedAMM
 * @dev Automated Market Maker with KYC restrictions for RWA tokens
 */
contract PermissionedAMM is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        uint256 feeRate; // In basis points (30 = 0.3%)
        bool active;
    }
    
    struct LiquidityPosition {
        uint256 liquidity;
        uint256 rangeMin;
        uint256 rangeMax;
        uint256 feesEarnedA;
        uint256 feesEarnedB;
    }
    
    // Pool ID => Pool
    mapping(uint256 => Pool) public pools;
    uint256 public poolCount;
    
    // Pool ID => User => Position
    mapping(uint256 => mapping(address => LiquidityPosition)) public positions;
    
    // Whitelist for LP providers
    mapping(address => bool) public isWhitelistedLP;
    
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    event PoolCreated(
        uint256 indexed poolId,
        address indexed tokenA,
        address indexed tokenB,
        uint256 feeRate
    );
    
    event LiquidityAdded(
        uint256 indexed poolId,
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event LiquidityRemoved(
        uint256 indexed poolId,
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event Swap(
        uint256 indexed poolId,
        address indexed user,
        address tokenIn,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event FeesCollected(
        uint256 indexed poolId,
        address indexed user,
        uint256 feesA,
        uint256 feesB
    );
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }
    
    /**
     * @dev Create a new liquidity pool
     */
    function createPool(
        address tokenA,
        address tokenB,
        uint256 feeRate
    ) external onlyRole(ADMIN_ROLE) returns (uint256 poolId) {
        require(tokenA != tokenB, "Identical tokens");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");
        require(feeRate <= 1000, "Fee too high"); // Max 10%
        
        poolId = poolCount++;
        
        pools[poolId] = Pool({
            tokenA: tokenA,
            tokenB: tokenB,
            reserveA: 0,
            reserveB: 0,
            totalLiquidity: 0,
            feeRate: feeRate,
            active: true
        });
        
        emit PoolCreated(poolId, tokenA, tokenB, feeRate);
        return poolId;
    }
    
    /**
     * @dev Add liquidity to a pool
     */
    function addLiquidity(
        uint256 poolId,
        uint256 amountA,
        uint256 amountB,
        uint256 rangeMin,
        uint256 rangeMax
    ) external nonReentrant returns (uint256 liquidity) {
        require(isWhitelistedLP[msg.sender], "Not whitelisted");
        
        Pool storage pool = pools[poolId];
        require(pool.active, "Pool not active");
        require(amountA > 0 && amountB > 0, "Invalid amounts");
        require(rangeMax > rangeMin, "Invalid range");
        
        // Calculate liquidity to mint
        if (pool.totalLiquidity == 0) {
            liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            pool.totalLiquidity = MINIMUM_LIQUIDITY; // Lock minimum liquidity
        } else {
            uint256 liquidityA = (amountA * pool.totalLiquidity) / pool.reserveA;
            uint256 liquidityB = (amountB * pool.totalLiquidity) / pool.reserveB;
            liquidity = liquidityA < liquidityB ? liquidityA : liquidityB;
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        
        // Transfer tokens
        IERC20(pool.tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(pool.tokenB).transferFrom(msg.sender, address(this), amountB);
        
        // Update reserves
        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalLiquidity += liquidity;
        
        // Update position
        LiquidityPosition storage position = positions[poolId][msg.sender];
        position.liquidity += liquidity;
        position.rangeMin = rangeMin;
        position.rangeMax = rangeMax;
        
        emit LiquidityAdded(poolId, msg.sender, amountA, amountB, liquidity);
        return liquidity;
    }
    
    /**
     * @dev Remove liquidity from a pool
     */
    function removeLiquidity(
        uint256 poolId,
        uint256 liquidity
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        Pool storage pool = pools[poolId];
        LiquidityPosition storage position = positions[poolId][msg.sender];
        
        require(position.liquidity >= liquidity, "Insufficient liquidity");
        
        // Calculate amounts to return
        amountA = (liquidity * pool.reserveA) / pool.totalLiquidity;
        amountB = (liquidity * pool.reserveB) / pool.totalLiquidity;
        
        require(amountA > 0 && amountB > 0, "Insufficient amounts");
        
        // Update state
        position.liquidity -= liquidity;
        pool.totalLiquidity -= liquidity;
        pool.reserveA -= amountA;
        pool.reserveB -= amountB;
        
        // Transfer tokens
        IERC20(pool.tokenA).transfer(msg.sender, amountA);
        IERC20(pool.tokenB).transfer(msg.sender, amountB);
        
        emit LiquidityRemoved(poolId, msg.sender, amountA, amountB, liquidity);
        return (amountA, amountB);
    }
    
    /**
     * @dev Swap tokens
     */
    function swap(
        uint256 poolId,
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        Pool storage pool = pools[poolId];
        require(pool.active, "Pool not active");
        require(amountIn > 0, "Invalid amount");
        
        bool isTokenA = tokenIn == pool.tokenA;
        require(isTokenA || tokenIn == pool.tokenB, "Invalid token");
        
        // Calculate output amount with fee
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - pool.feeRate);
        
        if (isTokenA) {
            amountOut = (amountInWithFee * pool.reserveB) / 
                       (pool.reserveA * FEE_DENOMINATOR + amountInWithFee);
            require(amountOut >= minAmountOut, "Slippage exceeded");
            require(amountOut < pool.reserveB, "Insufficient liquidity");
            
            // Transfer tokens
            IERC20(pool.tokenA).transferFrom(msg.sender, address(this), amountIn);
            IERC20(pool.tokenB).transfer(msg.sender, amountOut);
            
            // Update reserves
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            amountOut = (amountInWithFee * pool.reserveA) / 
                       (pool.reserveB * FEE_DENOMINATOR + amountInWithFee);
            require(amountOut >= minAmountOut, "Slippage exceeded");
            require(amountOut < pool.reserveA, "Insufficient liquidity");
            
            // Transfer tokens
            IERC20(pool.tokenB).transferFrom(msg.sender, address(this), amountIn);
            IERC20(pool.tokenA).transfer(msg.sender, amountOut);
            
            // Update reserves
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }
        
        emit Swap(poolId, msg.sender, tokenIn, amountIn, amountOut);
        return amountOut;
    }
    
    /**
     * @dev Claim accumulated fees
     */
    function claimFees(uint256 poolId) external nonReentrant {
        LiquidityPosition storage position = positions[poolId][msg.sender];
        
        uint256 feesA = position.feesEarnedA;
        uint256 feesB = position.feesEarnedB;
        
        require(feesA > 0 || feesB > 0, "No fees to claim");
        
        position.feesEarnedA = 0;
        position.feesEarnedB = 0;
        
        Pool storage pool = pools[poolId];
        if (feesA > 0) IERC20(pool.tokenA).transfer(msg.sender, feesA);
        if (feesB > 0) IERC20(pool.tokenB).transfer(msg.sender, feesB);
        
        emit FeesCollected(poolId, msg.sender, feesA, feesB);
    }
    
    /**
     * @dev Set LP whitelist status
     */
    function setLPWhitelist(address account, bool status)
        external
        onlyRole(ADMIN_ROLE)
    {
        isWhitelistedLP[account] = status;
    }
    
    /**
     * @dev Get pool reserves
     */
    function getReserves(uint256 poolId)
        external
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        Pool storage pool = pools[poolId];
        return (pool.reserveA, pool.reserveB);
    }
    
    /**
     * @dev Calculate output amount for a swap
     */
    function getAmountOut(
        uint256 poolId,
        address tokenIn,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        Pool storage pool = pools[poolId];
        require(pool.active, "Pool not active");
        
        bool isTokenA = tokenIn == pool.tokenA;
        require(isTokenA || tokenIn == pool.tokenB, "Invalid token");
        
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - pool.feeRate);
        
        if (isTokenA) {
            amountOut = (amountInWithFee * pool.reserveB) / 
                       (pool.reserveA * FEE_DENOMINATOR + amountInWithFee);
        } else {
            amountOut = (amountInWithFee * pool.reserveA) / 
                       (pool.reserveB * FEE_DENOMINATOR + amountInWithFee);
        }
        
        return amountOut;
    }
    
    /**
     * @dev Square root function (Babylonian method)
     */
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
    
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(ADMIN_ROLE)
        override
    {}
}
