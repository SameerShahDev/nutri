'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Flame, Droplets, TrendingUp } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { playSuccessSound } from '@/lib/sounds';

interface NutritionResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export default function Scan() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    try {
      setError(null);
      setIsAnalyzing(true);

      // Compress image: max 800px, 0.7 quality
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        initialQuality: 0.7,
      };

      const compressedFile = await imageCompression(file, options);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        setImage(e.target?.result as string);

        // Send to API
        try {
          const response = await fetch('/api/analyze-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });

          const data = await response.json();

          if (response.ok) {
            setResult(data);
            playSuccessSound();
          } else if (data.error === 'LIMIT_EXCEEDED') {
            setError('Daily limit reached. Upgrade your plan to continue.');
          } else {
            setError(data.error || 'Failed to analyze image');
          }
        } catch (err) {
          setError('Failed to analyze image. Please try again.');
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      setError('Failed to process image');
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const resetScan = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="w-full">
      {/* Upload State */}
      <AnimatePresence mode="wait">
        {!image && !isAnalyzing && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-3xl p-8"
          >
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-2xl p-12 text-center cursor-pointer hover:border-purple-500 transition-colors"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="inline-block mb-4"
              >
                <Camera className="w-16 h-16 text-purple-400 mx-auto" />
              </motion.div>
              <h3 className="text-white font-semibold mb-2">Scan Food</h3>
              <p className="text-gray-400 text-sm mb-4">Take a photo or upload an image</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-button px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2 mx-auto"
              >
                <Upload className="w-4 h-4" />
                Choose Image
              </motion.button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        )}

        {/* Analyzing State with Skeleton */}
        {(image || isAnalyzing) && !result && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-3xl p-6"
          >
            {image && (
              <div className="relative mb-6">
                <img src={image} alt="Uploaded" className="w-full h-48 object-cover rounded-2xl" />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={resetScan}
                  className="absolute top-2 right-2 bg-black/50 p-2 rounded-full"
                >
                  <X className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            )}

            {/* Skeleton Loader */}
            <div className="space-y-4">
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="h-4 bg-gray-700 rounded-lg w-1/3"
              />
              
              <div className="grid grid-cols-3 gap-4">
                {/* Calories Skeleton */}
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
                  className="glass-button rounded-2xl p-4 text-center"
                >
                  <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <div className="h-8 bg-gray-700 rounded-lg mb-2" />
                  <div className="h-3 bg-gray-700 rounded-lg w-2/3 mx-auto" />
                </motion.div>

                {/* Protein Skeleton */}
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="glass-button rounded-2xl p-4 text-center"
                >
                  <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="h-8 bg-gray-700 rounded-lg mb-2" />
                  <div className="h-3 bg-gray-700 rounded-lg w-2/3 mx-auto" />
                </motion.div>

                {/* Water Skeleton */}
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  className="glass-button rounded-2xl p-4 text-center"
                >
                  <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="h-8 bg-gray-700 rounded-lg mb-2" />
                  <div className="h-3 bg-gray-700 rounded-lg w-2/3 mx-auto" />
                </motion.div>
              </div>

              {/* Macros Skeleton */}
              <div className="space-y-3">
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  className="h-12 bg-gray-700 rounded-xl"
                />
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  className="h-12 bg-gray-700 rounded-xl"
                />
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                  className="h-12 bg-gray-700 rounded-xl"
                />
              </div>
            </div>

            {isAnalyzing && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-center text-gray-400 text-sm mt-4"
              >
                Analyzing with AI...
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Result State */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-3xl p-6"
          >
            {image && (
              <div className="relative mb-6">
                <img src={image} alt="Uploaded" className="w-full h-48 object-cover rounded-2xl" />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={resetScan}
                  className="absolute top-2 right-2 bg-black/50 p-2 rounded-full"
                >
                  <X className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            )}

            <h3 className="text-2xl font-bold text-white mb-4">{result.food_name}</h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="glass-button rounded-2xl p-4 text-center">
                <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{result.calories}</p>
                <p className="text-gray-400 text-sm">Calories</p>
              </div>

              <div className="glass-button rounded-2xl p-4 text-center">
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{result.protein}g</p>
                <p className="text-gray-400 text-sm">Protein</p>
              </div>

              <div className="glass-button rounded-2xl p-4 text-center">
                <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{result.carbs}g</p>
                <p className="text-gray-400 text-sm">Carbs</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="glass-button rounded-xl p-4 flex justify-between items-center">
                <span className="text-gray-400">Protein</span>
                <span className="text-white font-semibold">{result.protein}g</span>
              </div>
              <div className="glass-button rounded-xl p-4 flex justify-between items-center">
                <span className="text-gray-400">Carbs</span>
                <span className="text-white font-semibold">{result.carbs}g</span>
              </div>
              <div className="glass-button rounded-xl p-4 flex justify-between items-center">
                <span className="text-gray-400">Fats</span>
                <span className="text-white font-semibold">{result.fats}g</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4"
        >
          <p className="text-red-400 text-center">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
