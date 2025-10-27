import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { PermissionedToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PermissionedToken", function () {
  let token: PermissionedToken;
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  
  const SPV_ID = 1;
  const TOKEN_NAME = "RWA Token";
  const TOKEN_SYMBOL = "RWA";
  
  beforeEach(async function () {
    [admin, user1, user2] = await ethers.getSigners();
    
    const PermissionedTokenFactory = await ethers.getContractFactory("PermissionedToken");
    token = await upgrades.deployProxy(
      PermissionedTokenFactory,
      [TOKEN_NAME, TOKEN_SYMBOL, SPV_ID, admin.address],
      { initializer: "initialize" }
    ) as unknown as PermissionedToken;
    
    await token.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await token.name()).to.equal(TOKEN_NAME);
      expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
    });
    
    it("Should set the correct SPV ID", async function () {
      expect(await token.spvId()).to.equal(SPV_ID);
    });
    
    it("Should grant admin roles", async function () {
      const MINTER_ROLE = await token.MINTER_ROLE();
      expect(await token.hasRole(MINTER_ROLE, admin.address)).to.be.true;
    });
  });
  
  describe("Minting", function () {
    it("Should mint tokens to whitelisted address", async function () {
      await token.setWhitelist(user1.address, true);
      await token.mint(user1.address, ethers.parseEther("100"));
      
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });
    
    it("Should fail to mint to non-whitelisted address", async function () {
      await expect(
        token.mint(user1.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Recipient not whitelisted");
    });
    
    it("Should fail if caller is not minter", async function () {
      await token.setWhitelist(user1.address, true);
      
      await expect(
        token.connect(user1).mint(user1.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });
  
  describe("Transfers", function () {
    beforeEach(async function () {
      await token.setWhitelist(user1.address, true);
      await token.setWhitelist(user2.address, true);
      await token.mint(user1.address, ethers.parseEther("100"));
    });
    
    it("Should allow transfer between whitelisted addresses", async function () {
      await token.connect(user1).transfer(user2.address, ethers.parseEther("50"));
      
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
      expect(await token.balanceOf(user2.address)).to.equal(ethers.parseEther("50"));
    });
    
    it("Should fail transfer to non-whitelisted address", async function () {
      const [, , , user3] = await ethers.getSigners();
      
      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther("50"))
      ).to.be.revertedWith("Transfer not allowed");
    });
    
    it("Should fail transfer during lockup period", async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400; // 1 day
      await token.setLockup(user1.address, futureTime);
      
      await expect(
        token.connect(user1).transfer(user2.address, ethers.parseEther("50"))
      ).to.be.revertedWith("Transfer not allowed");
    });
  });
  
  describe("Whitelist Management", function () {
    it("Should add address to whitelist", async function () {
      await token.setWhitelist(user1.address, true);
      expect(await token.isWhitelisted(user1.address)).to.be.true;
    });
    
    it("Should remove address from whitelist", async function () {
      await token.setWhitelist(user1.address, true);
      await token.setWhitelist(user1.address, false);
      expect(await token.isWhitelisted(user1.address)).to.be.false;
    });
    
    it("Should batch whitelist addresses", async function () {
      await token.setWhitelistBatch([user1.address, user2.address], true);
      
      expect(await token.isWhitelisted(user1.address)).to.be.true;
      expect(await token.isWhitelisted(user2.address)).to.be.true;
    });
  });
  
  describe("Dividends", function () {
    let dividendToken: PermissionedToken;
    
    beforeEach(async function () {
      // Deploy dividend token
      const DividendTokenFactory = await ethers.getContractFactory("PermissionedToken");
      dividendToken = await upgrades.deployProxy(
        DividendTokenFactory,
        ["Dividend Token", "DIV", 2, admin.address],
        { initializer: "initialize" }
      ) as unknown as PermissionedToken;
      
      await dividendToken.waitForDeployment();
      
      // Setup
      await token.setWhitelist(user1.address, true);
      await token.setWhitelist(user2.address, true);
      await token.mint(user1.address, ethers.parseEther("60"));
      await token.mint(user2.address, ethers.parseEther("40"));
      
      await dividendToken.setWhitelist(admin.address, true);
      await dividendToken.mint(admin.address, ethers.parseEther("100"));
      await dividendToken.approve(await token.getAddress(), ethers.parseEther("100"));
    });
    
    it("Should distribute dividends proportionally", async function () {
      await token.distributeDividends(
        await dividendToken.getAddress(),
        ethers.parseEther("100")
      );
      
      // Check that dividends were recorded
      const totalDividends = await token.totalDividendsPerToken(await dividendToken.getAddress());
      expect(totalDividends).to.be.gt(0);
    });
  });
  
  describe("Pause", function () {
    beforeEach(async function () {
      await token.setWhitelist(user1.address, true);
      await token.setWhitelist(user2.address, true);
      await token.mint(user1.address, ethers.parseEther("100"));
    });
    
    it("Should pause transfers", async function () {
      await token.pause();
      
      await expect(
        token.connect(user1).transfer(user2.address, ethers.parseEther("50"))
      ).to.be.reverted;
    });
    
    it("Should unpause transfers", async function () {
      await token.pause();
      await token.unpause();
      
      await token.connect(user1).transfer(user2.address, ethers.parseEther("50"));
      expect(await token.balanceOf(user2.address)).to.equal(ethers.parseEther("50"));
    });
  });
});
