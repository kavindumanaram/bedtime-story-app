import React from 'react';
import { Card } from '../components/Card';
import { CreditCard, Download, Edit, Trash2, Check } from 'lucide-react';

export const Billing: React.FC = () => {
  const invoices = [
    { id: '001', date: 'Jan 2026', amount: '$9.99', status: 'Paid' },
    { id: '002', date: 'Dec 2025', amount: '$9.99', status: 'Paid' },
    { id: '003', date: 'Nov 2025', amount: '$9.99', status: 'Paid' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription & Billing</h1>
        <p className="text-gray-600">Manage your payment methods and subscription</p>
      </div>

      {/* Payment Card & Subscription Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Card</h3>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-white">
              <div className="mb-8">
                <div className="text-xs opacity-80 mb-1">Card Number</div>
                <div className="text-lg font-mono">•••• •••• •••• 4242</div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs opacity-80 mb-1">Card Holder</div>
                  <div className="text-sm font-medium">JOHN PARENT</div>
                </div>
                <div>
                  <div className="text-xs opacity-80 mb-1">Expires</div>
                  <div className="text-sm font-medium">12/28</div>
                </div>
              </div>
            </div>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              Update Card
            </button>
          </div>
        </Card>

        {/* Subscription Plans */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Plan */}
          <Card className="p-6 border-2 border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Basic</h3>
                <p className="text-sm text-gray-500">Current Plan</p>
              </div>
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                Active
              </span>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-gray-900">$9.99</span>
                <span className="text-gray-500">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {[
                'Access to 50+ stories',
                'Basic audio controls',
                'Single device',
                'Standard quality audio'
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">
              Current Plan
            </button>
          </Card>

          {/* Premium Plan */}
          <Card className="p-6 border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
              Popular
            </div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Premium</h3>
                <p className="text-sm text-gray-500">Upgrade Available</p>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-gray-900">$14.99</span>
                <span className="text-gray-500">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {[
                'Unlimited stories',
                'Advanced customization',
                '5 devices',
                'HD audio quality',
                'Offline downloads',
                'Ad-free experience'
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium">
              Upgrade Now
            </button>
          </Card>
        </div>
      </div>

      {/* Invoices */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{invoice.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {invoice.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {invoice.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-primary hover:text-primary-dark transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Billing Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Billing Address</h3>
            <button className="text-primary hover:text-primary-dark">
              <Edit className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="font-medium text-gray-900">John Parent</p>
            <p>123 Dream Lane</p>
            <p>Storyville, ST 12345</p>
            <p>United States</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
            <button className="text-red-500 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">•••• 4242</p>
                <p className="text-xs text-gray-500">Expires 12/28</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
