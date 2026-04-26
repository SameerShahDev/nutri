'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Zap, Award } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  tagline: string;
  isBestValue: boolean;
  icon: React.ReactNode;
  link: string;
}

export default function SubscriptionPage() {
  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 99,
      features: [
        '5 AI Photo Scans/day',
        '10 Coach Chats/day',
      ],
      tagline: 'Smart start for your health.',
      isBestValue: false,
      icon: <Sparkles className="w-6 h-6" />,
      link: 'https://payments.cashfree.com/forms/cg-nutri-starter',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 299,
      features: [
        '15 AI Photo Scans/day',
        '50 Coach Chats/day',
        'Weekly Health Reports',
      ],
      tagline: 'Serious about results.',
      isBestValue: false,
      icon: <Zap className="w-6 h-6" />,
      link: 'https://payments.cashfree.com/forms/cg_nutri_299_pro',
    },
    {
      id: 'elite',
      name: 'Elite Unlimited',
      price: 499,
      features: [
        'UNLIMITED AI Photo Scans',
        'UNLIMITED Coach Arnie Chats',
        'Priority AI Processing',
        'Custom Workout & Nutrition Plans',
      ],
      tagline: 'No limits, just pure performance.',
      isBestValue: true,
      icon: <Award className="w-6 h-6" />,
      link: 'https://payments.cashfree.com/forms/cg-nutri-elite',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-6 pb-24">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0a0e1a] to-[#0a0e1a]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Premium Plans</h1>
          </div>
          <p className="text-gray-400 text-lg">Unlock your full potential with AI-powered nutrition coaching</p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative glass-card rounded-3xl p-6 border ${
                plan.isBestValue
                  ? 'border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.5),0_0_100px_rgba(168,85,247,0.3)] scale-105'
                  : 'border-white/10'
              }`}
            >
              {plan.isBestValue && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_auto] animate-gradient px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                >
                  BEST VALUE - UNLIMITED
                </motion.div>
              )}

              {/* Plan Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                plan.isBestValue
                  ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400'
                  : 'bg-white/10 text-purple-400'
              }`}>
                {plan.icon}
              </div>

              {/* Plan Name */}
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{plan.tagline}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  ₹{plan.price}
                </span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Buy Button */}
              <motion.a
                href={plan.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`block w-full py-3 rounded-2xl font-semibold text-center transition-all ${
                  plan.isBestValue
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }`}
              >
                Get Started
              </motion.a>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex items-center justify-center gap-8 flex-wrap"
        >
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Check className="w-4 h-4 text-green-400" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Check className="w-4 h-4 text-green-400" />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Check className="w-4 h-4 text-green-400" />
            <span>24/7 Support</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
