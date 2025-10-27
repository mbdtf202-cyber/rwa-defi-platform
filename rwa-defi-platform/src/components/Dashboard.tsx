import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, PieChart, Activity } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const portfolioData = [
    { month: '1月', value: 45000, nav: 1.02 },
    { month: '2月', value: 52000, nav: 1.05 },
    { month: '3月', value: 48000, nav: 1.03 },
    { month: '4月', value: 61000, nav: 1.08 },
    { month: '5月', value: 68000, nav: 1.12 },
    { month: '6月', value: 75000, nav: 1.15 },
  ]

  const holdings = [
    { name: '曼哈顿商业综合体 A', value: 25000, apy: 8.5, allocation: 33 },
    { name: '硅谷科技园区 B', value: 30000, apy: 9.2, allocation: 40 },
    { name: '迈阿密住宅项目 C', value: 20000, apy: 7.8, allocation: 27 },
  ]

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          className="text-5xl font-bold mb-12 gradient-text"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          投资仪表盘
        </motion.h1>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: DollarSign, label: '总投资额', value: '$75,000', change: '+12.5%', color: 'from-blue-500 to-cyan-500' },
            { icon: TrendingUp, label: '总收益', value: '$8,250', change: '+23.1%', color: 'from-green-500 to-emerald-500' },
            { icon: PieChart, label: '平均 APY', value: '8.5%', change: '+0.8%', color: 'from-purple-500 to-pink-500' },
            { icon: Activity, label: 'NAV 倍数', value: '1.15x', change: '+15%', color: 'from-orange-500 to-red-500' },
          ].map((card, index) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.label}
                className="glass-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-green-400 text-sm font-semibold">{card.change}</span>
                </div>
                <div className="text-3xl font-bold mb-1">{card.value}</div>
                <div className="text-gray-400 text-sm">{card.label}</div>
              </motion.div>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xl font-bold mb-6">投资组合价值趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={portfolioData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-xl font-bold mb-6">NAV 倍数变化</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="nav" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Holdings Table */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-bold mb-6">持仓明细</h3>
          <div className="space-y-4">
            {holdings.map((holding, index) => (
              <motion.div
                key={holding.name}
                className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.02, x: 10 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-lg">{holding.name}</div>
                    <div className="text-gray-400 text-sm">投资额: ${holding.value.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">{holding.apy}% APY</div>
                    <div className="text-gray-400 text-sm">{holding.allocation}% 占比</div>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${holding.allocation}%` }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.8 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
