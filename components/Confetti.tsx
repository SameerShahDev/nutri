'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

export default function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    if (active) {
      const colors = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
      const newParticles = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -20 - Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ x: `${particle.x}%`, y: `${particle.y}%`, opacity: 1, rotate: 0 }}
          animate={{
            y: '120%',
            opacity: 0,
            rotate: particle.id * 36,
          }}
          transition={{
            duration: 2 + Math.random(),
            ease: 'easeOut',
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{ backgroundColor: particle.color }}
        />
      ))}
    </div>
  );
}
