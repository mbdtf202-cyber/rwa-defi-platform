import { useState } from 'react';
import { Droplets, ArrowDownUp, TrendingUp, Info } from 'lucide-react';
import { useAMM, usePermissionedToken, useTransactionStatus } from '../hooks/useContracts';
import { useAppStore } from '../store/useAppStore';

export default function LiquidityPool() {
  const [activeTab, setActiveTab] = useState<'add' | 'remove' | 'swap'>('add');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [swapAmountIn, setSwapAmountIn] = useState('');
  const [tokenIn, setTokenIn] = useState('USDC');
  const [tokenOut, setTokenOut] = useState('RWA');

  const { reserves, addLiquidity, removeLiquidity, swap, addLiquidityHash, removeLiquidityHash, swapHash } = useAMM();
  const { balance, approve } = usePermissionedToken();
  const { addNotification } = useAppStore();

  const { isSuccess: addSuccess } = useTransactionStatus(addLiquidityHash);
  const { isSuccess: removeSuccess } = useTransactionStatus(removeLiquidityHash);
  const { isSuccess: swapSuccess } = useTransactionStatus(swapHash);

  const handleAddLiquidity = async () => {
    if (!amountA || !amountB) {
      addNotification('error', 'Please enter both amounts');
      return;
    }

    try {
      // Approve both tokens
      await approve(import.meta.env.VITE_AMM_ADDRESS, amountA);
      await approve(import.meta.env.VITE_AMM_ADDRESS, amountB);
      
      // Add liquidity
      await addLiquidity(amountA, amountB);
      
      addNotification('success', 'Liquidity added successfully');
    } catch (error) {
      addNotification('error', 'Failed to add liquidity: ' + (error as Error).message);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!liquidityAmount) {
      addNotification('error', 'Please enter liquidity amount');
      return;
    }

    try {
      await removeLiquidity(liquidityAmount);
      addNotification('success', 'Liquidity removed successfully');
    } catch (error) {
      addNotification('error', 'Failed to remove liquidity: ' + (error as Error).message);
    }
  };

  const handleSwap = async () => {
    if (!swapAmountIn) {
      addNotification('error', 'Please enter swap amount');
      return;
    }

    try {
      await approve(import.meta.env.VITE_AMM_ADDRESS, swapAmountIn);
      await swap(
        tokenIn === 'USDC' ? import.meta.env.VITE_USDC_ADDRESS : import.meta.env.VITE_RWA_TOKEN_ADDRESS,
        tokenOut === 'USDC' ? import.meta.env.VITE_USDC_ADDRESS : import.meta.env.VITE_RWA_TOKEN_ADDRESS,
        swapAmountIn
      );
      
      addNotification('success', 'Swap executed successfully');
    } catch (error) {
      addNotification('error', 'Failed to swap: ' + (error as Error).message);
    }
  };

  const calculatePriceImpact = (amountIn: string) => {
    if (!amountIn || !reserves.reserve0 || !reserves.reserve1) return 0;
    const impact = (parseFloat(amountIn) / parseFloat(reserves.reserve0)) * 100;
    return Math.min(impact, 100);
  };

  const estimateOutput = (amountIn: string) => {
    if (!amountIn || !reserves.reserve0 || !reserves.reserve1) return '0';
    const amountInNum = parseFloat(amountIn);
    const reserve0 = parseFloat(reserves.reserve0);
    const reserve1 = parseFloat(reserves.reserve1);
    
    // Constant product formula: x * y = k
    const amountOut = (amountInNum * reserve1 * 0.997) / (reserve0 + amountInNum * 0.997);
    return amountOut.toFixed(6);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20 px-4">
      <div className="max-w-7xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Liquidity Pools</h1>
          <p className="text-xl text-gray-300">
            Provide liquidity and earn trading fees
          </p>
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Droplets className="text-blue-400" size={24} />
              <span className="text-gray-300">Total Liquidity</span>
            </div>
            <p className="text-3xl font-bold text-white">
              ${(parseFloat(reserves.reserve0) + parseFloat(reserves.reserve1)).toFixed(2)}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-green-400" size={24} />
              <span className="text-gray-300">24h Volume</span>
            </div>
            <p className="text-3xl font-bold text-white">$1,234,567</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Info className="text-purple-400" size={24} />
              <span className="text-gray-300">APY</span>
            </div>
            <p className="text-3xl font-bold text-white">12.5%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              {/* Tabs */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => setActiveTab('add')}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                    activeTab === 'add'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Droplets className="inline mr-2" size={20} />
                  Add Liquidity
                </button>
                <button
                  onClick={() => setActiveTab('remove')}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                    activeTab === 'remove'
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Remove
                </button>
                <button
                  onClick={() => setActiveTab('swap')}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                    activeTab === 'swap'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <ArrowDownUp className="inline mr-2" size={20} />
                  Swap
                </button>
              </div>

              {/* Add Liquidity */}
              {activeTab === 'add' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-300 mb-2">USDC Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amountA}
                        onChange={(e) => setAmountA(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-lg"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        💵 USDC
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Balance: {balance}</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="bg-white/10 rounded-full p-2">
                      <Droplets className="text-blue-400" size={24} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">RWA Token Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amountB}
                        onChange={(e) => setAmountB(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-lg"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        🏠 RWA
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current Price</span>
                      <span className="text-white font-semibold">
                        1 RWA = {reserves.reserve0 && reserves.reserve1 
                          ? (parseFloat(reserves.reserve0) / parseFloat(reserves.reserve1)).toFixed(4)
                          : '0'} USDC
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Pool Share</span>
                      <span className="text-white font-semibold">0.05%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">LP Tokens</span>
                      <span className="text-white font-semibold">
                        {amountA && amountB ? Math.sqrt(parseFloat(amountA) * parseFloat(amountB)).toFixed(4) : '0'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleAddLiquidity}
                    disabled={!amountA || !amountB}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Liquidity
                  </button>
                </div>
              )}

              {/* Remove Liquidity */}
              {activeTab === 'remove' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-300 mb-2">LP Token Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={liquidityAmount}
                        onChange={(e) => setLiquidityAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-lg"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 font-semibold">
                        MAX
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Your LP Tokens: 0.00</p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 space-y-3">
                    <p className="text-gray-300 font-semibold">You will receive:</p>
                    <div className="flex justify-between">
                      <span className="text-gray-400">USDC</span>
                      <span className="text-white font-semibold">0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">RWA Tokens</span>
                      <span className="text-white font-semibold">0.00</span>
                    </div>
                  </div>

                  <button
                    onClick={handleRemoveLiquidity}
                    disabled={!liquidityAmount}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove Liquidity
                  </button>
                </div>
              )}

              {/* Swap */}
              {activeTab === 'swap' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-300 mb-2">From</label>
                    <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                      <div className="flex justify-between mb-2">
                        <input
                          type="number"
                          value={swapAmountIn}
                          onChange={(e) => setSwapAmountIn(e.target.value)}
                          placeholder="0.00"
                          className="bg-transparent text-white text-2xl outline-none w-full"
                        />
                        <select
                          value={tokenIn}
                          onChange={(e) => setTokenIn(e.target.value)}
                          className="bg-white/10 text-white rounded-lg px-3 py-1"
                        >
                          <option value="USDC">💵 USDC</option>
                          <option value="RWA">🏠 RWA</option>
                        </select>
                      </div>
                      <p className="text-sm text-gray-400">Balance: {balance}</p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button className="bg-white/10 rounded-full p-3 hover:bg-white/20 transition-all">
                      <ArrowDownUp className="text-blue-400" size={24} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">To (estimated)</label>
                    <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                      <div className="flex justify-between mb-2">
                        <input
                          type="text"
                          value={estimateOutput(swapAmountIn)}
                          readOnly
                          placeholder="0.00"
                          className="bg-transparent text-white text-2xl outline-none w-full"
                        />
                        <select
                          value={tokenOut}
                          onChange={(e) => setTokenOut(e.target.value)}
                          className="bg-white/10 text-white rounded-lg px-3 py-1"
                        >
                          <option value="USDC">💵 USDC</option>
                          <option value="RWA">🏠 RWA</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Price Impact</span>
                      <span className={`font-semibold ${
                        calculatePriceImpact(swapAmountIn) > 5 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {calculatePriceImpact(swapAmountIn).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Trading Fee</span>
                      <span className="text-white font-semibold">0.3%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Minimum Received</span>
                      <span className="text-white font-semibold">
                        {(parseFloat(estimateOutput(swapAmountIn)) * 0.995).toFixed(6)}
                      </span>
                    </div>
                  </div>

                  {calculatePriceImpact(swapAmountIn) > 5 && (
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
                      <p className="text-yellow-200 text-sm">
                        ⚠️ High price impact! Consider splitting your trade into smaller amounts.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleSwap}
                    disabled={!swapAmountIn}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Swap
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Pool Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Pool Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">USDC Reserve</span>
                  <span className="text-white font-semibold">{reserves.reserve0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">RWA Reserve</span>
                  <span className="text-white font-semibold">{reserves.reserve1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trading Fee</span>
                  <span className="text-white font-semibold">0.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Share</span>
                  <span className="text-white font-semibold">0.00%</span>
                </div>
              </div>
            </div>

            {/* Your Position */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Your Position</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">LP Tokens</span>
                  <span className="text-white font-semibold">0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pooled USDC</span>
                  <span className="text-white font-semibold">0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pooled RWA</span>
                  <span className="text-white font-semibold">0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fees Earned</span>
                  <span className="text-green-400 font-semibold">$0.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
