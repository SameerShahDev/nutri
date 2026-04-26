'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Lock, Crown, Flame, TrendingUp, Droplets, Zap } from 'lucide-react';
import { playSuccessSound } from '@/lib/sounds';
import { supabase } from '@/lib/supabase';

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence_score?: number;
}

export default function MagicCamera() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FoodItem | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [isStreamMode, setIsStreamMode] = useState(false);
  const [streamResults, setStreamResults] = useState<FoodItem[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check user's subscription plan
  useEffect(() => {
    const checkPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', user.id)
          .single();
        setUserPlan(profile?.subscription_plan || 'free');
      }
    };
    checkPlan();
  }, []);

  const startCamera = async () => {
    if (userPlan === 'free') {
      // Show upgrade prompt
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
        
        // Enable stream mode for all paid users (99, 299, 499, 999)
        setIsStreamMode(true);
        startStreamAnalysis();
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const startStreamAnalysis = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }

    streamIntervalRef.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 0.5);
          
          // Analyze with AI for object detection
          try {
            const base64 = imageData.split(',')[1];
            const response = await fetch('/api/analyze-photo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64 }),
            });

            if (response.ok) {
              const data = await response.json();
              // Add to stream results if not already present
              setStreamResults(prev => {
                const exists = prev.some(r => r.name === data.name);
                if (!exists && prev.length < 5) {
                  return [...prev, data];
                }
                return prev;
              });
            }
          } catch (error) {
            // Silent fail during streaming
          }
        }
      }
    }, 2000); // Analyze every 2 seconds
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        setIsCameraOpen(false);
        
        // Stop stream mode
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
        }
        setIsStreamMode(false);
        
        // Stop camera
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        
        // Analyze with AI
        analyzeFood(imageData);
      }
    }
  };

  const analyzeFood = async (imageData: string) => {
    setIsAnalyzing(true);
    
    try {
      const base64 = imageData.split(',')[1];
      const response = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!result) return;

    playSuccessSound();

    try {
      const response = await fetch('/api/add-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      if (response.ok) {
        setShowConfirmation(false);
        setResult(null);
        setCapturedImage(null);
      }
    } catch (error) {
      console.error('Error adding food:', error);
    }
  };

  const handleEdit = () => {
    setShowConfirmation(false);
    // Allow manual edit
  };

  const handleAddFromBubble = async (food: FoodItem) => {
    playSuccessSound();

    try {
      const response = await fetch('/api/add-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(food),
      });

      if (response.ok) {
        // Remove from stream results
        setStreamResults(prev => prev.filter(r => r.name !== food.name));
        
        // Generate health tip
        try {
          const tipResponse = await fetch('/api/health-tip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(food),
          });

          if (tipResponse.ok) {
            const tipData = await tipResponse.json();
            // Could show tip here if needed
          }
        } catch (tipError) {
          console.error('Health tip error:', tipError);
        }
      }
    } catch (error) {
      console.error('Error adding food:', error);
    }
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
    setIsStreamMode(false);
    setStreamResults([]);
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="w-full">
      {/* Magic Camera Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={startCamera}
        className={`w-full glass-card rounded-2xl p-4 flex items-center justify-center gap-3 ${
          userPlan === 'free' ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {userPlan === 'free' ? (
          <>
            <Lock className="w-6 h-6 text-gray-400" />
            <span className="text-gray-400 font-semibold">Upgrade to Scan Food</span>
            <Crown className="w-5 h-5 text-purple-400" />
          </>
        ) : userPlan === '999' ? (
          <>
            <Zap className="w-6 h-6 text-yellow-400" />
            <span className="text-white font-semibold">Super-Mode Scanner</span>
          </>
        ) : (
          <>
            <Camera className="w-6 h-6 text-purple-400" />
            <span className="text-white font-semibold">Magic Camera</span>
          </>
        )}
      </motion.button>

      {/* Camera View */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
          >
            <div className="relative flex-1">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Stream Mode Indicator */}
              {isStreamMode && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute top-4 left-4 bg-yellow-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-500/50 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm font-semibold">Super-Mode Active</span>
                </motion.div>
              )}
              
              {/* Stream Results - Floating Bubbles */}
              {isStreamMode && streamResults.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {streamResults.map((item, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.5, y: 50 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddFromBubble(item)}
                      className="pointer-events-auto absolute bg-gradient-to-br from-purple-600/90 to-pink-600/90 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                      style={{
                        left: `${20 + (index * 10)}%`,
                        top: `${30 + (index * 15)}%`,
                      }}
                    >
                      <p className="text-white font-bold text-sm">{item.name}</p>
                      <p className="text-white/80 text-xs">{item.calories} cal</p>
                      <p className="text-white/60 text-xs mt-1">Tap to Add</p>
                    </motion.button>
                  ))}
                </div>
              )}
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={closeCamera}
                className="absolute top-4 right-4 bg-black/50 p-2 rounded-full"
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={capturePhoto}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-4"
              >
                <Camera className="w-8 h-8 text-black" />
              </motion.button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyzing State */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 glass-card rounded-2xl p-6 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-white font-semibold">AI is analyzing your food...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Card */}
      <AnimatePresence>
        {showConfirmation && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-4 glass-card rounded-2xl p-6"
          >
            {capturedImage && (
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
            )}

            <h3 className="text-white font-semibold mb-2">Is this correct?</h3>
            <p className="text-2xl font-bold text-white mb-4">{result.name}</p>
            
            <div className="glass-button rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                  <p className="text-white font-bold">{result.calories}</p>
                  <p className="text-gray-400 text-xs">Cal</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <p className="text-white font-bold">{result.protein}g</p>
                  <p className="text-gray-400 text-xs">Protein</p>
                </div>
                <div className="text-center">
                  <Droplets className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-white font-bold">{result.carbs}g</p>
                  <p className="text-gray-400 text-xs">Carbs</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleEdit}
                className="flex-1 glass-button py-3 rounded-xl text-white font-semibold"
              >
                Edit
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-xl text-white font-semibold"
              >
                Confirm
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
