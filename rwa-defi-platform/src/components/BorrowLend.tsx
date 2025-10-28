import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { useLendingPool, usePermissionedToken, useTransactionStatus } from '../hooks/useContracts';
import { useAppStore } from '../store/useAppStore';

export default function BorrowLend() {
  const [activeTab, setActiveTab] = useState<'borrow' | 'repay'>('borrow');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('USDC');

  const { healthFactor, borrow, repay, borrowHash, repayHash } = useLendingPool();
  const { balance, approve } = usePermissionedToken();
  const { addNotification } = useAppStore();

  const { isSuccess: borrowSuccess, isError: borrowError } = useTransactionStatus(borrowHash);
  const { isSuccess: repaySuccess, isError: repayError } = useTransactionStatus(repayHash);

  // Mock data for available tokens
  const tokens = [
    { symbol: 'USDC', apy: 5.2, available: '1,250,000', icon: '💵' },
    { symbol: 'USDT', apy: 4.8, available: '980,000', icon: '💵' },
    { symbol: 'DAI', apy: 5.5, available: '750,000', icon: '💵' },
  ];

  const handleBorrow = async () => {
    if (!borrowAmount || !collateralAmount) {
      addNotification('error', 'Please enter both borrow and collateral amounts');
      return;
    }

    try {
      // First approve collateral
      await approve(import.meta.env.VITE_LENDING_POOL_ADDRESS, collateralAmount);
      
      // Then borrow
      await borrow(
        import.meta.env.VITE_USDC_ADDRESS || '0x',
        borrowAmount,
        collateralAmount
      );
      
      addNotification('success', 'Borrow transaction submitted');
    } catch (error) {
      addNotification('error', 'Failed to borrow: ' + (error as Error).message);
    }
  };

  const handleRepay = async () {{
      addNotification('error', 'Please enter repay amount');
      return;
    }

    try {
      // First approve repayment token
      await approve(import.meta.env.VITE_LENDING_POOL_ADDRESS, repayAmount);
      
      // Then repay
      await repay(import.meta.env.VITE_USDC_ADDRESS || '0x', repayAmount);
      
      addNotification('success', 'Repayment transaction submitted');
    } catch (error) {
      addNotification('error', 'Failed to repay: ' + (error as Error).message);
    }
  };

  const getHealthFactorColor = (hf: number) => {
    if (hf >= 2) return 'text-green-500';
    if (hf >= 1.5) return 'text-yellow-500';
    if (hf >= 1.2) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthFactorStatus = (hf: number) => {
    if (hf >= 2) return 'Healthy';
    if (hf >= 1.5) return 'Good';
    if (hf >= 1.2) return 'Caution';
    return 'At Risk';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20 px-4">
      <div className="max-w-7xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Borrow & Lend</h1>
          <p className="text-xl text-gray-300">
            Collateralized lending with real-world assets
          </p>
        </div>

        {/* Health Factor Display */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 mb-2">Health Factor</p>
              <p className={`text-4xl font-bold ${getHealthFactorColor(healthFactor)}`}>
                {healthFactor.toFixed(2)}
              </p>
              <p className="text-sm text-gray-400 mt-1">{getHealthFactorStatus(healthFactor)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-300 mb-2">Your Balance</p>
              <p className="text-2xl font-bold text-white">${balance}</p>
              <p className="text-sm text-gray-400 mt-1">Available to borrow</p>
            </div>
          </div>
          
          {healthFactor < 1.5 && (
            <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-yellow-200 font-semibold">Warning</p>
                <p className="text-yellow-100 text-sm">
                  Your health factor is low. Consider adding more collateral or repaying debt to avoid liquidation.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Borrow/Repay Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              {/* Tabs */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => setActiveTab('borrow')}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                    activeTab === 'borrow'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <TrendingDown className="inline mr-2" size={20} />
                  Borrow
                </button>
                <button
                  onClick={() => setActiveTab('repay')}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                    activeTab === 'repay'
                      ? 'bg-green-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <TrendingUp className="inline mr-2" size={20} />
                  Repay
                </button>
              </div>

              {activeTab === 'borrow' ? (
                <div className="space-y-6">
                  {/* Token Selection */}
                  <div>
                    <label className="block text-gray-300 mb-2">Select Token</label>
                    <select
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white"
                    >
                      {tokens.map((token) => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.icon} {token.symbol} - {token.apy}% APY
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Borrow Amount */}
                  <div>
                    <label className="block text-gray-300 mb-2">Borrow Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={borrowAmount}
                        onChange={(e) => setBorrowAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-lg"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 font-semibold">
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Collateral Amount */}
                  <div>
                    <label className="block text-gray-300 mb-2">Collateral Amount (RWA Tokens)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-lg"
                      />
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      Recommended: {borrowAmount ? (parseFloat(borrowAmount) * 1.5).toFixed(2) : '0.00'} tokens
                      (150% collateralization)
                    </p>
                  </div>

                  {/* Borrow Stats */}
                  <div className="bg-white/5 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Borrow APY</span>
                      <span className="text-white font-semibold">
                        {tokens.find((t) => t.symbol === selectedToken)?.apy}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Collateralization Ratio</span>
                      <span className="text-white font-semibold">
                        {borrowAmount && collateralAmount
                          ? ((parseFloat(collateralAmount) / parseFloat(borrowAmount)) * 100).toFixed(0)
                          : '0'}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Liquidation Price</span>
                      <span className="text-white font-semibold">
                        ${borrowAmount && collateralAmount
                          ? (parseFloat(borrowAmount) / parseFloat(collateralAmount) / 0.8).toFixed(2)
                          : '0.00'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleBorrow}
                    disabled={!borrowAmount || !collateralAmount}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Borrow {selectedToken}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Repay Amount */}
                  <div>
                    <label className="block text-gray-300 mb-2">Repay Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-lg"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 font-semibold">
                        MAX
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">Outstanding debt: $0.00</p>
                  </div>

                  {/* Repay Stats */}
                  <div className="bg-white/5 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current Debt</span>
                      <span className="text-white font-semibold">$0.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Accrued Interest</span>
                      <span className="text-white font-semibold">$0.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">After Repayment</span>
                      <span className="text-green-400 font-semibold">
                        ${repayAmount ? Math.max(0, 0 - parseFloat(repayAmount)).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleRepay}
                    disabled={!repayAmount}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Repay Loan
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Available Markets */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Available Markets</h3>
              <div className="space-y-4">
                {tokens.map((token) => (
                  <div
                    key={token.symbol}
                    className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{token.icon}</span>
                        <span className="font-semibold text-white">{token.symbol}</span>
                      </div>
                      <span className="text-green-400 font-semibold">{token.apy}%</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Available: ${token.available}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Status */}
            {(borrowSuccess || repaySuccess || borrowError || repayError) && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Transaction Status</h3>
                {(borrowSuccess || repaySuccess) && (
                  <div className="flex items-center gap-3 text-green-400">
                    <CheckCircle size={24} />
                    <span>Transaction successful!</span>
                  </div>
                )}
                {(borrowError || repayError) && (
                  <div className="flex items-center gap-3 text-red-400">
                    <AlertCircle size={24} />
                    <span>Transaction failed</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
