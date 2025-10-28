// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DocumentRegistry
 * @dev Registry for storing document hashes on-chain for verification
 */
contract DocumentRegistry is Ownable, Pausable {
    
    struct Document {
        string ipfsHash;
        string documentType;
        string entityType;
        uint256 entityId;
        uint256 timestamp;
        address uploader;
        bool verified;
        bool revoked;
        address verifier;
        string revokeReason;
    }
    
    uint256 public documentCount;
    mapping(uint256 => Document) public documents;
    mapping(string => mapping(uint256 => uint256[])) public entityDocuments; // entityType => entityId => documentIds
    mapping(address => uint256[]) public uploaderDocuments;
    
    event DocumentRegistered(
        uint256 indexed documentId,
        string ipfsHash,
        string documentType,
        string entityType,
        uint256 entityId,
        address uploader
    );
    
    event DocumentVerified(uint256 indexed documentId, address verifier);
    event DocumentRevoked(uint256 indexed documentId, address revoker, string reason);
    
    constructor() Ownable(msg.sender) {}
    
    function registerDocument(
        string calldata ipfsHash,
        string calldata documentType,
        string calldata entityType,
        uint256 entityId
    ) external whenNotPaused returns (uint256) {
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");
        
        documentCount++;
        uint256 documentId = documentCount;
        
        documents[documentId] = Document({
            ipfsHash: ipfsHash,
            documentType: documentType,
            entityType: entityType,
            entityId: entityId,
            timestamp: block.timestamp,
            uploader: msg.sender,
            verified: false,
            revoked: false,
            verifier: address(0),
            revokeReason: ""
        });
        
        entityDocuments[entityType][entityId].push(documentId);
        uploaderDocuments[msg.sender].push(documentId);
        
        emit DocumentRegistered(documentId, ipfsHash, documentType, entityType, entityId, msg.sender);
        
        return documentId;
    }
    
    function verifyDocument(uint256 documentId) external onlyOwner {
        require(documentId > 0 && documentId <= documentCount, "Document does not exist");
        require(!documents[documentId].verified, "Already verified");
        require(!documents[documentId].revoked, "Document revoked");
        
        documents[documentId].verified = true;
        documents[documentId].verifier = msg.sender;
        
        emit DocumentVerified(documentId, msg.sender);
    }
    
    function revokeDocument(uint256 documentId, string calldata reason) external onlyOwner {
        require(documentId > 0 && documentId <= documentCount, "Document does not exist");
        require(!documents[documentId].revoked, "Already revoked");
        
        documents[documentId].revoked = true;
        documents[documentId].revokeReason = reason;
        
        emit DocumentRevoked(documentId, msg.sender, reason);
    }
    
    function getDocument(uint256 documentId) external view returns (Document memory) {
        require(documentId > 0 && documentId <= documentCount, "Document does not exist");
        return documents[documentId];
    }
    
    function getDocumentsByEntity(string calldata entityType, uint256 entityId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return entityDocuments[entityType][entityId];
    }
    
    function getDocumentsByUploader(address uploader) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return uploaderDocuments[uploader];
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
