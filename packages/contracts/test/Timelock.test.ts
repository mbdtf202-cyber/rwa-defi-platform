import { expect } from "chai";
import { ethers } from "hardhat";
import { Timelock } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Timelock", function () {
  let timelock: Timelock;
  let admin: SignerWithAddress;
  let proposer: SignerWithAddress;
  let executor: SignerWithAddress;
  let user: SignerWithAddress;

  const DELAY = 2 * 24 * 60 * 60; // 2 days
  const PROPOSER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROPOSER_ROLE"));
  const EXECUTOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("EXECUTOR_ROLE"));
  const CANCELLER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CANCELLER_ROLE"));

  beforeEach(async function () {
    [admin, proposer, executor, user] = await ethers.getSigners();

    const TimelockFactory = await ethers.getContractFactory("Timelock");
    timelock = await TimelockFactory.deploy(
      DELAY,
      [proposer.address],
      [executor.address],
      admin.address
    );
    await timelock.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct delay", async function () {
      expect(await timelock.delay()).to.equal(DELAY);
    });

    it("Should grant roles correctly", async function () {
      expect(await timelock.hasRole(PROPOSER_ROLE, proposer.address)).to.be.true;
      expect(await timelock.hasRole(EXECUTOR_ROLE, executor.address)).to.be.true;
      expect(await timelock.hasRole(CANCELLER_ROLE, admin.address)).to.be.true;
    });
  });

  describe("Schedule Operation", function () {
    it("Should allow proposer to schedule an operation", async function () {
      const target = user.address;
      const value = 0;
      const data = "0x";
      const predecessor = ethers.constants.HashZero;
      const salt = ethers.utils.id("test");

      await expect(
        timelock.connect(proposer).schedule(target, value, data, predecessor, salt)
      ).to.emit(timelock, "OperationScheduled");
    });

    it("Should not allow non-proposer to schedule", async function () {
      const target = user.address;
      const value = 0;
      const data = "0x";
      const predecessor = ethers.constants.HashZero;
      const salt = ethers.utils.id("test");

      await expect(
        timelock.connect(user).schedule(target, value, data, predecessor, salt)
      ).to.be.reverted;
    });

    it("Should not allow scheduling duplicate operations", async function () {
      const target = user.address;
      const value = 0;
      const data = "0x";
      const predecessor = ethers.constants.HashZero;
      const salt = ethers.utils.id("test");

      await timelock.connect(proposer).schedule(target, value, data, predecessor, salt);

      await expect(
        timelock.connect(proposer).schedule(target, value, data, predecessor, salt)
      ).to.be.revertedWith("Timelock: operation already scheduled");
    });
  });

  describe("Execute Operation", function () {
    it("Should execute operation after delay", async function () {
      const target = user.address;
      const value = ethers.utils.parseEther("1");
      const data = "0x";
      const predecessor = ethers.constants.HashZero;
      const salt = ethers.utils.id("test");

      // Fund timelock
      await admin.sendTransaction({
        to: timelock.address,
        value: value,
      });

      // Schedule
      await timelock.connect(proposer).schedule(target, value, data, predecessor, salt);

      // Fast forward time
      await time.increase(DELAY + 1);

      // Execute
      const userBalanceBefore = await ethers.provider.getBalance(user.address);
      await timelock.connect(executor).execute(target, value, data, predecessor, salt);
      const userBalanceAfter = await ethers.provider.getBalance(user.address);

      expect(userBalanceAfter.sub(userBalanceBefore)).to.equal(value);
    });

    it("Should not execute before delay", async function () {
      const target = user.address;
      const value = 0;
      const data = "0x";
      const predecessor = ethers.constants.HashZero;
      const salt = ethers.utils.id("test");

      await timelock.connect(proposer).schedule(target, value, data, predecessor, salt);

      await expect(
        timelock.connect(executor).execute(target, value, data, predecessor, salt)
      ).to.be.revertedWith("Timelock: operation not ready");
    });

    it("Should not allow non-executor to execute", async function () {
      const target = user.address;
      const value = 0;
      const data = "0x";
      const predecessor = ethers.constants.HashZero;
      const salt = ethers.utils.id("test");

      await timelock.connect(proposer).schedule(target, value, data, predecessor, salt);
      await time.increase(DELAY + 1);

      await expect(
        timelock.connect(user).execute(target, value, data, predecessor, salt)
      ).to.be.reverted;
    });
  });

  describe("Cancel Operation", function () {
    it("Should allow canceller to cancel operation", async function () {
      const target = user.address;
      const value = 0;
      const data = "0x";
      const predecessor = ethers.constants.HashZero;
      const salt = ethers.utils.id("test");

      await timelock.connect(proposer).schedule(target, value, data, predecessor, salt);

      const id = await timelock.hashOperation(target, value, data, predecessor, salt);

      await expect(timelock.connect(admin).cancel(id))
        .to.emit(timelock, "OperationCancelled")
        .withArgs(id);
    });

    it("Should not execute cancelled operation", async function () {
      const target = user.address;
      const value = 0;
      const data = "0x";
      const predecessor = ethers.constants.HashZero;
      const salt = ethers.utils.id("test");

      await timelock.connect(proposer).schedule(target, value, data, predecessor, salt);

      const id = await timelock.hashOperation(target, value, data, predecessor, salt);
      await timelock.connect(admin).cancel(id);

      await time.increase(DELAY + 1);

      await expect(
        timelock.connect(executor).execute(target, value, data, predecessor, salt)
      ).to.be.revertedWith("Timelock: operation not pending");
    });
  });

  describe("Update Delay", function () {
    it("Should allow admin to update delay", async function () {
      const newDelay = 3 * 24 * 60 * 60; // 3 days

      await expect(timelock.connect(admin).updateDelay(newDelay))
        .to.emit(timelock, "DelayChanged")
        .withArgs(DELAY, newDelay);

      expect(await timelock.delay()).to.equal(newDelay);
    });

    it("Should not allow invalid delay", async function () {
      const tooShort = 12 * 60 * 60; // 12 hours
      const tooLong = 31 * 24 * 60 * 60; // 31 days

      await expect(timelock.connect(admin).updateDelay(tooShort)).to.be.revertedWith(
        "Timelock: invalid delay"
      );

      await expect(timelock.connect(admin).updateDelay(tooLong)).to.be.revertedWith(
        "Timelock: invalid delay"
      );
    });
  });

  describe("Helper Functions", function () {
    it("Should correctly check operation states", async function () {
      const target = user.address;
      const value = 0;
      const data = "0x";
      const predecessor = ethers.constants.HashZero;
      const salt = ethers.utils.id("test");

      const id = await timelock.hashOperation(target, value, data, predecessor, salt);

      expect(await timelock.isOperationPending(id)).to.be.false;
      expect(await timelock.isOperationReady(id)).to.be.false;

      await timelock.connect(proposer).schedule(target, value, data, predecessor, salt);

      expect(await timelock.isOperationPending(id)).to.be.true;
      expect(await timelock.isOperationReady(id)).to.be.false;

      await time.increase(DELAY + 1);

      expect(await timelock.isOperationReady(id)).to.be.true;

      await timelock.connect(executor).execute(target, value, data, predecessor, salt);

      expect(await timelock.isOperationExecuted(id)).to.be.true;
    });
  });
});
