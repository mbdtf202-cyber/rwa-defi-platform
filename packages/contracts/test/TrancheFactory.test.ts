import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TrancheFactory, PermissionedToken } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('TrancheFactory', function () {
  let trancheFactory: TrancheFactory;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, operator, user] = await ethers.getSigners();

    const TrancheFactoryFactory = await ethers.getContractFactory('TrancheFactory');
    trancheFactory = await TrancheFactoryFactory.deploy();
    await trancheFactory.initialize(owner.address);

    // Grant operator role
    const OPERATOR_ROLE = await trancheFactory.OPERATOR_ROLE();
    await trancheFactory.grantRole(OPERATOR_ROLE, operator.address);
  });

  describe('Tranche Creation', function () {
    it('Should create tranches successfully', async function () {
      const spvId = 1;
      const configs = [
        {
          name: 'Senior Tranche',
          symbol: 'SENIOR',
          priority: 0,
          targetYield: 500, // 5%
          allocation: 5000, // 50%
        },
        {
          name: 'Junior Tranche',
          symbol: 'JUNIOR',
          priority: 1,
          targetYield: 1000, // 10%
          allocation: 5000, // 50%
        },
      ];

      const tx = await trancheFactory.createTranche(spvId, configs);
      const receipt = await tx.wait();

      const tranches = await trancheFactory.getTranches(spvId);
      expect(tranches.length).to.equal(2);
      expect(tranches[0].priority).to.equal(0);
      expect(tranches[1].priority).to.equal(1);
    });

    it('Should reject invalid allocation', async function () {
      const spvId = 1;
      const configs = [
        {
          name: 'Senior Tranche',
          symbol: 'SENIOR',
          priority: 0,
          targetYield: 500,
          allocation: 6000, // 60% - invalid
        },
        {
          name: 'Junior Tranche',
          symbol: 'JUNIOR',
          priority: 1,
          targetYield: 1000,
          allocation: 3000, // 30% - total 90%
        },
      ];

      await expect(
        trancheFactory.createTranche(spvId, configs)
      ).to.be.revertedWith('Total allocation must be 100%');
    });

    it('Should reject duplicate SPV', async function () {
      const spvId = 1;
      const configs = [
        {
          name: 'Senior Tranche',
          symbol: 'SENIOR',
          priority: 0,
          targetYield: 500,
          allocation: 10000,
        },
      ];

      await trancheFactory.createTranche(spvId, configs);

      await expect(
        trancheFactory.createTranche(spvId, configs)
      ).to.be.revertedWith('Tranches already exist for this SPV');
    });
  });

  describe('Cashflow Distribution', function () {
    beforeEach(async function () {
      const spvId = 1;
      const configs = [
        {
          name: 'Senior Tranche',
          symbol: 'SENIOR',
          priority: 0,
          targetYield: 500,
          allocation: 6000,
        },
        {
          name: 'Junior Tranche',
          symbol: 'JUNIOR',
          priority: 1,
          targetYield: 1000,
          allocation: 4000,
        },
      ];

      await trancheFactory.createTranche(spvId, configs);

      // Set owed amounts
      await trancheFactory.connect(operator).updateOwedAmounts(spvId, [
        ethers.parseEther('100'),
        ethers.parseEther('50'),
      ]);
    });

    it('Should distribute cashflow by priority', async function () {
      const spvId = 1;
      const amount = ethers.parseEther('150');

      await trancheFactory.connect(operator).distributeCashflow(spvId, amount);

      const tranches = await trancheFactory.getTranches(spvId);
      expect(tranches[0].totalPaid).to.equal(ethers.parseEther('100'));
      expect(tranches[1].totalPaid).to.equal(ethers.parseEther('50'));
    });

    it('Should handle insufficient cashflow', async function () {
      const spvId = 1;
      const amount = ethers.parseEther('80');

      await trancheFactory.connect(operator).distributeCashflow(spvId, amount);

      const tranches = await trancheFactory.getTranches(spvId);
      expect(tranches[0].totalPaid).to.equal(ethers.parseEther('80'));
      expect(tranches[1].totalPaid).to.equal(0);
    });
  });

  describe('Access Control', function () {
    it('Should only allow admin to create tranches', async function () {
      const spvId = 1;
      const configs = [
        {
          name: 'Senior Tranche',
          symbol: 'SENIOR',
          priority: 0,
          targetYield: 500,
          allocation: 10000,
        },
      ];

      await expect(
        trancheFactory.connect(user).createTranche(spvId, configs)
      ).to.be.reverted;
    });

    it('Should only allow operator to distribute cashflow', async function () {
      const spvId = 1;
      const configs = [
        {
          name: 'Senior Tranche',
          symbol: 'SENIOR',
          priority: 0,
          targetYield: 500,
          allocation: 10000,
        },
      ];

      await trancheFactory.createTranche(spvId, configs);

      await expect(
        trancheFactory.connect(user).distributeCashflow(spvId, ethers.parseEther('100'))
      ).to.be.reverted;
    });
  });
});
