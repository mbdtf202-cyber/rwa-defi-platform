import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Web3Provider } from './providers/Web3Provider'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Dashboard from './components/Dashboard'
import PropertyMarket from './components/PropertyMarket'
import DeFiVaults from './components/DeFiVaults'
import AIInsights from './components/AIInsights'
import BorrowLend from './components/BorrowLend'
import LiquidityPool from './components/LiquidityPool'
import Footer from './components/Footer'

type Page = 'home' | 'dashboard' | 'market' | 'vaults' | 'ai' | 'borrow' | 'liquidity'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  return (
    <Web3Provider>
      <div className="min-h-screen">
        <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
        
        <AnimatePresence mode="wait">
          <motion.main
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentPage === 'home' && <Hero onNavigate={setCurrentPage} />}
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'market' && <PropertyMarket />}
            {currentPage === 'vaults' && <DeFiVaults />}
            {currentPage === 'ai' && <AIInsights />}
            {currentPage === 'borrow' && <BorrowLend />}
            {currentPage === 'liquidity' && <LiquidityPool />}
          </motion.main>
        </AnimatePresence>

        <Footer />
      </div>
    </Web3Provider>
  )
}

export default App
