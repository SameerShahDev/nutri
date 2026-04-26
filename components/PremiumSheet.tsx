'use client';

import { motion } from 'framer-motion';
import { X, Crown, Zap, Infinity, Check } from 'lucide-react';

interface PremiumSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function PremiumSheet({ isOpen, onClose, onUpgrade }: PremiumSheetProps) {
  const benefits = [
    'Unlimited AI Photo Scans',
    'Unlimited Chat with Coach Arnie',
    'Advanced Nutrition Analytics',
    'Priority AI Processing',
    'No Daily Limits',
    'Exclusive Recipes & Meal Plans',
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        />
      )}

      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: isOpen ? 0 : '100%' }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-[#0a0e1a] rounded-t-3xl z-[60] max-h-[90vh] overflow-hidden"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Upgrade to Unlimited</h2>
              <p className="text-gray-400 text-sm">Unlock all features</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Price */}
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-1">One-time payment</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-4xl font-bold text-white">₹999</span>
              <span className="text-gray-400 text-lg">/lifetime</span>
            </div>
            <p className="text-green-400 text-sm mt-2">Best value • Save 60%</p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-white">{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-2xl text-white font-bold text-lg shadow-[0_0_30px_rgba(234,179,8,0.3)]"
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              <span>Upgrade Now</span>
            </div>
          </motion.button>

          {/* Security Note */}
          <p className="text-center text-gray-500 text-xs mt-4">
            Secured by Cashfree • 100% Safe
          </p>
        </div>
      </motion.div>
    </>
  );
}
