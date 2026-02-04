import React, { useState, useEffect } from 'react';
import { Users, Package, CheckCircle, AlertCircle } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import CollectionChart from '../components/dashboard/CollectionChart';
import { getCollectionsByDate } from '../services/collectionService';
import { useCustomerContext } from '../contexts/CustomerContext';

const DashboardPage = () => {
  const { customers } = useCustomerContext();
  const [todayCollection, setTodayCollection] = useState({ weight: 0, count: 0 });

  useEffect(() => {
    const fetchTodayCollection = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const data = await getCollectionsByDate(today);

        const totalWeight = data.reduce((sum, col) => sum + parseFloat(col.weightKg || 0), 0);

        // Count unique customers by bookNumber (or customer.id as fallback)
        const uniqueCustomers = new Set();
        data.forEach(col => {
          const identifier = col.bookNumber || col.customer?.id;
          if (identifier) {
            uniqueCustomers.add(identifier);
          }
        });

        setTodayCollection({
          weight: totalWeight.toFixed(2),
          count: uniqueCustomers.size
        });
      } catch (error) {
        console.error('Error fetching today collection:', error);
      }
    };
    fetchTodayCollection();
  }, []);

  const stats = [
    { label: 'Total Customers', value: customers.length, icon: Users, color: 'from-green-500 to-emerald-500' },
    { label: "Today's Collection", value: `${todayCollection.weight} kg`, icon: Package, color: 'from-teal-500 to-cyan-500' },
    { label: 'Collected Today', value: `${todayCollection.count} customers`, icon: CheckCircle, color: 'from-emerald-500 to-green-500' },
    { label: 'Pending Collection', value: `${customers.length - todayCollection.count} customers`, icon: AlertCircle, color: 'from-orange-500 to-amber-500' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>
      <CollectionChart />
    </>
  );
};

export default DashboardPage;