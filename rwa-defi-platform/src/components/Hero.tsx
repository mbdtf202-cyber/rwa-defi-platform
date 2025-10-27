import { motion } from 'framer-motion'
import { ArrowRight, Shield, Zap, Globe, TrendingUp } from 'lucide-react'

interface HeroProps {
  onNavigate: (page: 'dashboard' | 'market') => void
}

export default function Hero({ onNavigate }: HeroProps) {
  const features = [
    {
      icon: Shield,
      title: '合规优先',
      description: '权限性代币，KYC/AML 全流程监管',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'DeFi 赋能',
      description: '流动性池、借贷、分层证券化',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Globe,
      title: '真实资产',
      description: 'SPV 结构，链上透明 NAV',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      title: 'AI 驱动',
      description: '智能估值、风控、预测维护',
      color: 'from-orange-500 to-red-500'
    }
  ]

  const stats = [
    { label: '总资产价值', value: '$150M+', change: '+23%' },
    { label: '活跃投资者', value: '2,500+', change: '+45%' },
    { label: '物业数量', value: '50+', change: '+12%' },
    { label: '年化收益', value: '8.5%', change: '+2.1%' }
  ]

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="gradient-text">真实资产</span>
            <br />
            <span className="text-white">遇见 DeFi 未来</span>
          </motion.h1>
          
          <motion.p
            className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            将物业资产通过合规 SPV 上链，结合 DeFi 流动性与 AI 智能风控，
            打造下一代资产金融化平台
          </motion.p>

          <motion.div
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button
              className="btn-primary flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('dashboard')}
            >
              开始投资
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('market')}
            >
              浏览资产
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="glass-card p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="text-3xl font-bold gradient-text mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
              <div className="text-green-400 text-xs">{stat.change}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                className="glass-card p-6 group cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
              >
                <motion.div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2 group-hover:gradient-text transition-all">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
