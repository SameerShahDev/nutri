'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flame, TrendingUp, Droplets } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (data) {
          setLogs(data);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Food Logs</h1>
          <p className="text-gray-400 text-sm">Your nutrition history</p>
        </div>
      </motion.div>

      {/* Logs List */}
      <div className="space-y-3">
        {logs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-3xl p-8 text-center border border-white/10"
          >
            <p className="text-gray-400">No food logs yet</p>
            <p className="text-gray-500 text-sm mt-2">Start tracking your meals!</p>
          </motion.div>
        ) : (
          logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-2xl p-4 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{log.food_name}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(log.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-white">{log.calories}</span>
                  </div>
                  {log.macros && (
                    <>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-white">{log.macros.protein}g</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        <span className="text-white">{log.macros.carbs}g</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
