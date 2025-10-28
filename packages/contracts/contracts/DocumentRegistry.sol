// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title DocumentRegistry
 * @dev Registry for storing document hashes on-chain for verification
 */
contract DocumentRegistry is 
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPLOADER_ROLE = keccak256("UPLOADER_ROLE");
    
    struct Document {
        bytes32 ipfsHash;
        uint256 spvId;
        string documentType;
        uint256 timestamp;
        address uploader;
        bool verified;
    }
    
    mapping(bytes32 => Document) public documents;
    mapping(uint256 => bytes32[]) public spvDocuments;
    
    event DocumentStored(
        bytes32 indexed documentHash,
        uint256 indexed spvId,
        string documentType,
        address uploader
    );
    
    event DocumentVerified(bytes32 indexed documentHash, address verifier);
    
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(UPLOADER_ROLE, admin);
    }
    
    function storeDocument(
        bytes32 documentHash,
        bytes32 ipfsHash,
        uint256 spvId,
        string calldata documentType
    ) external onlyRole(UPLOADER_ROLE) {
        require(documents[documentHash].timestamp == 0, "Document already exists");
        
        documents[documentHash] = Document({
            ipfsHash: ipfsHash,
            spvId: spvId,
            documentType: documentType,
            timestamp: block.timestamp,
            uploader: msg.sender,
            verified: false
        });
        
        spvDocuments[spvId].push(documentHash);
        
        emit DocumentStored(documentHash, spvId, documentType, msg.sender);
    }
    
    function verifyDocument(bytes32 documentHash) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(documents[documentHash].timestamp != 0, "Document does not exist");
        documents[documentHash].verified = true;
        emit DocumentVerified(documentHash, msg.sender);
    }
    
    function getDocument(bytes32 documentHash) 
        external 
        view 
        returns (Document memory) 
    {
        return documents[documentHash];
    }
    
    function getSPVDocuments(uint256 spvId) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return spvDocuments[spvId];
    }
    
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(ADMIN_ROLE)
        override
    {}
}
