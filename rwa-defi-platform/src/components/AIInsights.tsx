import { motion } from 'framer-motion'
import { Brain, TrendingUp, AlertTriangle, Target, Sparkles, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

export default function AIInsights() {
  const valuationData = [
    { month: '1月', predicted: 1.02, actual: 1.01 },
    { month: '2月', predicted: 1.05, actual: 1.05 },
    { month: '3月', predicted: 1.08, actual: 1.07 },
    { month: '4月', predicted: 1.12, actual: 1.11 },
    { month: '5月', predicted: 1.15, actual: 1.14 },
    { month: '6月', predicted: 1.18, actual: 1.17 },
  ]

  const riskScores = [
    { category: '市场风险', score: 65 },
    { category: '流动性', score: 85 },
    { category: '信用质量', score: 90 },
    { category: '运营风险', score: 75 },
    { category: '合规性', score: 95 },
  ]

  const predictions = [
    {
      title: '曼哈顿商业综合体 A',
      prediction: '未来 6 个月 NAV 预计增长 8.5%',
      confidence: 92,
      trend: 'up',
      factors: ['租金上涨', '入住率提升', '周边发展'],
    },
    {
      title: '硅谷科技园区 B',
      prediction: '建议增加维护预算 15%',
      confidence: 87,
      trend: 'warning',
      factors: ['设备老化', '预防性维护', '成本优化'],
    },
    {
      title: '迈阿密住宅项目 C',
      prediction: '最佳退出时机：12-18 个月',
      confidence: 78,
      trend: 'neutral',
      factors: ['市场周期', '利率环境', '需求预测'],
    },
  ]

  const aiFeatures = [
    {
      icon: Target,
      title: '智能估值',
      description: '基于 ML 模型的实时 NAV 预测',
      accuracy: '95.2%',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Activity,
      title: '风险监控',
      description: '24/7 实时风险评估与预警',
      accuracy: '98.7%',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Sparkles,
      title: '预测维护',
      description: 'IoT + CV 驱动的设备监控',
      accuracy: '91.5%',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: TrendingUp,
      title: '智能做市',
      description: '强化学习优化流动性策略',
      accuracy: '89.3%',
      color: 'from-orange-500 to-red-500',
    },
  ]

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-6 h-6 text-white" />
            </motion.div>
            <h1 className="text-5xl font-bold gradient-text">AI 智能洞察</h1>
          </div>
          <p className="text-gray-400 text-lg">人工智能驱动的资产分析与预测</p>
        </motion.div>

        {/* AI Features Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {aiFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                className="glass-card p-6 group cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
              >
                <motion.div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-lg font-bold mb-2 group-hover:gradient-text transition-all">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm mb-3">{feature.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <motion.div
                      className={`bg-gradient-to-r ${feature.color} h-2 rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: feature.accuracy }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-green-400">{feature.accuracy}</span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              AI 估值预测 vs 实际
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={valuationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} name="AI 预测" />
                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="实际值" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-400">
              预测准确率: <span className="text-green-400 font-semibold">95.2%</span>
            </div>
          </motion.div>

          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              综合风险评分
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={riskScores}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="category" stroke="#9ca3af" />
                <PolarRadiusAxis stroke="#9ca3af" />
                <Radar name="风险评分" dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-400">
              整体风险等级: <span className="text-green-400 font-semibold">低风险</span>
            </div>
          </motion.div>
        </div>

        {/* AI Predictions */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            AI 智能建议
          </h3>
          <div className="space-y-4">
            {predictions.map((pred, index) => (
              <motion.div
                key={pred.title}
                className="bg-white/5 rounded-xl p-5 hover:bg-white/10 transition-all"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.02, x: 10 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">{pred.title}</h4>
                    <p className="text-gray-300 mb-3">{pred.prediction}</p>
                    <div className="flex flex-wrap gap-2">
                      {pred.factors.map((factor) => (
                        <span
                          key={factor}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      pred.trend === 'up' ? 'bg-green-500/20' :
                      pred.trend === 'warning' ? 'bg-yellow-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      {pred.trend === 'up' ? (
                        <TrendingUp className="w-8 h-8 text-green-400" />
                      ) : pred.trend === 'warning' ? (
                        <AlertTriangle className="w-8 h-8 text-yellow-400" />
                      ) : (
                        <Activity className="w-8 h-8 text-blue-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      置信度: <span className="text-white font-semibold">{pred.confidence}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
