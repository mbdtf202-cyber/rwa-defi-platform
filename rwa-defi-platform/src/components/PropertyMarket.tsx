import { motion } from 'framer-motion'
import { MapPin, TrendingUp, Users, Shield, ExternalLink } from 'lucide-react'
import { useState } from 'react'

export default function PropertyMarket() {
  const [filter, setFilter] = useState<'all' | 'commercial' | 'residential'>('all')

  const properties = [
    {
      id: 1,
      name: '曼哈顿商业综合体 A',
      location: '纽约, 美国',
      type: 'commercial',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      price: 5000000,
      apy: 8.5,
      investors: 234,
      nav: 1.15,
      status: 'active',
      occupancy: 95,
    },
    {
      id: 2,
      name: '硅谷科技园区 B',
      location: '加州, 美国',
      type: 'commercial',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      price: 8000000,
      apy: 9.2,
      investors: 456,
      nav: 1.22,
      status: 'active',
      occupancy: 98,
    },
    {
      id: 3,
      name: '迈阿密住宅项目 C',
      location: '佛罗里达, 美国',
      type: 'residential',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      price: 3500000,
      apy: 7.8,
      investors: 189,
      nav: 1.08,
      status: 'active',
      occupancy: 92,
    },
    {
      id: 4,
      name: '伦敦金融区办公楼',
      location: '伦敦, 英国',
      type: 'commercial',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      price: 12000000,
      apy: 8.9,
      investors: 678,
      nav: 1.18,
      status: 'active',
      occupancy: 96,
    },
    {
      id: 5,
      name: '东京高端公寓',
      location: '东京, 日本',
      type: 'residential',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
      price: 6500000,
      apy: 7.5,
      investors: 312,
      nav: 1.12,
      status: 'active',
      occupancy: 94,
    },
    {
      id: 6,
      name: '新加坡商业中心',
      location: '新加坡',
      type: 'commercial',
      image: 'https://images.unsplash.com/photo-1525268771113-32d9e9021a97?w=800',
      price: 9500000,
      apy: 9.5,
      investors: 523,
      nav: 1.25,
      status: 'active',
      occupancy: 99,
    },
  ]

  const filteredProperties = properties.filter(
    p => filter === 'all' || p.type === filter
  )

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-bold mb-4 gradient-text">资产市场</h1>
          <p className="text-gray-400 text-lg">探索全球优质物业资产投资机会</p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          className="flex gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { id: 'all', label: '全部资产' },
            { id: 'commercial', label: '商业地产' },
            { id: 'residential', label: '住宅项目' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Properties Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          {filteredProperties.map((property, index) => (
            <motion.div
              key={property.id}
              className="glass-card overflow-hidden group cursor-pointer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              layout
            >
              <div className="relative h-48 overflow-hidden">
                <motion.img
                  src={property.image}
                  alt={property.name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                />
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {property.apy}% APY
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 group-hover:gradient-text transition-all">
                  {property.name}
                </h3>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <MapPin className="w-4 h-4" />
                  {property.location}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">总价值</div>
                    <div className="font-semibold">${(property.price / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">NAV 倍数</div>
                    <div className="font-semibold text-green-400">{property.nav}x</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">投资者</div>
                    <div className="font-semibold flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {property.investors}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">入住率</div>
                    <div className="font-semibold">{property.occupancy}%</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <TrendingUp className="w-4 h-4" />
                    投资
                  </motion.button>
                  <motion.button
                    className="btn-secondary flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>已通过 KYC/AML 合规审核</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
