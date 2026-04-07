import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Logo({ variant = 'gradient', size = 'md', to = '/dashboard', showText = true }) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', container: 'p-2' },
    md: { icon: 'w-10 h-10', text: 'text-xl', container: 'p-2.5' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', container: 'p-3' },
  };

  const textColors = {
    light: 'text-white',
    dark: 'text-gray-900',
    gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
  };

  const content = (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 2 }}
      className="inline-flex items-center gap-3"
    >
      {/* Logo Icon */}
      <div className={`bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 ${sizes[size].container} rounded-2xl shadow-lg relative overflow-hidden`}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        <svg className={`${sizes[size].icon} relative z-10`} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 8 L10 28 L18 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 12 C24 10 26 8 28 8 C30 8 32 10 32 12 C32 14 30 15 28 15 C26 15 24 16 24 18 C24 20 26 22 28 22 C30 22 32 20 32 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 8 L20 4 L26 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
      </div>

      {showText && (
        <span className={`${sizes[size].text} font-bold ${textColors[variant]} tracking-tight`}>
          LiveSync
        </span>
      )}
    </motion.div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}