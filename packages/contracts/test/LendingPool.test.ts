import { expect } from 'chai';
import { ethers } from 'hardhat';
import { LendingPool, PermissionedToken } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('LendingPool', function () {
  let lendingPool: LendingPool;
  let collateralToken: PermissionedToken;
  let borrowToken: PermissionedToken;
  let owner: SignerWithAddress;
  let borrower: SignerWithAddress;

  beforeEach(async function () {
    [owner, borrower] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory('PermissionedToken');
    
    collateralToken = await TokenFactory.deploy() as PermissionedToken;
    await collateralToken.initialize('Collateral', 'COLL', 1, owner.address);
    
    borrowToken = await TokenFactory.deploy() as PermissionedToken;
    await borrowToken.initialize('Borrow', 'BORR', 2, owner.address);

    const LendingPoolFactory = await ethers.getContractFactory('LendingPool');
    lendingPool = await LendingPoolFactory.deploy(
      await collateralToken.getAddress(),
      await borrowToken.getAddress(),
      150 // 150% collateralization ratio
    );

    // Setup
    await collateralToken.mint(borrower.address, ethers.parseEther('1000'));
    await borrowToken.mint(await lendingPool.getAddress(), ethers.parseEther('10000'));
  });

  describe('Borrowing', function () {
    it('Should allow borrowing with sufficient collateral', async function () {
      const collateralAmount = ethers.parseEther('150');
      const borrowAmount = ethers.parseEther('100');

      await collateralToken.connect(borrower).approve(
        await lendingPool.getAddress(),
        collateralAmount
      );

      await lendingPool.connect(borrower).borrow(borrowAmount, collateralAmount);

      expect(await borrowToken.balanceOf(borrower.address)).to.equal(borrowAmount);
    });

    it('Should reject borrowing with insufficient collateral', async function () {
      const collateralAmount = ethers.parseEther('100');
      const borrowAmount = ethers.parseEther('100');

      await collateralToken.connect(borrower).approve(
        await lendingPool.getAddress(),
        collateralAmount
      );

      await expect(
        lendingPool.connect(borrower).borrow(borrowAmount, collateralAmount)
      ).to.be.revertedWith('Insufficient collateral');
    });
  });
});
