import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, Coins, FileText, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { label: 'Total Users', value: '1,234', change: '+12%', icon: Users },
    { label: 'Active SPVs', value: '45', change: '+5%', icon: Building2 },
    { label: 'Total TVL', value: '$125M', change: '+18%', icon: Coins },
    { label: 'Pending KYC', value: '23', change: '-8%', icon: FileText },
  ];

  const recentActivities = [
    { type: 'KYC', user: 'user@example.com', status: 'Approved', time: '2 mins ago' },
    { type: 'SPV', user: 'admin@example.com', status: 'Created', time: '15 mins ago' },
    { type: 'Token', user: 'investor@example.com', status: 'Minted', time: '1 hour ago' },
    { type: 'Payment', user: 'user2@example.com', status: 'Completed', time: '2 hours ago' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4">
      <div className="max-w-7xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage platform operations and monitor activities</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-8 h-8 text-purple-400" />
                <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 overflow-x-auto">
          {['overview', 'users', 'spvs', 'kyc', 'tokens'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Recent Activities</h2>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{activity.type[0]}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{activity.type} - {activity.status}</p>
                        <p className="text-gray-400 text-sm">{activity.user}</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
              <p className="text-gray-400">User management interface coming soon...</p>
            </div>
          )}

          {activeTab === 'spvs' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">SPV Management</h2>
              <p className="text-gray-400">SPV management interface coming soon...</p>
            </div>
          )}

          {activeTab === 'kyc' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">KYC Verification</h2>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-500 font-medium">23 Pending Verifications</p>
                  <p className="text-gray-400 text-sm mt-1">Review and approve pending KYC submissions</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tokens' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Token Management</h2>
              <p className="text-gray-400">Token management interface coming soon...</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
