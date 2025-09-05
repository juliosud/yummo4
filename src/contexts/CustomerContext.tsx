import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  table_id: string;
  session_code: string;
  created_at: string;
}

interface CustomerContextType {
  customer: Customer | null;
  loading: boolean;
  error: string | null;
  setCustomer: (customer: Customer | null) => void;
  getCustomerBySession: (sessionCode: string) => Promise<Customer | null>;
  getCustomerByPhone: (phone: string) => Promise<Customer[]>;
  clearCustomer: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

interface CustomerProviderProps {
  children: ReactNode;
}

export const CustomerProvider: React.FC<CustomerProviderProps> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get customer by session code
  const getCustomerBySession = async (sessionCode: string): Promise<Customer | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_customer_by_session', {
        p_session_code: sessionCode,
      });

      if (rpcError) {
        console.error('Error fetching customer by session:', rpcError);
        setError('Failed to fetch customer data');
        return null;
      }

      if (data && data.length > 0) {
        const customerData = data[0] as Customer;
        setCustomer(customerData);
        return customerData;
      }

      return null;
    } catch (err) {
      console.error('Error in getCustomerBySession:', err);
      setError('Failed to fetch customer data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get customer by phone number (for future SMS notifications)
  const getCustomerByPhone = async (phone: string): Promise<Customer[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_customer_by_phone', {
        p_phone: phone,
      });

      if (rpcError) {
        console.error('Error fetching customer by phone:', rpcError);
        setError('Failed to fetch customer data');
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getCustomerByPhone:', err);
      setError('Failed to fetch customer data');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Clear customer data
  const clearCustomer = () => {
    setCustomer(null);
    setError(null);
  };

  // Try to load customer from URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionCode = urlParams.get('session');
    const guestName = urlParams.get('guestName');
    const guestPhone = urlParams.get('guestPhone');

    if (sessionCode && guestName && guestPhone) {
      // Create customer object from URL parameters
      const customerFromUrl: Customer = {
        id: '', // Will be filled when we fetch from DB
        name: guestName,
        phone: guestPhone,
        table_id: urlParams.get('table') || '',
        session_code: sessionCode,
        created_at: new Date().toISOString(),
      };
      
      // Try to fetch the actual customer data from the database
      getCustomerBySession(sessionCode).catch(() => {
        // If DB fetch fails, use URL data as fallback
        setCustomer(customerFromUrl);
      });
    }
  }, []);

  const value: CustomerContextType = {
    customer,
    loading,
    error,
    setCustomer,
    getCustomerBySession,
    getCustomerByPhone,
    clearCustomer,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
