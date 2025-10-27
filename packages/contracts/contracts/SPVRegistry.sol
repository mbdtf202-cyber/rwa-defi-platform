// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title SPVRegistry
 * @dev Central registry for all SPVs and their associated tokens
 */
contract SPVRegistry is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SPV_MANAGER_ROLE = keccak256("SPV_MANAGER_ROLE");
    
    struct SPVInfo {
        uint256 spvId;
        string companyName;
        string jurisdiction;
        string registrationNumber;
        address tokenAddress;
        bool active;
        uint256 createdAt;
        uint256 totalValue;
        uint256 lastValuation;
    }
    
    struct PropertyInfo {
        uint256 propertyId;
        uint256 spvId;
        string propertyAddress;
        string propertyType;
        uint256 purchasePrice;
        uint256 currentValue;
        uint256 monthlyRent;
        bool active;
    }
    
    uint256 private _spvIdCounter;
    uint256 private _propertyIdCounter;
    
    mapping(uint256 => SPVInfo) public spvs;
    mapping(uint256 => PropertyInfo) public properties;
    mapping(address => uint256) public tokenToSpv;
    mapping(string => uint256) public registrationToSpv;
    mapping(uint256 => uint256[]) public spvProperties;
    
    uint256[] public allSpvIds;
    uint256[] public allPropertyIds;
    
    event SPVRegistered(
        uint256 indexed spvId,
        string companyName,
        string jurisdiction,
        address tokenAddress
    );
    
    event PropertyAdded(
        uint256 indexed propertyId,
        uint256 indexed spvId,
        string propertyAddress,
        uint256 purchasePrice
    );
    
    event SPVValuationUpdated(
        uint256 indexed spvId,
        uint256 newValue,
        uint256 timestamp
    );
    
    event SPVStatusChanged(uint256 indexed spvId, bool active);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(SPV_MANAGER_ROLE, admin);
        
        _spvIdCounter = 1;
        _propertyIdCounter = 1;
    }
    
    function registerSPV(
        string memory companyName,
        string memory jurisdiction,
        string memory registrationNumber,
        address tokenAddress
    ) external onlyRole(SPV_MANAGER_ROLE) returns (uint256 spvId) {
        require(bytes(companyName).length > 0, "Company name required");
        require(bytes(registrationNumber).length > 0, "Registration number required");
        require(registrationToSpv[registrationNumber] == 0, "Registration already exists");
        require(tokenAddress != address(0), "Invalid token address");
        
        spvId = _spvIdCounter++;
        
        spvs[spvId] = SPVInfo({
            spvId: spvId,
            companyName: companyName,
            jurisdiction: jurisdiction,
            registrationNumber: registrationNumber,
            tokenAddress: tokenAddress,
            active: true,
            createdAt: block.timestamp,
            totalValue: 0,
            lastValuation: block.timestamp
        });
        
        tokenToSpv[tokenAddress] = spvId;
        registrationToSpv[registrationNumber] = spvId;
        allSpvIds.push(spvId);
        
        emit SPVRegistered(spvId, companyName, jurisdiction, tokenAddress);
        
        return spvId;
    }
    
    function addProperty(
        uint256 spvId,
        string memory propertyAddress,
        string memory propertyType,
        uint256 purchasePrice,
        uint256 monthlyRent
    ) external onlyRole(SPV_MANAGER_ROLE) returns (uint256 propertyId) {
        require(spvs[spvId].spvId != 0, "SPV does not exist");
        require(spvs[spvId].active, "SPV is not active");
        
        propertyId = _propertyIdCounter++;
        
        properties[propertyId] = PropertyInfo({
            propertyId: propertyId,
            spvId: spvId,
            propertyAddress: propertyAddress,
            propertyType: propertyType,
            purchasePrice: purchasePrice,
            currentValue: purchasePrice,
            monthlyRent: monthlyRent,
            active: true
        });
        
        allPropertyIds.push(propertyId);
        spvProperties[spvId].push(propertyId);
        
        spvs[spvId].totalValue += purchasePrice;
        
        emit PropertyAdded(propertyId, spvId, propertyAddress, purchasePrice);
        
        return propertyId;
    }
    
    function updateSPVValuation(
        uint256 spvId,
        uint256 newValue
    ) external onlyRole(SPV_MANAGER_ROLE) {
        require(spvs[spvId].spvId != 0, "SPV does not exist");
        
        spvs[spvId].totalValue = newValue;
        spvs[spvId].lastValuation = block.timestamp;
        
        emit SPVValuationUpdated(spvId, newValue, block.timestamp);
    }
    
    function updatePropertyValuation(
        uint256 propertyId,
        uint256 newValue
    ) external onlyRole(SPV_MANAGER_ROLE) {
        require(properties[propertyId].propertyId != 0, "Property does not exist");
        
        uint256 spvId = properties[propertyId].spvId;
        uint256 oldValue = properties[propertyId].currentValue;
        
        properties[propertyId].currentValue = newValue;
        spvs[spvId].totalValue = spvs[spvId].totalValue - oldValue + newValue;
        spvs[spvId].lastValuation = block.timestamp;
        
        emit SPVValuationUpdated(spvId, spvs[spvId].totalValue, block.timestamp);
    }
    
    function setSPVStatus(uint256 spvId, bool active) external onlyRole(ADMIN_ROLE) {
        require(spvs[spvId].spvId != 0, "SPV does not exist");
        spvs[spvId].active = active;
        emit SPVStatusChanged(spvId, active);
    }
    
    function getSPV(uint256 spvId) external view returns (SPVInfo memory) {
        require(spvs[spvId].spvId != 0, "SPV does not exist");
        return spvs[spvId];
    }
    
    function getProperty(uint256 propertyId) external view returns (PropertyInfo memory) {
        require(properties[propertyId].propertyId != 0, "Property does not exist");
        return properties[propertyId];
    }
    
    function getAllSPVs() external view returns (uint256[] memory) {
        return allSpvIds;
    }
    
    function getPropertiesBySPV(uint256 spvId) external view returns (uint256[] memory) {
        require(spvs[spvId].spvId != 0, "SPV does not exist");
        return spvProperties[spvId];
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}
}
