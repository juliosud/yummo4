import React, { useState, useEffect } from 'react';
import { useCustomer } from '@/contexts/CustomerContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Search, Phone, User, Calendar } from 'lucide-react';

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  table_id: string;
  session_code: string;
  created_at: string;
}

const CustomerDataView: React.FC = () => {
  const { getCustomerByPhone } = useCustomer();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all customers
  const fetchAllCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching customers:', fetchError);
        setError('Failed to fetch customer data');
        return;
      }

      setCustomers(data || []);
    } catch (err) {
      console.error('Error in fetchAllCustomers:', err);
      setError('Failed to fetch customer data');
    } finally {
      setLoading(false);
    }
  };

  // Search customers by phone
  const searchCustomers = async () => {
    if (!searchPhone.trim()) {
      fetchAllCustomers();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const results = await getCustomerByPhone(searchPhone);
      setCustomers(results);
    } catch (err) {
      console.error('Error in searchCustomers:', err);
      setError('Failed to search customers');
    } finally {
      setLoading(false);
    }
  };

  // Load all customers on component mount
  useEffect(() => {
    fetchAllCustomers();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Data</h1>
        <p className="text-gray-600">
          View customer information collected from terminal scans
        </p>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label htmlFor="phone-search" className="block text-sm font-medium text-gray-700 mb-1">
            Search by Phone Number
          </label>
          <div className="flex gap-2">
            <Input
              id="phone-search"
              type="tel"
              placeholder="Enter phone number..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="flex-1"
            />
            <Button onClick={searchCustomers} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
        <Button onClick={fetchAllCustomers} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading customer data...</p>
        </div>
      )}

      {/* Customer List */}
      {!loading && (
        <div className="space-y-4">
          {customers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">No customer data found</p>
                {searchPhone && (
                  <p className="text-sm text-gray-500 mt-2">
                    Try searching with a different phone number or refresh to see all customers
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            customers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-600" />
                      {customer.name}
                    </CardTitle>
                    <Badge variant="secondary">
                      Table {customer.table_id}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="font-mono text-sm">{formatPhone(customer.phone)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Scanned:</span>
                      <span className="text-sm">{formatDate(customer.created_at)}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Session:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {customer.session_code}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && customers.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
            {searchPhone && ` matching "${searchPhone}"`}
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerDataView;
