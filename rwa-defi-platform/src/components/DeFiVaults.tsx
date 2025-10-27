import { motion } from 'framer-motion'
import { Vault, TrendingUp, Lock, Zap, Shield, ArrowUpRight } from 'lucide-react'

export default function DeFiVaults() {
  const vaults = [
    {
      id: 1,
      name: '稳健收益金库',
      strategy: 'Senior Tranche + Lending',
      tvl: 25000000,
      apy: 6.5,
      risk: 'low',
      lockPeriod: '无锁定',
      minInvest: 1000,
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 2,
      name: '平衡增长金库',
      strategy: 'Mixed Tranches + AMM LP',
      tvl: 18000000,
      apy: 9.8,
      risk: 'medium',
      lockPeriod: '30 天',
      minInvest: 5000,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 3,
      name: '高收益金库',
      strategy: 'Junior Tranche + Leverage',
      tvl: 12000000,
      apy: 15.2,
      risk: 'high',
      lockPeriod: '90 天',
      minInvest: 10000,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 4,
      name: 'AI 智能金库',
      strategy: 'AI-Driven Dynamic Allocation',
      tvl: 30000000,
      apy: 11.5,
      risk: 'medium',
      lockPeriod: '7 天',
      minInvest: 2500,
      color: 'from-orange-500 to-red-500',
    },
  ]

  const features = [
    {
      icon: Shield,
      title: '智能合约审计',
      description: '多轮安全审计保障',
    },
    {
      icon: Zap,
      title: '自动复投',
      description: '收益自动再投资',
    },
    {
      icon: Lock,
      title: '灵活锁定',
      description: '多种锁定期选择',
    },
  ]

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'low': return '低风险'
      case 'medium': return '中风险'
      case 'high': return '高风险'
      default: return '未知'
    }
  }

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-bold mb-4 gradient-text">DeFi 金库</h1>
          <p className="text-gray-400 text-lg">通过智能策略最大化您的资产收益</p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { label: '总锁仓价值', value: '$85M', icon: Vault },
            { label: '平均 APY', value: '10.75%', icon: TrendingUp },
            { label: '活跃金库', value: '12', icon: Zap },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                className="glass-card p-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Icon className="w-8 h-8 text-blue-400 mb-3" />
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Vaults Grid */}
        <motion.div
          className="grid lg:grid-cols-2 gap-6 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {vaults.map((vault, index) => (
            <motion.div
              key={vault.id}
              className="glass-card p-6 group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${vault.color} flex items-center justify-center`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Vault className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold group-hover:gradient-text transition-all">
                      {vault.name}
                    </h3>
                    <p className="text-gray-400 text-sm">{vault.strategy}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(vault.risk)} bg-white/10`}>
                  {getRiskLabel(vault.risk)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-gray-400 text-xs mb-1">TVL</div>
                  <div className="text-lg font-bold">${(vault.tvl / 1000000).toFixed(1)}M</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">APY</div>
                  <div className="text-lg font-bold text-green-400">{vault.apy}%</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">锁定期</div>
                  <div className="text-sm font-semibold">{vault.lockPeriod}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">最小投资</div>
                  <div className="text-sm font-semibold">${vault.minInvest.toLocaleString()}</div>
                </div>
              </div>

              <motion.button
                className="w-full btn-primary flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                存入资金
                <ArrowUpRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div
          className="glass-card p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-2xl font-bold mb-6">金库特性</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
