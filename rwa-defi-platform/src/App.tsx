import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Dashboard from './components/Dashboard'
import PropertyMarket from './components/PropertyMarket'
import DeFiVaults from './components/DeFiVaults'
import AIInsights from './components/AIInsights'
import Footer from './components/Footer'

const queryClient = new QueryClient()

type Page = 'home' | 'dashboard' | 'market' | 'vaults' | 'ai'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  return (
    <QueryClientProvider client={queryClient}>
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
          </motion.main>
        </AnimatePresence>

        <Footer />
      </div>
    </QueryClientProvider>
  )
}

export default App
