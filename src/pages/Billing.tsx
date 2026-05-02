import React from "react";
import { Card } from "../components/Card";
import { CreditCard, Download, Check } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type Plan = "free" | "basic" | "premium";

const PLANS: {
  id: Plan;
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Nightly template story",
      "Streak tracking",
      "Story library",
      "Template-only — no AI",
    ],
    cta: "Current Plan",
  },
  {
    id: "basic",
    name: "Basic",
    price: "$9.99",
    period: "/month",
    features: [
      "30 AI text stories / month",
      "No cover images",
      "Story continuation",
      "Character memory",
      "Preference learning",
    ],
    cta: "Upgrade to Basic",
  },
  {
    id: "premium",
    name: "Premium",
    price: "$14.99",
    period: "/month",
    features: [
      "Unlimited AI stories",
      "AI cover image generation",
      "Story continuation + images",
      "Character memory",
      "Priority generation",
    ],
    cta: "Upgrade to Premium",
    highlight: true,
  },
];

export const Billing: React.FC = () => {
  const { profile } = useAuth();
  const currentPlan: Plan = (profile?.plan as Plan) ?? "free";

  const invoices = [
    { id: "001", date: "Jan 2026", amount: "$9.99", status: "Paid" },
    { id: "002", date: "Dec 2025", amount: "$9.99", status: "Paid" },
    { id: "003", date: "Nov 2025", amount: "$9.99", status: "Paid" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription & Billing</h1>
        <p className="text-gray-600">Manage your subscription and payment methods</p>
      </div>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <Card
              key={plan.id}
              className={`p-6 relative overflow-hidden ${
                plan.highlight ? "border-2 border-primary" : "border border-gray-200"
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Popular
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  {isCurrent && (
                    <span className="text-xs text-primary font-medium">Current Plan</span>
                  )}
                </div>
                {isCurrent && (
                  <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  isCurrent
                    ? "bg-gray-100 text-gray-500 cursor-default"
                    : plan.highlight
                      ? "bg-primary text-white hover:bg-primary-dark"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {isCurrent ? "Current Plan" : plan.cta}
              </button>
            </Card>
          );
        })}
      </div>

      {/* Payment Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment Card</h3>
          <CreditCard className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-white w-full sm:w-72 flex-shrink-0">
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
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
            Update Card
          </button>
        </div>
      </Card>

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
    </div>
  );
};
