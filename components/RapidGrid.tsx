'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Flame, Apple, Droplets, Carrot, Beef, Fish, Egg, Coffee, Wheat } from 'lucide-react';
import { playSuccessSound } from '@/lib/sounds';
import LiveCounter from './LiveCounter';

interface FoodRow {
  id: string;
  name: string;
  quantity: string;
  suggestions: Array<{ name: string; calories_per_gram: number; protein_per_gram: number; carbs_per_gram: number; fats_per_gram: number }>;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFats: number;
  isMatched: boolean;
}

export default function RapidGrid() {
  const [rows, setRows] = useState<FoodRow[]>([
    { id: '1', name: '', quantity: '', suggestions: [], estimatedCalories: 0, estimatedProtein: 0, estimatedCarbs: 0, estimatedFats: 0, isMatched: false },
    { id: '2', name: '', quantity: '', suggestions: [], estimatedCalories: 0, estimatedProtein: 0, estimatedCarbs: 0, estimatedFats: 0, isMatched: false },
    { id: '3', name: '', quantity: '', suggestions: [], estimatedCalories: 0, estimatedProtein: 0, estimatedCarbs: 0, estimatedFats: 0, isMatched: false },
    { id: '4', name: '', quantity: '', suggestions: [], estimatedCalories: 0, estimatedProtein: 0, estimatedCarbs: 0, estimatedFats: 0, isMatched: false },
    { id: '5', name: '', quantity: '', suggestions: [], estimatedCalories: 0, estimatedProtein: 0, estimatedCarbs: 0, estimatedFats: 0, isMatched: false },
    { id: '6', name: '', quantity: '', suggestions: [], estimatedCalories: 0, estimatedProtein: 0, estimatedCarbs: 0, estimatedFats: 0, isMatched: false },
    { id: '7', name: '', quantity: '', suggestions: [], estimatedCalories: 0, estimatedProtein: 0, estimatedCarbs: 0, estimatedFats: 0, isMatched: false },
    { id: '8', name: '', quantity: '', suggestions: [], estimatedCalories: 0, estimatedProtein: 0, estimatedCarbs: 0, estimatedFats: 0, isMatched: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addRow = () => {
    const newId = Date.now().toString();
    setRows(prev => [
      ...prev,
      { id: newId, name: '', quantity: '', suggestions: [], estimatedCalories: 0, estimatedProtein: 0, estimatedCarbs: 0, estimatedFats: 0, isMatched: false },
    ]);
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(row => row.id !== id));
  };

  const updateRowName = (id: string, name: string) => {
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, name, isMatched: false } : row
    ));

    // Debounced AI suggestions
    if (debounceRef.current.has(id)) {
      clearTimeout(debounceRef.current.get(id)!);
    }

    if (name.length >= 2) {
      const timeout = setTimeout(async () => {
        try {
          const response = await fetch('/api/search-food', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: name }),
          });

          if (response.ok) {
            const data = await response.json();
            setRows(prev => prev.map(row => 
              row.id === id ? { 
                ...row, 
                suggestions: data.results || [],
                isMatched: (data.results && data.results.length > 0 && data.source === 'database')
              } : row
            ));
          }
        } catch (error) {
          console.error('Search error:', error);
        }
      }, 500);

      debounceRef.current.set(id, timeout);
    } else {
      setRows(prev => prev.map(row => 
        row.id === id ? { ...row, suggestions: [], isMatched: false } : row
      ));
    }
  };

  const updateRowQuantity = (id: string, quantity: string) => {
    const row = rows.find(r => r.id === id);
    if (!row) return;

    // Calculate estimated nutrients based on per-gram values
    const suggestion = row.suggestions[0];
    const qty = parseFloat(quantity) || 0;
    
    const estimatedCalories = suggestion ? Math.round(suggestion.calories_per_gram * qty) : 0;
    const estimatedProtein = suggestion ? Math.round(suggestion.protein_per_gram * qty * 10) / 10 : 0;
    const estimatedCarbs = suggestion ? Math.round(suggestion.carbs_per_gram * qty * 10) / 10 : 0;
    const estimatedFats = suggestion ? Math.round(suggestion.fats_per_gram * qty * 10) / 10 : 0;

    setRows(prev => prev.map(r => 
      r.id === id ? { 
        ...r, 
        quantity, 
        estimatedCalories, 
        estimatedProtein, 
        estimatedCarbs, 
        estimatedFats 
      } : r
    ));
  };

  const selectSuggestion = (rowId: string, suggestion: any) => {
    const qty = parseFloat(rows.find(r => r.id === rowId)?.quantity || '1') || 1;
    
    setRows(prev => prev.map(row => 
      row.id === rowId 
        ? { 
            ...row, 
            name: suggestion.name, 
            suggestions: [],
            estimatedCalories: Math.round(suggestion.calories_per_gram * qty),
            estimatedProtein: Math.round(suggestion.protein_per_gram * qty * 10) / 10,
            estimatedCarbs: Math.round(suggestion.carbs_per_gram * qty * 10) / 10,
            estimatedFats: Math.round(suggestion.fats_per_gram * qty * 10) / 10,
            isMatched: true,
          } 
        : row
    ));
  };

  // Get icon based on food name
  const getFoodIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('water') || lowerName.includes('juice') || lowerName.includes('drink') || lowerName.includes('milk')) {
      return <Droplets className="w-5 h-5 text-blue-400" />;
    }
    if (lowerName.includes('chicken') || lowerName.includes('meat') || lowerName.includes('beef') || lowerName.includes('mutton')) {
      return <Beef className="w-5 h-5 text-red-400" />;
    }
    if (lowerName.includes('fish') || lowerName.includes('prawn') || lowerName.includes('seafood')) {
      return <Fish className="w-5 h-5 text-cyan-400" />;
    }
    if (lowerName.includes('egg') || lowerName.includes('omelette')) {
      return <Egg className="w-5 h-5 text-yellow-400" />;
    }
    if (lowerName.includes('vegetable') || lowerName.includes('carrot') || lowerName.includes('spinach') || lowerName.includes('broccoli')) {
      return <Carrot className="w-5 h-5 text-orange-400" />;
    }
    if (lowerName.includes('rice') || lowerName.includes('bread') || lowerName.includes('roti') || lowerName.includes('wheat')) {
      return <Wheat className="w-5 h-5 text-amber-400" />;
    }
    if (lowerName.includes('coffee') || lowerName.includes('tea') || lowerName.includes('chai')) {
      return <Coffee className="w-5 h-5 text-brown-400" />;
    }
    
    // Default food icon
    return <Apple className="w-5 h-5 text-green-400" />;
  };

  const handleSubmitAll = async () => {
    setIsSubmitting(true);

    try {
      const validRows = rows.filter(row => row.name && row.quantity);
      
      for (const row of validRows) {
        const suggestion = row.suggestions[0] || { 
          name: row.name, 
          calories: row.estimatedCalories,
          protein: 0,
          carbs: 0,
          fats: 0,
        };

        await fetch('/api/add-food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(suggestion),
        });
      }

      playSuccessSound();
      setRows([{ id: '1', name: '', quantity: '', suggestions: [], estimatedCalories: 0, estimatedProtein: 0, estimatedCarbs: 0, estimatedFats: 0, isMatched: false }]);
    } catch (error) {
      console.error('Error adding foods:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Input Rows */}
      <div className="space-y-3 mb-4">
        <AnimatePresence>
          {rows.map((row, index) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              className={`glass-card rounded-2xl p-4 border transition-all duration-300 ${
                row.isMatched 
                  ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]' 
                  : 'border-white/10'
              }`}
            >
              {/* Food Name Input with Icon */}
              <div className="mb-3">
                <div className="flex items-center gap-3">
                  {row.name && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex-shrink-0"
                    >
                      {getFoodIcon(row.name)}
                    </motion.div>
                  )}
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRowName(row.id, e.target.value)}
                    placeholder="Food name (e.g., Roti)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-purple-500 transition-colors text-lg"
                  />
                </div>
                
                {/* AI Suggestions */}
                {row.suggestions.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                    {row.suggestions.map((suggestion, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => selectSuggestion(row.id, suggestion)}
                        className="flex-shrink-0 bg-purple-600/20 border border-purple-500/30 rounded-xl px-3 py-2 text-left"
                      >
                        <p className="text-white text-sm font-medium">{suggestion.name}</p>
                        <p className="text-gray-400 text-xs">{Math.round(suggestion.calories_per_gram * 100)} kcal/100g</p>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity Input */}
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={row.quantity}
                  onChange={(e) => updateRowQuantity(row.id, e.target.value)}
                  placeholder="Qty (e.g., 2)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-purple-500 transition-colors text-lg"
                />
                
                {rows.length > 1 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeRow(row.id)}
                    className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl"
                  >
                    <X className="w-5 h-5 text-red-400" />
                  </motion.button>
                )}
              </div>

              {/* Live Macros with Fast-Forward Animation */}
              {row.estimatedCalories > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 grid grid-cols-4 gap-2"
                >
                  <LiveCounter 
                    value={0} 
                    targetValue={row.estimatedCalories} 
                    label="kcal" 
                    color="text-orange-400" 
                  />
                  <LiveCounter 
                    value={0} 
                    targetValue={row.estimatedProtein} 
                    label="P" 
                    color="text-green-400" 
                  />
                  <LiveCounter 
                    value={0} 
                    targetValue={row.estimatedCarbs} 
                    label="C" 
                    color="text-yellow-400" 
                  />
                  <LiveCounter 
                    value={0} 
                    targetValue={row.estimatedFats} 
                    label="F" 
                    color="text-blue-400" 
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Add Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={addRow}
        className="w-full glass-card rounded-2xl p-4 flex items-center justify-center gap-2 border border-dashed border-white/30 hover:border-purple-500/50 transition-colors"
      >
        <Plus className="w-6 h-6 text-purple-400" />
        <span className="text-white font-semibold">Add Row</span>
      </motion.button>

      {/* Submit All Button */}
      {rows.some(row => row.name && row.quantity) && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmitAll}
          disabled={isSubmitting}
          className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 text-white font-bold text-lg disabled:opacity-50"
        >
          {isSubmitting ? 'Adding...' : 'Add All to Day'}
        </motion.button>
      )}
    </div>
  );
}
