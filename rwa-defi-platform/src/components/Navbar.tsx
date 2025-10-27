import { motion } from 'framer-motion'
import { Building2, Wallet, TrendingUp, Brain, LayoutDashboard } from 'lucide-react'

type Page = 'home' | 'dashboard' | 'market' | 'vaults' | 'ai'

interface NavbarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const navItems = [
    { id: 'home' as Page, label: '首页', icon: Building2 },
    { id: 'dashboard' as Page, label: '仪表盘', icon: LayoutDashboard },
    { id: 'market' as Page, label: '资产市场', icon: TrendingUp },
    { id: 'vaults' as Page, label: 'DeFi 金库', icon: Wallet },
    { id: 'ai' as Page, label: 'AI 洞察', icon: Brain },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold gradient-text">RWA DeFi</span>
        </motion.div>

        <div className="flex gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </motion.button>
            )
          })}
        </div>

        <motion.button
          className="btn-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          连接钱包
        </motion.button>
      </div>
    </motion.nav>
  )
}
