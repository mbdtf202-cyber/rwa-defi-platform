import { motion } from 'framer-motion'
import { Building2, Twitter, Github, Linkedin, Mail } from 'lucide-react'

export default function Footer() {
  const links = {
    product: [
      { label: '资产市场', href: '#' },
      { label: 'DeFi 金库', href: '#' },
      { label: 'AI 洞察', href: '#' },
      { label: '文档', href: '#' },
    ],
    company: [
      { label: '关于我们', href: '#' },
      { label: '团队', href: '#' },
      { label: '职业机会', href: '#' },
      { label: '博客', href: '#' },
    ],
    legal: [
      { label: '隐私政策', href: '#' },
      { label: '服务条款', href: '#' },
      { label: '合规声明', href: '#' },
      { label: 'KYC/AML', href: '#' },
    ],
  }

  const socials = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Github, href: '#', label: 'Github' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: '#', label: 'Email' },
  ]

  return (
    <footer className="border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          <div className="md:col-span-2">
            <motion.div
              className="flex items-center gap-3 mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold gradient-text">RWA DeFi</span>
            </motion.div>
            <p className="text-gray-400 text-sm mb-4">
              将真实物业资产与 DeFi 和 AI 技术结合，
              打造透明、高效、合规的资产金融化平台。
            </p>
            <div className="flex gap-3">
              {socials.map((social) => {
                const Icon = social.icon
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                )
              })}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">产品</h4>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.label}>
                  <motion.a
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    {link.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">公司</h4>
            <ul className="space-y-2">
              {links.company.map((link) => (
                <li key={link.label}>
                  <motion.a
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    {link.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">法律</h4>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <motion.a
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    {link.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 RWA DeFi Platform. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">
            Built with ❤️ using React, TypeScript & Framer Motion
          </p>
        </div>
      </div>
    </footer>
  )
}
