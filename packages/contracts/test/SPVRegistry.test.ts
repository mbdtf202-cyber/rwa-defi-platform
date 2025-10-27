import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SPVRegistry, PermissionedToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SPVRegistry", function () {
  let registry: SPVRegistry;
  let token: PermissionedToken;
  let admin: SignerWithAddress;
  let manager: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [admin, manager, user] = await ethers.getSigners();

    const SPVRegistry = await ethers.getContractFactory("SPVRegistry");
    registry = await upgrades.deployProxy(SPVRegistry, [admin.address]) as unknown as SPVRegistry;
    await registry.waitForDeployment();

    const SPV_MANAGER_ROLE = await registry.SPV_MANAGER_ROLE();
    await registry.grantRole(SPV_MANAGER_ROLE, manager.address);

    const PermissionedToken = await ethers.getContractFactory("PermissionedToken");
    token = await upgrades.deployProxy(PermissionedToken, [
      "Test Token",
      "TEST",
      1,
      admin.address
    ]) as unknown as PermissionedToken;
    await token.waitForDeployment();
  });

  describe("SPV Registration", function () {
    it("Should register a new SPV", async function () {
      const tx = await registry.connect(manager).registerSPV(
        "Test SPV LLC",
        "Delaware",
        "REG123456",
        await token.getAddress()
      );

      await expect(tx)
        .to.emit(registry, "SPVRegistered")
        .withArgs(1, "Test SPV LLC", "Delaware", await token.getAddress());

      const spv = await registry.getSPV(1);
      expect(spv.companyName).to.equal("Test SPV LLC");
      expect(spv.jurisdiction).to.equal("Delaware");
      expect(spv.active).to.be.true;
    });

    it("Should not allow duplicate registration numbers", async function () {
      await registry.connect(manager).registerSPV(
        "Test SPV LLC",
        "Delaware",
        "REG123456",
        await token.getAddress()
      );

      await expect(
        registry.connect(manager).registerSPV(
          "Another SPV",
          "Delaware",
          "REG123456",
          user.address
        )
      ).to.be.revertedWith("Registration already exists");
    });

    it("Should only allow SPV managers to register", async function () {
      await expect(
        registry.connect(user).registerSPV(
          "Test SPV LLC",
          "Delaware",
          "REG123456",
          await token.getAddress()
        )
      ).to.be.reverted;
    });
  });

  describe("Property Management", function () {
    beforeEach(async function () {
      await registry.connect(manager).registerSPV(
        "Test SPV LLC",
        "Delaware",
        "REG123456",
        await token.getAddress()
      );
    });

    it("Should add property to SPV", async function () {
      const tx = await registry.connect(manager).addProperty(
        1,
        "123 Main St, New York, NY",
        "COMMERCIAL",
        ethers.parseEther("1000"),
        ethers.parseEther("10")
      );

      await expect(tx)
        .to.emit(registry, "PropertyAdded")
        .withArgs(1, 1, "123 Main St, New York, NY", ethers.parseEther("1000"));

      const property = await registry.getProperty(1);
      expect(property.propertyAddress).to.equal("123 Main St, New York, NY");
      expect(property.purchasePrice).to.equal(ethers.parseEther("1000"));
    });

    it("Should update SPV total value when adding property", async function () {
      await registry.connect(manager).addProperty(
        1,
        "123 Main St",
        "COMMERCIAL",
        ethers.parseEther("1000"),
        ethers.parseEther("10")
      );

      const spv = await registry.getSPV(1);
      expect(spv.totalValue).to.equal(ethers.parseEther("1000"));
    });

    it("Should get properties by SPV", async function () {
      await registry.connect(manager).addProperty(
        1,
        "123 Main St",
        "COMMERCIAL",
        ethers.parseEther("1000"),
        ethers.parseEther("10")
      );

      await registry.connect(manager).addProperty(
        1,
        "456 Oak Ave",
        "RESIDENTIAL",
        ethers.parseEther("500"),
        ethers.parseEther("5")
      );

      const properties = await registry.getPropertiesBySPV(1);
      expect(properties.length).to.equal(2);
    });
  });

  describe("Valuation Updates", function () {
    beforeEach(async function () {
      await registry.connect(manager).registerSPV(
        "Test SPV LLC",
        "Delaware",
        "REG123456",
        await token.getAddress()
      );

      await registry.connect(manager).addProperty(
        1,
        "123 Main St",
        "COMMERCIAL",
        ethers.parseEther("1000"),
        ethers.parseEther("10")
      );
    });

    it("Should update SPV valuation", async function () {
      const newValue = ethers.parseEther("1200");
      
      await expect(
        registry.connect(manager).updateSPVValuation(1, newValue)
      ).to.emit(registry, "SPVValuationUpdated");

      const spv = await registry.getSPV(1);
      expect(spv.totalValue).to.equal(newValue);
    });

    it("Should update property valuation and SPV total", async function () {
      const newValue = ethers.parseEther("1100");
      
      await registry.connect(manager).updatePropertyValuation(1, newValue);

      const property = await registry.getProperty(1);
      expect(property.currentValue).to.equal(newValue);

      const spv = await registry.getSPV(1);
      expect(spv.totalValue).to.equal(newValue);
    });
  });

  describe("SPV Status", function () {
    beforeEach(async function () {
      await registry.connect(manager).registerSPV(
        "Test SPV LLC",
        "Delaware",
        "REG123456",
        await token.getAddress()
      );
    });

    it("Should allow admin to change SPV status", async function () {
      await expect(
        registry.connect(admin).setSPVStatus(1, false)
      ).to.emit(registry, "SPVStatusChanged").withArgs(1, false);

      const spv = await registry.getSPV(1);
      expect(spv.active).to.be.false;
    });

    it("Should not allow adding properties to inactive SPV", async function () {
      await registry.connect(admin).setSPVStatus(1, false);

      await expect(
        registry.connect(manager).addProperty(
          1,
          "123 Main St",
          "COMMERCIAL",
          ethers.parseEther("1000"),
          ethers.parseEther("10")
        )
      ).to.be.revertedWith("SPV is not active");
    });
  });
});
