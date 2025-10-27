// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title OracleAggregator
 * @dev Aggregates data from multiple oracle sources for RWA platform
 */
contract OracleAggregator is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    struct OracleData {
        uint256 value;
        uint256 timestamp;
        address oracle;
        bool valid;
    }
    
    struct AggregatedData {
        uint256 value;
        uint256 timestamp;
        uint256 confidence;
        uint256 sourceCount;
    }
    
    // Data type constants
    bytes32 public constant RENT_CONFIRMATION = keccak256("RENT_CONFIRMATION");
    bytes32 public constant NAV_VALUATION = keccak256("NAV_VALUATION");
    bytes32 public constant PROOF_OF_RESERVE = keccak256("PROOF_OF_RESERVE");
    bytes32 public constant OCCUPANCY_RATE = keccak256("OCCUPANCY_RATE");
    
    // SPV ID => Data Type => Oracle Address => Data
    mapping(uint256 => mapping(bytes32 => mapping(address => OracleData))) public oracleData;
    
    // SPV ID => Data Type => Aggregated Data
    mapping(uint256 => mapping(bytes32 => AggregatedData)) public aggregatedData;
    
    // Oracle addresses
    address[] public oracles;
    mapping(address => bool) public isOracle;
    
    // Staleness threshold (default 1 hour)
    uint256 public stalenessThreshold;
    
    // Minimum sources required for aggregation
    uint256 public minSources;
    
    // Maximum deviation allowed between sources (in basis points)
    uint256 public maxDeviation;
    
    uint256 public constant BASIS_POINTS = 10000;
    
    event OracleDataUpdated(
        uint256 indexed spvId,
        bytes32 indexed dataType,
        address indexed oracle,
        uint256 value,
        uint256 timestamp
    );
    
    event DataAggregated(
        uint256 indexed spvId,
        bytes32 indexed dataType,
        uint256 value,
        uint256 confidence,
        uint256 sourceCount
    );
    
    event OracleAdded(address indexed oracle);
    event OracleRemoved(address indexed oracle);
    event StalenessThresholdUpdated(uint256 newThreshold);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address admin,
        uint256 _stalenessThreshold,
        uint256 _minSources,
        uint256 _maxDeviation
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        stalenessThreshold = _stalenessThreshold;
        minSources = _minSources;
        maxDeviation = _maxDeviation;
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }
    
    /**
     * @dev Add oracle address
     */
    function addOracle(address oracle) external onlyRole(ADMIN_ROLE) {
        require(oracle != address(0), "Invalid oracle");
        require(!isOracle[oracle], "Oracle already exists");
        
        oracles.push(oracle);
        isOracle[oracle] = true;
        _grantRole(ORACLE_ROLE, oracle);
        
        emit OracleAdded(oracle);
    }
    
    /**
     * @dev Remove oracle address
     */
    function removeOracle(address oracle) external onlyRole(ADMIN_ROLE) {
        require(isOracle[oracle], "Oracle does not exist");
        
        isOracle[oracle] = false;
        _revokeRole(ORACLE_ROLE, oracle);
        
        // Remove from array
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i] == oracle) {
                oracles[i] = oracles[oracles.length - 1];
                oracles.pop();
                break;
            }
        }
        
        emit OracleRemoved(oracle);
    }
    
    /**
     * @dev Update oracle data
     */
    function updateValue(
        uint256 spvId,
        bytes32 dataType,
        uint256 value,
        bytes memory signature
    ) external onlyRole(ORACLE_ROLE) {
        // Verify signature (simplified - in production use proper signature verification)
        require(signature.length > 0, "Invalid signature");
        
        oracleData[spvId][dataType][msg.sender] = OracleData({
            value: value,
            timestamp: block.timestamp,
            oracle: msg.sender,
            valid: true
        });
        
        emit OracleDataUpdated(spvId, dataType, msg.sender, value, block.timestamp);
        
        // Trigger aggregation
        _aggregateData(spvId, dataType);
    }
    
    /**
     * @dev Get latest aggregated value
     */
    function getLatestValue(
        uint256 spvId,
        bytes32 dataType
    ) external view returns (uint256 value, uint256 timestamp) {
        AggregatedData memory data = aggregatedData[spvId][dataType];
        require(data.timestamp > 0, "No data available");
        require(!isStale(spvId, dataType), "Data is stale");
        
        return (data.value, data.timestamp);
    }
    
    /**
     * @dev Check if data is stale
     */
    function isStale(uint256 spvId, bytes32 dataType) public view returns (bool) {
        AggregatedData memory data = aggregatedData[spvId][dataType];
        if (data.timestamp == 0) return true;
        return block.timestamp - data.timestamp > stalenessThreshold;
    }
    
    /**
     * @dev Get all oracle values for a data point
     */
    function getOracleValues(
        uint256 spvId,
        bytes32 dataType
    ) external view returns (uint256[] memory values, uint256[] memory timestamps) {
        uint256 count = 0;
        
        // Count valid oracles
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracleData[spvId][dataType][oracles[i]].valid) {
                count++;
            }
        }
        
        values = new uint256[](count);
        timestamps = new uint256[](count);
        
        uint256 index = 0;
        for (uint256 i = 0; i < oracles.length; i++) {
            OracleData memory data = oracleData[spvId][dataType][oracles[i]];
            if (data.valid) {
                values[index] = data.value;
                timestamps[index] = data.timestamp;
                index++;
            }
        }
        
        return (values, timestamps);
    }
    
    /**
     * @dev Update staleness threshold
     */
    function setStalenessThreshold(uint256 newThreshold) external onlyRole(ADMIN_ROLE) {
        require(newThreshold > 0, "Invalid threshold");
        stalenessThreshold = newThreshold;
        emit StalenessThresholdUpdated(newThreshold);
    }
    
    /**
     * @dev Set minimum sources required
     */
    function setMinSources(uint256 _minSources) external onlyRole(ADMIN_ROLE) {
        require(_minSources > 0, "Invalid min sources");
        minSources = _minSources;
    }
    
    /**
     * @dev Set maximum deviation
     */
    function setMaxDeviation(uint256 _maxDeviation) external onlyRole(ADMIN_ROLE) {
        require(_maxDeviation <= BASIS_POINTS, "Invalid deviation");
        maxDeviation = _maxDeviation;
    }
    
    /**
     * @dev Aggregate data from multiple oracles
     */
    function _aggregateData(uint256 spvId, bytes32 dataType) internal {
        uint256[] memory values = new uint256[](oracles.length);
        uint256 validCount = 0;
        
        // Collect valid values
        for (uint256 i = 0; i < oracles.length; i++) {
            OracleData memory data = oracleData[spvId][dataType][oracles[i]];
            if (data.valid && block.timestamp - data.timestamp <= stalenessThreshold) {
                values[validCount] = data.value;
                validCount++;
            }
        }
        
        require(validCount >= minSources, "Insufficient sources");
        
        // Calculate median
        uint256 median = _calculateMedian(values, validCount);
        
        // Calculate confidence based on deviation
        uint256 confidence = _calculateConfidence(values, validCount, median);
        
        aggregatedData[spvId][dataType] = AggregatedData({
            value: median,
            timestamp: block.timestamp,
            confidence: confidence,
            sourceCount: validCount
        });
        
        emit DataAggregated(spvId, dataType, median, confidence, validCount);
    }
    
    /**
     * @dev Calculate median of values
     */
    function _calculateMedian(
        uint256[] memory values,
        uint256 count
    ) internal pure returns (uint256) {
        if (count == 0) return 0;
        if (count == 1) return values[0];
        
        // Sort values (bubble sort for small arrays)
        for (uint256 i = 0; i < count; i++) {
            for (uint256 j = i + 1; j < count; j++) {
                if (values[i] > values[j]) {
                    uint256 temp = values[i];
                    values[i] = values[j];
                    values[j] = temp;
                }
            }
        }
        
        // Return median
        if (count % 2 == 0) {
            return (values[count / 2 - 1] + values[count / 2]) / 2;
        } else {
            return values[count / 2];
        }
    }
    
    /**
     * @dev Calculate confidence score based on deviation
     */
    function _calculateConfidence(
        uint256[] memory values,
        uint256 count,
        uint256 median
    ) internal view returns (uint256) {
        if (count == 0) return 0;
        if (count == 1) return BASIS_POINTS;
        
        uint256 totalDeviation = 0;
        
        for (uint256 i = 0; i < count; i++) {
            uint256 deviation = values[i] > median ? 
                values[i] - median : median - values[i];
            totalDeviation += (deviation * BASIS_POINTS) / median;
        }
        
        uint256 avgDeviation = totalDeviation / count;
        
        if (avgDeviation >= maxDeviation) return 0;
        
        return BASIS_POINTS - (avgDeviation * BASIS_POINTS) / maxDeviation;
    }
    
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(ADMIN_ROLE)
        override
    {}
}
