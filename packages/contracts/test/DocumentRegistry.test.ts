import { expect } from "chai";
import { ethers } from "hardhat";
import { DocumentRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("DocumentRegistry", function () {
  let registry: DocumentRegistry;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("DocumentRegistry");
    registry = await Registry.deploy();
  });

  describe("Deployment", function () {
    it("Should set the owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });
  });

  describe("Register Document", function () {
    it("Should register a document", async function () {
      const ipfsHash = "QmTest123456789";
      const docType = "DEED";
      const entityType = "SPV";
      const entityId = 1;

      await expect(
        registry.registerDocument(ipfsHash, docType, entityType, entityId)
      ).to.emit(registry, "DocumentRegistered");

      const doc = await registry.getDocument(1);
      expect(doc.ipfsHash).to.equal(ipfsHash);
      expect(doc.documentType).to.equal(docType);
      expect(doc.entityType).to.equal(entityType);
      expect(doc.entityId).to.equal(entityId);
      expect(doc.uploader).to.equal(owner.address);
    });

    it("Should increment document ID", async function () {
      await registry.registerDocument("QmHash1", "DEED", "SPV", 1);
      await registry.registerDocument("QmHash2", "TITLE", "SPV", 1);

      const doc1 = await registry.getDocument(1);
      const doc2 = await registry.getDocument(2);

      expect(doc1.ipfsHash).to.equal("QmHash1");
      expect(doc2.ipfsHash).to.equal("QmHash2");
    });

    it("Should not allow empty IPFS hash", async function () {
      await expect(
        registry.registerDocument("", "DEED", "SPV", 1)
      ).to.be.revertedWith("Invalid IPFS hash");
    });
  });

  describe("Get Documents", function () {
    beforeEach(async function () {
      await registry.registerDocument("QmHash1", "DEED", "SPV", 1);
      await registry.registerDocument("QmHash2", "TITLE", "SPV", 1);
      await registry.registerDocument("QmHash3", "LEASE", "SPV", 2);
    });

    it("Should get document by ID", async function () {
      const doc = await registry.getDocument(1);
      expect(doc.ipfsHash).to.equal("QmHash1");
    });

    it("Should get documents by entity", async function () {
      const docs = await registry.getDocumentsByEntity("SPV", 1);
      expect(docs.length).to.equal(2);
      expect(docs[0]).to.equal(1);
      expect(docs[1]).to.equal(2);
    });

    it("Should get documents by uploader", async function () {
      const docs = await registry.getDocumentsByUploader(owner.address);
      expect(docs.length).to.equal(3);
    });

    it("Should revert for non-existent document", async function () {
      await expect(registry.getDocument(999)).to.be.revertedWith("Document does not exist");
    });
  });

  describe("Verify Document", function () {
    beforeEach(async function () {
      await registry.registerDocument("QmHash1", "DEED", "SPV", 1);
    });

    it("Should verify document", async function () {
      await expect(registry.verifyDocument(1))
        .to.emit(registry, "DocumentVerified")
        .withArgs(1, owner.address);

      const doc = await registry.getDocument(1);
      expect(doc.verified).to.be.true;
      expect(doc.verifier).to.equal(owner.address);
    });

    it("Should not allow non-owner to verify", async function () {
      await expect(
        registry.connect(user1).verifyDocument(1)
      ).to.be.reverted;
    });

    it("Should not verify already verified document", async function () {
      await registry.verifyDocument(1);
      await expect(registry.verifyDocument(1)).to.be.revertedWith("Already verified");
    });
  });

  describe("Revoke Document", function () {
    beforeEach(async function () {
      await registry.registerDocument("QmHash1", "DEED", "SPV", 1);
    });

    it("Should revoke document", async function () {
      await expect(registry.revokeDocument(1, "Invalid document"))
        .to.emit(registry, "DocumentRevoked")
        .withArgs(1, owner.address, "Invalid document");

      const doc = await registry.getDocument(1);
      expect(doc.revoked).to.be.true;
    });

    it("Should not allow non-owner to revoke", async function () {
      await expect(
        registry.connect(user1).revokeDocument(1, "Test")
      ).to.be.reverted;
    });
  });

  describe("Document Count", function () {
    it("Should return correct document count", async function () {
      expect(await registry.documentCount()).to.equal(0);

      await registry.registerDocument("QmHash1", "DEED", "SPV", 1);
      expect(await registry.documentCount()).to.equal(1);

      await registry.registerDocument("QmHash2", "TITLE", "SPV", 1);
      expect(await registry.documentCount()).to.equal(2);
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause", async function () {
      await registry.pause();
      expect(await registry.paused()).to.be.true;

      await registry.unpause();
      expect(await registry.paused()).to.be.false;
    });

    it("Should not allow registration when paused", async function () {
      await registry.pause();

      await expect(
        registry.registerDocument("QmHash1", "DEED", "SPV", 1)
      ).to.be.reverted;
    });
  });
});
