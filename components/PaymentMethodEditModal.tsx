import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '../types';

interface PaymentMethodEditModalProps {
  method: PaymentMethod | null;
  onClose: () => void;
  onSave: (updatedMethod: PaymentMethod) => void;
}

const InputField: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder?: string; }> = ({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
        />
    </div>
);

const PaymentMethodEditModal: React.FC<PaymentMethodEditModalProps> = ({ method, onClose, onSave }) => {
  const [formData, setFormData] = useState<PaymentMethod | null>(method);

  useEffect(() => {
    // Update local state when the prop changes (i.e., when a new method is selected for editing)
    setFormData(method);
  }, [method]);

  if (!method || !formData) return null;

  const handleChange = (field: keyof PaymentMethod, value: string) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = () => {
    if (formData) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-in-out]" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg m-4 transform transition-all duration-300 animate-[slideInUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit: {method.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <InputField label="Display Name" value={formData.name} onChange={val => handleChange('name', val)} />
            <InputField label="Description for User" value={formData.description} onChange={val => handleChange('description', val)} />

            {formData.type === 'bank' && (
              <>
                <InputField label="Account Holder" value={formData.accountHolder || ''} onChange={val => handleChange('accountHolder', val)} />
                <InputField label="Account Number" value={formData.accountNumber || ''} onChange={val => handleChange('accountNumber', val)} />
                <InputField label="IBAN" value={formData.iban || ''} onChange={val => handleChange('iban', val)} />
                <InputField label="SWIFT/BIC" value={formData.swift || ''} onChange={val => handleChange('swift', val)} />
              </>
            )}

            {formData.type === 'crypto' && (
              <>
                <InputField label="Wallet Address" value={formData.address || ''} onChange={val => handleChange('address', val)} />
                <InputField label="Network" value={formData.network || ''} onChange={val => handleChange('network', val)} placeholder="e.g., ERC-20, Bitcoin"/>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodEditModal;