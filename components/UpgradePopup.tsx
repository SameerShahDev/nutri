'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, Check } from 'lucide-react';
import { playClickSound } from '@/lib/sounds';
import { useRouter } from 'next/navigation';

interface UpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  currentUsage: number;
  limit: number;
  type: 'photo' | 'chat';
}

const PLANS = [
  {
    name: 'Starter',
    price: '99',
    photos: 20,
    chats: 100,
    features: ['20 photo analyses', '100 AI chats', 'Priority support'],
    popular: false,
  },
  {
    name: 'Pro',
    price: '299',
    photos: 50,
    chats: 500,
    features: ['50 photo analyses', '500 AI chats', 'Priority support', 'Advanced analytics'],
    popular: true,
  },
  {
    name: 'Elite',
    price: '499',
    photos: 100,
    chats: 1000,
    features: ['100 photo analyses', '1000 AI chats', 'Priority support', 'Advanced analytics', 'Personal coach'],
    popular: false,
  },
  {
    name: 'Unlimited',
    price: '999',
    photos: -1,
    chats: -1,
    features: ['Unlimited photos', 'Unlimited chats', '24/7 support', 'All features', 'Personal coach'],
    popular: false,
  },
];

export default function UpgradePopup({
  isOpen,
  onClose,
  currentPlan,
  currentUsage,
  limit,
  type,
}: UpgradePopupProps) {
  const router = useRouter();

  const handleUpgrade = (plan: string) => {
    playClickSound();
    onClose();
    router.push('/subscription');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blurred background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="glass-card rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
                    <p className="text-gray-400 text-sm">
                      You've used {currentUsage}/{limit === -1 ? '∞' : limit} daily {type}s
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Current plan info */}
              <div className="glass-button rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Current Plan</p>
                    <p className="text-white font-semibold capitalize">{currentPlan}</p>
                  </div>
                </div>
              </div>

              {/* Plans grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {PLANS.map((plan) => (
                  <motion.div
                    key={plan.price}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleUpgrade(plan.price)}
                    className={`relative rounded-2xl p-5 cursor-pointer transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-2 border-purple-400'
                        : 'glass-button text-gray-300'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                        POPULAR
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <div className="text-2xl font-bold">₹{plan.price}</div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        <span>{plan.photos === -1 ? 'Unlimited' : plan.photos} photo analyses</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        <span>{plan.chats === -1 ? 'Unlimited' : plan.chats} AI chats</span>
                      </div>
                      {plan.features.slice(2).map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full py-3 rounded-xl font-semibold ${
                        plan.popular
                          ? 'bg-white text-purple-600'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      Upgrade Now
                    </motion.button>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <p className="text-center text-gray-500 text-sm">
                Secure payment powered by Cashfree. Cancel anytime.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
