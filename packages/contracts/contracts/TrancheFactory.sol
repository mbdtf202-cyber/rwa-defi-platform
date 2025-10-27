// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./PermissionedToken.sol";

/**
 * @title TrancheFactory
 * @dev Factory contract for creating and managing tranched securities
 */
contract TrancheFactory is 
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    struct TrancheConfig {
        string name;
        string symbol;
        uint8 priority;      // 0 = Senior, 1 = Mezzanine, 2 = Junior
        uint256 targetYield; // Target yield in basis points
        uint256 allocation;  // Allocation percentage in basis points (10000 = 100%)
    }
    
    struct Tranche {
        address tokenAddress;
        uint8 priority;
        uint256 targetYield;
        uint256 allocation;
        uint256 totalPaid;
        uint256 totalOwed;
    }
    
    // SPV ID => Tranche array
    mapping(uint256 => Tranche[]) public tranches;
    
    // SPV ID => exists
    mapping(uint256 => bool) public spvExists;
    
    event TrancheCreated(
        uint256 indexed spvId,
        address[] trancheTokens,
        uint8[] priorities
    );
    
    event CashflowDistributed(
        uint256 indexed spvId,
        uint256 amount,
        uint256 timestamp
    );
    
    event TranchePayment(
        uint256 indexed spvId,
        address indexed trancheToken,
        uint256 amount
    );
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }
    
    /**
     * @dev Create tranches for an SPV
     * @param spvId SPV identifier
     * @param configs Array of tranche configurations
     * @return trancheTokens Array of created tranche token addresses
     */
    function createTranche(
        uint256 spvId,
        TrancheConfig[] memory configs
    ) external onlyRole(ADMIN_ROLE) returns (address[] memory trancheTokens) {
        require(!spvExists[spvId], "Tranches already exist for this SPV");
        require(configs.length > 0 && configs.length <= 3, "Invalid number of tranches");
        
        // Validate total allocation
        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < configs.length; i++) {
            totalAllocation += configs[i].allocation;
        }
        require(totalAllocation == 10000, "Total allocation must be 100%");
        
        trancheTokens = new address[](configs.length);
        uint8[] memory priorities = new uint8[](configs.length);
        
        for (uint256 i = 0; i < configs.length; i++) {
            // Deploy new tranche token
            PermissionedToken trancheToken = new PermissionedToken();
            trancheToken.initialize(
                configs[i].name,
                configs[i].symbol,
                spvId,
                msg.sender
            );
            
            tranches[spvId].push(Tranche({
                tokenAddress: address(trancheToken),
                priority: configs[i].priority,
                targetYield: configs[i].targetYield,
                allocation: configs[i].allocation,
                totalPaid: 0,
                totalOwed: 0
            }));
            
            trancheTokens[i] = address(trancheToken);
            priorities[i] = configs[i].priority;
        }
        
        spvExists[spvId] = true;
        
        emit TrancheCreated(spvId, trancheTokens, priorities);
        return trancheTokens;
    }
    
    /**
     * @dev Distribute cashflow to tranches based on priority
     * @param spvId SPV identifier
     * @param amount Total amount to distribute
     */
    function distributeCashflow(uint256 spvId, uint256 amount) 
        external 
        onlyRole(OPERATOR_ROLE) 
    {
        require(spvExists[spvId], "SPV does not exist");
        require(amount > 0, "Amount must be greater than 0");
        
        Tranche[] storage spvTranches = tranches[spvId];
        require(spvTranches.length > 0, "No tranches for SPV");
        
        // Sort by priority (already sorted on creation, but ensure)
        _sortByPriority(spvTranches);
        
        uint256 remaining = amount;
        
        // Distribute by priority
        for (uint256 i = 0; i < spvTranches.length && remaining > 0; i++) {
            Tranche storage tranche = spvTranches[i];
            
            // Calculate owed amount
            uint256 owed = tranche.totalOwed - tranche.totalPaid;
            uint256 payment = remaining > owed ? owed : remaining;
            
            if (payment > 0) {
                tranche.totalPaid += payment;
                remaining -= payment;
                
                emit TranchePayment(spvId, tranche.tokenAddress, payment);
            }
        }
        
        emit CashflowDistributed(spvId, amount, block.timestamp);
    }
    
    /**
     * @dev Update owed amounts for tranches
     * @param spvId SPV identifier
     * @param owedAmounts Array of owed amounts per tranche
     */
    function updateOwedAmounts(
        uint256 spvId,
        uint256[] calldata owedAmounts
    ) external onlyRole(OPERATOR_ROLE) {
        require(spvExists[spvId], "SPV does not exist");
        
        Tranche[] storage spvTranches = tranches[spvId];
        require(owedAmounts.length == spvTranches.length, "Invalid array length");
        
        for (uint256 i = 0; i < spvTranches.length; i++) {
            spvTranches[i].totalOwed += owedAmounts[i];
        }
    }
    
    /**
     * @dev Get all tranches for an SPV
     * @param spvId SPV identifier
     * @return Array of tranches
     */
    function getTranches(uint256 spvId) 
        external 
        view 
        returns (Tranche[] memory) 
    {
        return tranches[spvId];
    }
    
    /**
     * @dev Sort tranches by priority (bubble sort for small arrays)
     */
    function _sortByPriority(Tranche[] storage trancheArray) internal {
        uint256 length = trancheArray.length;
        for (uint256 i = 0; i < length; i++) {
            for (uint256 j = i + 1; j < length; j++) {
                if (trancheArray[i].priority > trancheArray[j].priority) {
                    Tranche memory temp = trancheArray[i];
                    trancheArray[i] = trancheArray[j];
                    trancheArray[j] = temp;
                }
            }
        }
    }
    
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(ADMIN_ROLE)
        override
    {}
}
