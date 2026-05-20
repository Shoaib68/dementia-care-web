"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from '@/shared/components/ui/Logo';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 0.6,
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        className="relative flex flex-col items-center"
      >
        <div className="relative">
          <Logo 
            width={80} 
            height={80} 
            className="drop-shadow-lg sm:w-24 sm:h-24" 
            priority 
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-800 mb-1 sm:mb-2">
            Dementia Care
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600">
            Loading healthcare platform...
          </p>
        </motion.div>
        
        {/* Loading indicator */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="mt-4 sm:mt-6 h-1 bg-gradient-to-r from-teal-400 to-purple-500 rounded-full overflow-hidden"
          style={{ width: "100px" }}
        >
          <motion.div
            animate={{ x: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-1/3 bg-white/30 rounded-full"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}