import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface Order {
  id: string;
  price: number;
  amount: number;
  total: number;
}

interface OrderBookProps {
  tokenAddress: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({ tokenAddress }) => {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 5000);
    return () => clearInterval(interval);
  }, [tokenAddress]);

  const fetchOrderBook = async () => {
    try {
      const response = await fetch(`/api/marketplace/orderbook?tokenAddress=${tokenAddress}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBids(data.bids.map((b: any) => ({
          id: b.id,
          price: b.price,
          amount: b.amount - b.filledAmount,
          total: (b.amount - b.filledAmount) * b.price,
        })));
        setAsks(data.asks.map((a: any) => ({
          id: a.id,
          price: a.price,
          amount: a.amount - a.filledAmount,
          total: (a.amount - a.filledAmount) * a.price,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch order book:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const spread = asks.length > 0 && bids.length > 0 
    ? ((asks[0].price - bids[0].price) / bids[0].price * 100).toFixed(2)
    : '0.00';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Order Book</h3>
          <div className="text-sm text-gray-600">
            Spread: <span className="font-semibold">{spread}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-200">
        {/* Bids (Buy Orders) */}
        <div>
          <div className="px-4 py-2 bg-green-50 border-b border-gray-200">
            <div className="flex items-center text-green-700 font-semibold">
              <TrendingUp className="w-4 h-4 mr-2" />
              Bids
            </div>
          </div>
          
          <div className="px-4 py-2 text-xs text-gray-500 grid grid-cols-3 gap-2">
            <div>Price (USDC)</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Total</div>
          </div>

          <div className="divide-y divide-gray-100">
            {bids.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No buy orders
              </div>
            ) : (
              bids.slice(0, 10).map((bid) => (
                <div
                  key={bid.id}
                  className="px-4 py-2 hover:bg-green-50 grid grid-cols-3 gap-2 text-sm"
                >
                  <div className="text-green-600 font-semibold">
                    ${bid.price.toFixed(2)}
                  </div>
                  <div className="text-right text-gray-700">
                    {bid.amount.toFixed(2)}
                  </div>
                  <div className="text-right text-gray-600">
                    ${bid.total.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Asks (Sell Orders) */}
        <div>
          <div className="px-4 py-2 bg-red-50 border-b border-gray-200">
            <div className="flex items-center text-red-700 font-semibold">
              <TrendingDown className="w-4 h-4 mr-2" />
              Asks
            </div>
          </div>
          
          <div className="px-4 py-2 text-xs text-gray-500 grid grid-cols-3 gap-2">
            <div>Price (USDC)</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Total</div>
          </div>

          <div className="divide-y divide-gray-100">
            {asks.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No sell orders
              </div>
            ) : (
              asks.slice(0, 10).map((ask) => (
                <div
                  key={ask.id}
                  className="px-4 py-2 hover:bg-red-50 grid grid-cols-3 gap-2 text-sm"
                >
                  <div className="text-red-600 font-semibold">
                    ${ask.price.toFixed(2)}
                  </div>
                  <div className="text-right text-gray-700">
                    {ask.amount.toFixed(2)}
                  </div>
                  <div className="text-right text-gray-600">
                    ${ask.total.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
