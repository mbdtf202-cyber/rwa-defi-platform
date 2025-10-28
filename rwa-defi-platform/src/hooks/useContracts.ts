import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// Contract addresses - should be loaded from environment
const CONTRACTS = {
  PermissionedToken: import.meta.env.VITE_PERMISSIONED_TOKEN_ADDRESS || '0x',
  Vault: import.meta.env.VITE_VAULT_ADDRESS || '0x',
  LendingPool: import.meta.env.VITE_LENDING_POOL_ADDRESS || '0x',
  PermissionedAMM: import.meta.env.VITE_AMM_ADDRESS || '0x',
  SPVRegistry: import.meta.env.VITE_SPV_REGISTRY_ADDRESS || '0x',
};

// Simplified ABIs - in production, import from typechain
const PERMISSIONED_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function isWhitelisted(address account) view returns (bool)',
] as const;

const VAULT_ABI = [
  'function deposit(uint256 amount) returns (uint256)',
  'function withdraw(uint256 shares) returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function totalAssets() view returns (uint256)',
  'function convertToAssets(uint256 shares) view returns (uint256)',
] as const;

const LENDING_POOL_ABI = [
  'function borrow(address token, uint256 amount, uint256 collateralAmount)',
  'function repay(address token, uint256 amount)',
  'function getHealthFactor(address user) view returns (uint256)',
  'function getUserDebt(address user, address token) view returns (uint256)',
] as const;

const AMM_ABI = [
  'function addLiquidity(uint256 amountA, uint256 amountB) returns (uint256)',
  'function removeLiquidity(uint256 liquidity) returns (uint256, uint256)',
  'function swap(address tokenIn, address tokenOut, uint256 amountIn) returns (uint256)',
  'function getReserves() view returns (uint256, uint256)',
] as const;

// Hook for token operations
export function usePermissionedToken(tokenAddress?: string) {
  const address = tokenAddress || CONTRACTS.PermissionedToken;
  const { address: userAddress } = useAccount();

  const { data: balance } = useReadContract({
    address: address as `0x${string}`,
    abi: PERMISSIONED_TOKEN_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
  });

  const { data: isWhitelisted } = useReadContract({
    address: address as `0x${string}`,
    abi: PERMISSIONED_TOKEN_ABI,
    functionName: 'isWhitelisted',
    args: userAddress ? [userAddress] : undefined,
  });

  const { writeContract: transfer, data: transferHash } = useWriteContract();
  const { writeContract: approve, data: approveHash } = useWriteContract();

  return {
    balance: balance ? formatEther(balance as bigint) : '0',
    isWhitelisted: isWhitelisted as boolean,
    transfer: (to: string, amount: string) =>
      transfer({
        address: address as `0x${string}`,
        abi: PERMISSIONED_TOKEN_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, parseEther(amount)],
      }),
    approve: (spender: string, amount: string) =>
      approve({
        address: address as `0x${string}`,
        abi: PERMISSIONED_TOKEN_ABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, parseEther(amount)],
      }),
    transferHash,
    approveHash,
  };
}

// Hook for Vault operations
export function useVault() {
  const { address: userAddress } = useAccount();

  const { data: shares } = useReadContract({
    address: CONTRACTS.Vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
  });

  const { data: totalAssets } = useReadContract({
    address: CONTRACTS.Vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
  });

  const { data: assetsValue } = useReadContract({
    address: CONTRACTS.Vault as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'convertToAssets',
    args: shares ? [shares as bigint] : undefined,
  });

  const { writeContract: deposit, data: depositHash } = useWriteContract();
  const { writeContract: withdraw, data: withdrawHash } = useWriteContract();

  return {
    shares: shares ? formatEther(shares as bigint) : '0',
    totalAssets: totalAssets ? formatEther(totalAssets as bigint) : '0',
    assetsValue: assetsValue ? formatEther(assetsValue as bigint) : '0',
    deposit: (amount: string) =>
      deposit({
        address: CONTRACTS.Vault as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [parseEther(amount)],
      }),
    withdraw: (shares: string) =>
      withdraw({
        address: CONTRACTS.Vault as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [parseEther(shares)],
      }),
    depositHash,
    withdrawHash,
  };
}

// Hook for Lending Pool operations
export function useLendingPool() {
  const { address: userAddress } = useAccount();

  const { data: healthFactor } = useReadContract({
    address: CONTRACTS.LendingPool as `0x${string}`,
    abi: LENDING_POOL_ABI,
    functionName: 'getHealthFactor',
    args: userAddress ? [userAddress] : undefined,
  });

  const { writeContract: borrow, data: borrowHash } = useWriteContract();
  const { writeContract: repay, data: repayHash } = useWriteContract();

  return {
    healthFactor: healthFactor ? Number(healthFactor) / 1e18 : 0,
    borrow: (token: string, amount: string, collateral: string) =>
      borrow({
        address: CONTRACTS.LendingPool as `0x${string}`,
        abi: LENDING_POOL_ABI,
        functionName: 'borrow',
        args: [token as `0x${string}`, parseEther(amount), parseEther(collateral)],
      }),
    repay: (token: string, amount: string) =>
      repay({
        address: CONTRACTS.LendingPool as `0x${string}`,
        abi: LENDING_POOL_ABI,
        functionName: 'repay',
        args: [token as `0x${string}`, parseEther(amount)],
      }),
    borrowHash,
    repayHash,
  };
}

// Hook for AMM operations
export function useAMM() {
  const { data: reserves } = useReadContract({
    address: CONTRACTS.PermissionedAMM as `0x${string}`,
    abi: AMM_ABI,
    functionName: 'getReserves',
  });

  const { writeContract: addLiquidity, data: addLiquidityHash } = useWriteContract();
  const { writeContract: removeLiquidity, data: removeLiquidityHash } = useWriteContract();
  const { writeContract: swap, data: swapHash } = useWriteContract();

  return {
    reserves: reserves
      ? {
          reserve0: formatEther((reserves as [bigint, bigint])[0]),
          reserve1: formatEther((reserves as [bigint, bigint])[1]),
        }
      : { reserve0: '0', reserve1: '0' },
    addLiquidity: (amountA: string, amountB: string) =>
      addLiquidity({
        address: CONTRACTS.PermissionedAMM as `0x${string}`,
        abi: AMM_ABI,
        functionName: 'addLiquidity',
        args: [parseEther(amountA), parseEther(amountB)],
      }),
    removeLiquidity: (liquidity: string) =>
      removeLiquidity({
        address: CONTRACTS.PermissionedAMM as `0x${string}`,
        abi: AMM_ABI,
        functionName: 'removeLiquidity',
        args: [parseEther(liquidity)],
      }),
    swap: (tokenIn: string, tokenOut: string, amountIn: string) =>
      swap({
        address: CONTRACTS.PermissionedAMM as `0x${string}`,
        abi: AMM_ABI,
        functionName: 'swap',
        args: [tokenIn as `0x${string}`, tokenOut as `0x${string}`, parseEther(amountIn)],
      }),
    addLiquidityHash,
    removeLiquidityHash,
    swapHash,
  };
}

// Hook for transaction status
export function useTransactionStatus(hash?: `0x${string}`) {
  const { data, isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    receipt: data,
    isLoading,
    isSuccess,
    isError,
  };
}
