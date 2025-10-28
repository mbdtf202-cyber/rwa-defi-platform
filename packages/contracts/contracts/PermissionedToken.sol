// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PermissionedToken
 * @dev ERC20 token with transfer restrictions for RWA compliance
 * @notice This token implements KYC whitelist and lockup mechanisms
 */
contract PermissionedToken is 
    Initializable,
    ERC20Upgradeable, 
    AccessControlUpgradeable, 
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant TRANSFER_ADMIN_ROLE = keccak256("TRANSFER_ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    
    /// @notice SPV ID associated with this token
    uint256 public spvId;
    
    /// @notice KYC whitelist mapping
    mapping(address => bool) public isWhitelisted;
    
    /// @notice Lockup information for addresses
    mapping(address => uint256) public lockupUntil;
    
    /// @notice Dividend balance for each address
    mapping(address => mapping(address => uint256)) public dividendBalance;
    
    /// @notice Total dividends distributed per token
    mapping(address => uint256) public totalDividendsPerToken;
    
    /// @notice Snapshot ID counter
    uint256 private _currentSnapshotId;
    
    /// @notice Snapshot balances
    mapping(uint256 => mapping(address => uint256)) private _snapshotBalances;
    
    /// @notice Snapshot total supply
    mapping(uint256 => uint256) private _snapshotTotalSupply;
    
    // Events
    event Whitelisted(address indexed account, bool status);
    event LockupSet(address indexed account, uint256 unlockTime);
    event DividendsDistributed(address indexed token, uint256 amount, uint256 totalSupply);
    event DividendsClaimed(address indexed account, address indexed token, uint256 amount);
    event TransferRestricted(address indexed from, address indexed to, string reason);
    event SnapshotCreated(uint256 indexed snapshotId, uint256 timestamp);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the contract
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param _spvId SPV ID to associate with this token
     * @param admin Admin address
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 _spvId,
        address admin
    ) public initializer {
        __ERC20_init(name_, symbol_);
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        spvId = _spvId;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        _grantRole(TRANSFER_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }
    
    /**
     * @dev Mint new tokens
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        require(isWhitelisted[to], "Recipient not whitelisted");
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) 
        external 
        onlyRole(BURNER_ROLE) 
    {
        _burn(from, amount);
    }
    
    /**
     * @dev Check if transfer is allowed
     * @param from Sender address
     * @param to Recipient address
     * @return bool Whether transfer is allowed
     */
    function isTransferAllowed(address from, address to) 
        public 
        view 
        returns (bool) 
    {
        // Check whitelist
        if (!isWhitelisted[from] || !isWhitelisted[to]) {
            return false;
        }
        
        // Check lockup
        if (block.timestamp < lockupUntil[from]) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @dev Set whitelist status for an address
     * @param account Address to update
     * @param status Whitelist status
     */
    function setWhitelist(address account, bool status) 
        external 
        onlyRole(TRANSFER_ADMIN_ROLE) 
    {
        isWhitelisted[account] = status;
        emit Whitelisted(account, status);
    }
    
    /**
     * @dev Set whitelist status for multiple addresses
     * @param accounts Array of addresses
     * @param status Whitelist status
     */
    function setWhitelistBatch(address[] calldata accounts, bool status)
        external
        onlyRole(TRANSFER_ADMIN_ROLE)
    {
        for (uint256 i = 0; i < accounts.length; i++) {
            isWhitelisted[accounts[i]] = status;
            emit Whitelisted(accounts[i], status);
        }
    }
    
    /**
     * @dev Set lockup period for an address
     * @param account Address to lock
     * @param unlockTime Unlock timestamp
     */
    function setLockup(address account, uint256 unlockTime) 
        external 
        onlyRole(TRANSFER_ADMIN_ROLE) 
    {
        require(unlockTime > block.timestamp, "Unlock time must be in future");
        lockupUntil[account] = unlockTime;
        emit LockupSet(account, unlockTime);
    }
    
    /**
     * @dev Distribute dividends to token holders
     * @param dividendToken Token to distribute as dividends
     * @param amount Total amount to distribute
     */
    function distributeDividends(address dividendToken, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(amount > 0, "Amount must be greater than 0");
        uint256 supply = totalSupply();
        require(supply > 0, "No tokens in circulation");
        
        // Transfer dividend tokens to this contract
        IERC20(dividendToken).transferFrom(msg.sender, address(this), amount);
        
        // Update dividends per token
        totalDividendsPerToken[dividendToken] += (amount * 1e18) / supply;
        
        emit DividendsDistributed(dividendToken, amount, supply);
    }
    
    /**
     * @dev Claim dividends for caller
     * @param dividendToken Token to claim
     */
    function claimDividends(address dividendToken) external {
        uint256 balance = balanceOf(msg.sender);
        require(balance > 0, "No tokens held");
        
        uint256 owed = (balance * totalDividendsPerToken[dividendToken]) / 1e18;
        uint256 claimed = dividendBalance[msg.sender][dividendToken];
        uint256 claimable = owed - claimed;
        
        require(claimable > 0, "No dividends to claim");
        
        dividendBalance[msg.sender][dividendToken] = owed;
        IERC20(dividendToken).transfer(msg.sender, claimable);
        
        emit DividendsClaimed(msg.sender, dividendToken, claimable);
    }
    
    /**
     * @dev Create a snapshot of current balances
     * @return uint256 Snapshot ID
     */
    function snapshot() external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        _currentSnapshotId++;
        _snapshotTotalSupply[_currentSnapshotId] = totalSupply();
        emit SnapshotCreated(_currentSnapshotId, block.timestamp);
        return _currentSnapshotId;
    }
    
    /**
     * @dev Get balance at specific snapshot
     * @param account Address to query
     * @param snapshotId Snapshot ID
     * @return uint256 Balance at snapshot
     */
    function balanceOfAt(address account, uint256 snapshotId) 
        external 
        view 
        returns (uint256) 
    {
        require(snapshotId <= _currentSnapshotId, "Invalid snapshot ID");
        return _snapshotBalances[snapshotId][account];
    }
    
    /**
     * @dev Pause all token transfers
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Hook that is called before any transfer of tokens (OpenZeppelin v5)
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        // Skip checks for minting and burning
        if (from != address(0) && to != address(0)) {
            if (!isTransferAllowed(from, to)) {
                emit TransferRestricted(from, to, "Transfer not allowed");
                revert("Transfer not allowed");
            }
        }
        
        // Update snapshot if exists
        if (_currentSnapshotId > 0) {
            if (from != address(0)) {
                _snapshotBalances[_currentSnapshotId][from] = balanceOf(from);
            }
            if (to != address(0)) {
                _snapshotBalances[_currentSnapshotId][to] = balanceOf(to);
            }
        }
        
        super._update(from, to, amount);
    }
    
    /**
     * @dev Authorize upgrade (required by UUPSUpgradeable)
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}
}
