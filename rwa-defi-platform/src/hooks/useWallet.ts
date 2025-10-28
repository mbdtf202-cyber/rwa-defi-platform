import { useState, useEffect } from 'react';
import { connectWallet, getBalance } from '../utils/web3';

export const useWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const addr = await connectWallet();
      setAddress(addr);
      const bal = await getBalance(addr);
      setBalance(bal);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setBalance('0');
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
          getBalance(accounts[0]).then(setBalance);
        }
      });
    }
  }, []);

  return { address, balance, isConnecting, error, connect, disconnect };
};
