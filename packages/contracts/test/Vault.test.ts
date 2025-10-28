import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { Vault, PermissionedToken } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('Vault', function () {
  let vault: Vault;
  let token: PermissionedToken;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy PermissionedToken
    const TokenFactory = await ethers.getContractFactory('PermissionedToken');
    token = await upgrades.deployProxy(
      TokenFactory,
      ['Test Token', 'TEST', owner.address],
      { initializer: 'initialize' }
    ) as unknown as PermissionedToken;

    // Deploy Vault
    const VaultFactory = await ethers.getContractFactory('Vault');
    vault = await upgrades.deployProxy(
      VaultFactory,
      [await token.getAddress(), 'Vault Shares', 'vTEST'],
      { initializer: 'initialize' }
    ) as unknown as Vault;

    // Setup: Mint tokens and approve vault
    await token.mint(user1.address, ethers.parseEther('1000'));
    await token.connect(user1).approve(await vault.getAddress(), ethers.parseEther('1000'));
  });

  describe('Deployment', function () {
    it('Should set the correct asset token', async function () {
      expect(await vault.asset()).to.equal(await token.getAddress());
    });

    it('Should set the correct name and symbol', async function () {
      expect(await vault.name()).to.equal('Vault Shares');
      expect(await vault.symbol()).to.equal('vTEST');
    });
  });

  describe('Deposits', function () {
    it('Should allow users to deposit', async function () {
      const depositAmount = ethers.parseEther('100');
      
      await vault.connect(user1).deposit(depositAmount, user1.address);
      
      expect(await vault.balanceOf(user1.address)).to.be.gt(0);
      expect(await token.balanceOf(await vault.getAddress())).to.equal(depositAmount);
    });

    it('Should mint correct amount of shares', async function () {
      const depositAmount = ethers.parseEther('100');
      
      const sharesBefore = await vault.balanceOf(user1.address);
      await vault.connect(user1).deposit(depositAmount, user1.address);
      const sharesAfter = await vault.balanceOf(user1.address);
      
      expect(sharesAfter - sharesBefore).to.equal(depositAmount);
    });
  });

  describe('Withdrawals', function () {
    beforeEach(async function () {
      await vault.connect(user1).deposit(ethers.parseEther('100'), user1.address);
    });

    it('Should allow users to withdraw', async function () {
      const shares = await vault.balanceOf(user1.address);
      const balanceBefore = await token.balanceOf(user1.address);
      
      await vault.connect(user1).redeem(shares, user1.address, user1.address);
      
      const balanceAfter = await token.balanceOf(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });
});
