import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Payment } from '../types';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { databaseService } from '../services/databaseService';
import PaymentDetailModal from './PaymentDetailModal';

interface PurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterStatus = 'all' | 'approved' | 'pending' | 'rejected';

const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string; }> = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${active ? 'bg-cyan-600 text-white font-semibold' : 'hover:bg-gray-700 text-gray-300'}`}
    >
        {label}
    </button>
);


const PurchaseHistoryModal: React.FC<PurchaseHistoryModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useSubscriptionContext();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  
  const prevPaymentsRef = useRef<Payment[]>([]);
  useEffect(() => {
    prevPaymentsRef.current = payments;
  });

  const fetchUserPayments = useCallback(() => {
    if (currentUser) {
      const newUserPayments = databaseService.getAllPayments()
        .filter(p => p.userId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const updatedIds = new Set<string>();
      const oldPayments = prevPaymentsRef.current;
      
      newUserPayments.forEach(newPayment => {
          const oldPayment = oldPayments.find(p => p.id === newPayment.id);
          if (oldPayment && oldPayment.status === 'pending' && (newPayment.status === 'approved' || newPayment.status === 'rejected')) {
              updatedIds.add(newPayment.id);
          }
      });

      if (updatedIds.size > 0) {
          setRecentlyUpdated(updatedIds);
          setTimeout(() => setRecentlyUpdated(new Set()), 2500); // Animation is 2.5s
      }
        
      setPayments(newUserPayments);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
        fetchUserPayments();
        databaseService.subscribe('data_changed', fetchUserPayments);
    } else {
        setPayments([]);
        setSelectedPayment(null);
        setFilter('all');
    }

    return () => {
        databaseService.unsubscribe('data_changed', fetchUserPayments);
    };
  }, [isOpen, fetchUserPayments]);
  
  const filteredPayments = useMemo(() => {
    if (filter === 'all') return payments;
    return payments.filter(p => p.status === filter);
  }, [payments, filter]);

  if (!isOpen) {
    return null;
  }

  const getStatusChip = (status: Payment['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-in-out]" 
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl shadow-2xl w-full max-w-4xl m-4 h-[80vh] transform transition-all duration-300 animate-[slideInUp_0.3s_ease-out] flex flex-col p-4 md:p-6" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
            <h2 className="text-2xl font-bold">Purchase History</h2>
            <div className="flex items-center gap-2 p-1 bg-gray-800/50 rounded-lg">
                {(['all', 'approved', 'pending', 'rejected'] as const).map(f => (
                    <FilterButton 
                        key={f} 
                        active={filter === f} 
                        onClick={() => setFilter(f)} 
                        label={f.charAt(0).toUpperCase() + f.slice(1)}
                    />
                ))}
            </div>
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition" 
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-grow overflow-y-auto pr-2">
            {filteredPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700/50">
                    {filteredPayments.map(payment => (
                      <tr 
                        key={payment.id} 
                        className={`transition-colors ${recentlyUpdated.has(payment.id) ? 'animate-soft-glow' : 'hover:bg-gray-50 dark:hover:bg-gray-800/70'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{new Date(payment.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${payment.amountPaid.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{payment.methodName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => setSelectedPayment(payment)} className="text-cyan-600 dark:text-cyan-400 hover:underline">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <p className="font-semibold">No Purchases Found</p>
                <p className="text-sm">Your payment history for this category will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <PaymentDetailModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
    </>
  );
};

export default PurchaseHistoryModal;