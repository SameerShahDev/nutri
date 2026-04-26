'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LiveCounterProps {
  value: number;
  targetValue: number;
  label: string;
  color?: string;
}

export default function LiveCounter({ value, targetValue, label, color = 'text-white' }: LiveCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (targetValue !== displayValue) {
      setIsAnimating(true);
      
      // Fast-forward animation
      const duration = 300; // 300ms fast animation
      const startTime = performance.now();
      const startValue = displayValue;
      const endValue = targetValue;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out function for smooth fast-forward effect
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easeOut;
        
        setDisplayValue(Math.round(currentValue * 10) / 10);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [targetValue, displayValue]);

  return (
    <div className="flex items-center gap-2">
      <motion.span
        className={`font-bold ${color} ${isAnimating ? 'scale-110' : 'scale-100'}`}
        animate={{ scale: isAnimating ? 1.1 : 1 }}
        transition={{ duration: 0.1 }}
      >
        {displayValue}
      </motion.span>
      <span className="text-gray-400 text-sm">{label}</span>
    </div>
  );
}
