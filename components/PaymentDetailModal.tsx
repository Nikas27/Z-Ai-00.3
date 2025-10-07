import React from 'react';
import { Payment } from '../types';

interface PaymentDetailModalProps {
  payment: Payment | null;
  onClose: () => void;
  onApprove?: (paymentId: string) => void;
  onReject?: (paymentId: string) => void;
  onDelete?: (paymentId: string) => void;
  onRequeue?: (paymentId: string) => void;
  onValidate?: (paymentId: string) => void;
}

const DetailRow: React.FC<{ label: string; value: string | number; children?: React.ReactNode }> = ({ label, value, children }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        {children || <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>}
    </div>
);

const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({ payment, onClose, onApprove, onReject, onDelete, onRequeue, onValidate }) => {
  if (!payment) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderProof = () => {
    switch (payment.methodType) {
      case 'bank':
        return (
          payment.proof.fileDataUrl ? (
            <div>
              <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-2">Proof of Payment</h4>
              <img src={payment.proof.fileDataUrl} alt="Proof of payment" className="rounded-lg max-w-full h-auto border border-gray-300 dark:border-gray-600" />
            </div>
          ) : <p className="text-sm text-gray-500 dark:text-gray-400 italic">No proof was uploaded.</p>
        );
      case 'crypto':
        const explorerUrl = `https://www.blockchain.com/explorer/search?search=${payment.proof.hash}`; // Example for BTC/ETH
        return (
          payment.proof.hash ? (
            <div>
              <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-2">Transaction Hash</h4>
              <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md font-mono text-xs break-all text-gray-700 dark:text-gray-300">
                <span className="flex-1">{payment.proof.hash}</span>
                <button onClick={() => handleCopy(payment.proof.hash!)} className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-500 hover:underline mt-1 inline-block">View on Explorer (simulated)</a>
            </div>
          ) : <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hash provided.</p>
        );
      case 'card':
        return (
          payment.proof.transactionId ? (
             <div>
                <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-2">Transaction ID</h4>
                 <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md font-mono text-xs break-all text-gray-700 dark:text-gray-300">
                    <span className="flex-1">{payment.proof.transactionId}</span>
                    <button onClick={() => handleCopy(payment.proof.transactionId!)} className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                 </div>
            </div>
          ) : <p className="text-sm text-gray-500 dark:text-gray-400 italic">No transaction ID available.</p>
        );
      default:
        return <p className="text-sm text-gray-500 dark:text-gray-400 italic">No proof required for this payment method.</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-in-out]" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800/95 rounded-xl shadow-2xl w-full max-w-lg m-4 transform transition-all duration-300 animate-[slideInUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <DetailRow label="User" value={payment.userEmail} />
            <DetailRow label="Date" value={new Date(payment.createdAt).toLocaleString()} />
            <DetailRow label="Payment Method" value={payment.methodName} />
            <DetailRow label="Status">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    payment.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    payment.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>{payment.status}</span>
            </DetailRow>
            {payment.methodType === 'card' && payment.cardholderName && <DetailRow label="Cardholder" value={payment.cardholderName} />}
            {payment.methodType === 'card' && payment.maskedCardNumber && <DetailRow label="Card" value={payment.maskedCardNumber} />}
            <DetailRow label="Final Amount" value={`$${payment.amountPaid.toFixed(2)}`} />
             {payment.tokenDiscount > 0 && <DetailRow label="Token Discount" value={`-$${payment.tokenDiscount.toFixed(2)}`} />}
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            {renderProof()}
            {payment.status === 'rejected' && payment.verificationError && (
                 <div className="mt-4 p-2 bg-red-100 dark:bg-red-900/50 rounded-md text-red-700 dark:text-red-300 text-sm">
                    <strong>Rejection Reason:</strong> {payment.verificationError}
                </div>
            )}
          </div>

            <div className="mt-6 flex justify-between items-center">
                <div>
                    {/* Conditional action button based on status */}
                    {payment.status === 'approved' && onRequeue && (
                        <button 
                            onClick={() => onRequeue(payment.id)} 
                            className="px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-100 rounded-md hover:bg-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-300 dark:hover:bg-cyan-900"
                        >
                            Re-queue
                        </button>
                    )}
                    {payment.status === 'pending' && onDelete && (
                        <button 
                            onClick={() => onDelete(payment.id)} 
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
                        >
                            Delete Record
                        </button>
                    )}
                    {payment.status === 'rejected' && onValidate && (
                         <button 
                            onClick={() => onValidate(payment.id)} 
                            className="px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-100 rounded-md hover:bg-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-300 dark:hover:bg-cyan-900"
                        >
                            Re-validate
                        </button>
                    )}
                </div>
                
                {/* Action buttons for pending payments */}
                {payment.status === 'pending' && onApprove && onReject && (
                    <div className="flex gap-3">
                        <button 
                            onClick={() => onReject(payment.id)} 
                            className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
                        >
                            Reject
                        </button>
                        <button 
                            onClick={() => onApprove(payment.id)} 
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                            Approve
                        </button>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentDetailModal;