import { expect } from "chai";
import { ethers } from "hardhat";
import { PermissionedAMM, PermissionedToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PermissionedAMM", function () {
    let amm: PermissionedAMM;
    let token0: PermissionedToken;
    let token1: PermissionedToken;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy tokens
        const Token = await ethers.getContractFactory("PermissionedToken");
        token0 = await Token.deploy();
        await token0.initialize("Token A", "TKA", 1, owner.address);
        token1 = await Token.deploy();
        await token1.initialize("Token B", "TKB", 2, owner.address);

        // Deploy AMM
        const AMM = await ethers.getContractFactory("PermissionedAMM");
        amm = await AMM.deploy();
        await amm.initialize(await token0.getAddress(), await token1.getAddress(), owner.address);

        // Mint tokens
        const MINTER_ROLE = await token0.MINTER_ROLE();
        await token0.grantRole(MINTER_ROLE, owner.address);
        await token1.grantRole(MINTER_ROLE, owner.address);

        await token0.mint(owner.address, ethers.parseEther("10000"));
        await token1.mint(owner.address, ethers.parseEther("10000"));
        await token0.mint(user1.address, ethers.parseEther("1000"));
        await token1.mint(user1.address, ethers.parseEther("1000"));
    });

    describe("Deployment", function () {
        it("Should set the correct tokens", async function () {
            expect(await amm.token0()).to.equal(await token0.getAddress());
            expect(await amm.token1()).to.equal(await token1.getAddress());
        });

        it("Should set the owner", async function () {
            expect(await amm.owner()).to.equal(owner.address);
        });
    });

    describe("Add Liquidity", function () {
        it("Should add initial liquidity", async function () {
            const amount0 = ethers.parseEther("100");
            const amount1 = ethers.parseEther("100");

            await token0.approve(await amm.getAddress(), amount0);
            await token1.approve(await amm.getAddress(), amount1);

            await expect(amm.addLiquidity(amount0, amount1, 0, 0))
                .to.emit(amm, "LiquidityAdded");

            const reserves = await amm.getReserves();
            expect(reserves[0]).to.equal(amount0);
            expect(reserves[1]).to.equal(amount1);
        });

        it("Should add liquidity proportionally", async function () {
            // Add initial liquidity
            await token0.approve(await amm.getAddress(), ethers.parseEther("100"));
            await token1.approve(await amm.getAddress(), ethers.parseEther("200"));
            await amm.addLiquidity(ethers.parseEther("100"), ethers.parseEther("200"), 0, 0);

            // Add more liquidity
            await token0.approve(await amm.getAddress(), ethers.parseEther("50"));
            await token1.approve(await amm.getAddress(), ethers.parseEther("100"));
            await amm.addLiquidity(ethers.parseEther("50"), ethers.parseEther("100"), 0, 0);

            const reserves = await amm.getReserves();
            expect(reserves[0]).to.equal(ethers.parseEther("150"));
            expect(reserves[1]).to.equal(ethers.parseEther("300"));
        });
    });

    describe("Remove Liquidity", function () {
        beforeEach(async function () {
            await token0.approve(await amm.getAddress(), ethers.parseEther("100"));
            await token1.approve(await amm.getAddress(), ethers.parseEther("100"));
            await amm.addLiquidity(ethers.parseEther("100"), ethers.parseEther("100"), 0, 0);
        });

        it("Should remove liquidity", async function () {
            const liquidity = await amm.balanceOf(owner.address);

            await expect(amm.removeLiquidity(liquidity / 2n, 0, 0))
                .to.emit(amm, "LiquidityRemoved");

            const reserves = await amm.getReserves();
            expect(reserves[0]).to.be.lt(ethers.parseEther("100"));
            expect(reserves[1]).to.be.lt(ethers.parseEther("100"));
        });
    });

    describe("Swap", function () {
        beforeEach(async function () {
            await token0.approve(await amm.getAddress(), ethers.parseEther("1000"));
            await token1.approve(await amm.getAddress(), ethers.parseEther("1000"));
            await amm.addLiquidity(ethers.parseEther("1000"), ethers.parseEther("1000"), 0, 0);
        });

        it("Should swap token0 for token1", async function () {
            const amountIn = ethers.parseEther("10");
            await token0.connect(user1).approve(await amm.getAddress(), amountIn);

            const balanceBefore = await token1.balanceOf(user1.address);

            await amm.connect(user1).swap(amountIn, 0, 0);

            const balanceAfter = await token1.balanceOf(user1.address);
            expect(balanceAfter).to.be.gt(balanceBefore);
        });

        it("Should swap token1 for token0", async function () {
            const amountIn = ethers.parseEther("10");
            await token1.connect(user1).approve(await amm.getAddress(), amountIn);

            const balanceBefore = await token0.balanceOf(user1.address);

            await amm.connect(user1).swap(0, amountIn, 0);

            const balanceAfter = await token0.balanceOf(user1.address);
            expect(balanceAfter).to.be.gt(balanceBefore);
        });

        it("Should respect slippage protection", async function () {
            const amountIn = ethers.parseEther("10");
            await token0.connect(user1).approve(await amm.getAddress(), amountIn);

            await expect(
                amm.connect(user1).swap(amountIn, 0, ethers.parseEther("100"))
            ).to.be.revertedWith("Insufficient output amount");
        });
    });

    describe("Price Calculation", function () {
        beforeEach(async function () {
            await token0.approve(await amm.getAddress(), ethers.parseEther("1000"));
            await token1.approve(await amm.getAddress(), ethers.parseEther("2000"));
            await amm.addLiquidity(ethers.parseEther("1000"), ethers.parseEther("2000"), 0, 0);
        });

        it("Should calculate correct price", async function () {
            const price = await amm.getPrice();
            expect(price).to.be.gt(0);
        });

        it("Should calculate swap output", async function () {
            const amountIn = ethers.parseEther("10");
            const amountOut = await amm.getAmountOut(amountIn, true);
            expect(amountOut).to.be.gt(0);
        });
    });

    describe("Access Control", function () {
        it("Should allow owner to pause", async function () {
            await amm.pause();
            expect(await amm.paused()).to.be.true;
        });

        it("Should not allow non-owner to pause", async function () {
            await expect(amm.connect(user1).pause()).to.be.reverted;
        });

        it("Should not allow swaps when paused", async function () {
            await token0.approve(await amm.getAddress(), ethers.parseEther("1000"));
            await token1.approve(await amm.getAddress(), ethers.parseEther("1000"));
            await amm.addLiquidity(ethers.parseEther("1000"), ethers.parseEther("1000"), 0, 0);

            await amm.pause();

            await token0.connect(user1).approve(await amm.getAddress(), ethers.parseEther("10"));
            await expect(
                amm.connect(user1).swap(ethers.parseEther("10"), 0, 0)
            ).to.be.revertedWith("Pausable: paused");
        });
    });
});
