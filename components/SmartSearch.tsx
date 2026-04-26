'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Flame, TrendingUp, Droplets, Lightbulb } from 'lucide-react';
import { playSuccessSound } from '@/lib/sounds';

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export default function SmartSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [healthTip, setHealthTip] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search with Gemini Flash
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/search-food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.results || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleAddFood = async (food: FoodItem) => {
    setIsAdding(true);
    playSuccessSound();

    try {
      const response = await fetch('/api/add-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(food),
      });

      if (response.ok) {
        // Generate health tip
        try {
          const tipResponse = await fetch('/api/health-tip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(food),
          });

          if (tipResponse.ok) {
            const tipData = await tipResponse.json();
            setHealthTip(tipData.tip);
            
            // Hide tip after 3 seconds
            setTimeout(() => setHealthTip(null), 3000);
          }
        } catch (tipError) {
          console.error('Health tip error:', tipError);
        }

        setSuggestions([]);
        setQuery('');
      }
    } catch (error) {
      console.error('Error adding food:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full">
      {/* Health Tip Toast */}
      <AnimatePresence>
        {healthTip && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-md rounded-2xl p-4 border border-green-500/30 flex items-center gap-3"
          >
            <Lightbulb className="w-5 h-5 text-green-400" />
            <p className="text-white font-medium">{healthTip}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Input */}
      <div className="relative">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type food name (e.g., 2 egg rolls)"
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
          />
          {isSearching && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"
            />
          )}
        </div>

        {/* Auto-suggest Dropdown with One-Tap Add */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#0a0e1a] backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden z-50"
            >
              {suggestions.map((food, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAddFood(food)}
                  disabled={isAdding}
                  className="w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{food.name}</p>
                      <div className="flex gap-3 text-xs mt-1">
                        <span className="text-orange-400">{food.calories} kcal</span>
                        <span className="text-green-400">{food.protein}g P</span>
                        <span className="text-yellow-400">{food.carbs}g C</span>
                        <span className="text-red-400">{food.fats}g F</span>
                      </div>
                    </div>
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      <span className="text-white font-semibold text-sm">Add</span>
                    </motion.div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
