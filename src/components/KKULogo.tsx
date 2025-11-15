import React from 'react';
import { motion } from 'motion/react';

interface KKULogoProps {
  size?: number;
  animated?: boolean;
}

export const KKULogo: React.FC<KKULogoProps> = ({ size = 100, animated = true }) => {
  const containerVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const pathVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 2,
        ease: "easeInOut"
      }
    }
  };

  const floatVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  if (!animated) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield Background */}
        <path
          d="M100 10 L180 40 L180 100 C180 150 140 180 100 190 C60 180 20 150 20 100 L20 40 Z"
          fill="url(#greenGradient)"
          stroke="#D4AF37"
          strokeWidth="3"
        />
        
        {/* Crown */}
        <path
          d="M100 50 L85 65 L90 80 L100 75 L110 80 L115 65 Z"
          fill="#D4AF37"
          stroke="#D4AF37"
          strokeWidth="2"
        />
        
        {/* Book */}
        <rect x="75" y="90" width="50" height="40" rx="3" fill="white" stroke="#184A2C" strokeWidth="2" />
        <line x1="100" y1="90" x2="100" y2="130" stroke="#184A2C" strokeWidth="2" />
        <line x1="75" y1="100" x2="100" y2="100" stroke="#184A2C" strokeWidth="1.5" />
        <line x1="100" y1="100" x2="125" y2="100" stroke="#184A2C" strokeWidth="1.5" />
        <line x1="75" y1="110" x2="100" y2="110" stroke="#184A2C" strokeWidth="1.5" />
        <line x1="100" y1="110" x2="125" y2="110" stroke="#184A2C" strokeWidth="1.5" />
        <line x1="75" y1="120" x2="100" y2="120" stroke="#184A2C" strokeWidth="1.5" />
        <line x1="100" y1="120" x2="125" y2="120" stroke="#184A2C" strokeWidth="1.5" />
        
        {/* Arabic Text KKU */}
        <text x="100" y="155" fontSize="16" fill="#D4AF37" textAnchor="middle" fontWeight="bold">جامعة</text>
        <text x="100" y="172" fontSize="14" fill="white" textAnchor="middle" fontWeight="bold">الملك خالد</text>
        
        <defs>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#184A2C" />
            <stop offset="100%" stopColor="#0F3520" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.g variants={floatVariants} animate="animate">
        {/* Shield Background */}
        <motion.path
          d="M100 10 L180 40 L180 100 C180 150 140 180 100 190 C60 180 20 150 20 100 L20 40 Z"
          fill="url(#greenGradient)"
          stroke="#D4AF37"
          strokeWidth="3"
          variants={pathVariants}
          style={{ filter: 'drop-shadow(0 4px 20px rgba(212, 175, 55, 0.3))' }}
        />
        
        {/* Crown */}
        <motion.path
          d="M100 50 L85 65 L90 80 L100 75 L110 80 L115 65 Z"
          fill="#D4AF37"
          stroke="#D4AF37"
          strokeWidth="2"
          variants={pathVariants}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: 1, 
            rotate: 0,
            transition: { 
              delay: 0.5, 
              duration: 0.8,
              type: "spring",
              stiffness: 200
            }
          }}
        />
        
        {/* Book */}
        <motion.rect 
          x="75" 
          y="90" 
          width="50" 
          height="40" 
          rx="3" 
          fill="white" 
          stroke="#184A2C" 
          strokeWidth="2"
          variants={pathVariants}
          initial={{ scaleY: 0 }}
          animate={{ 
            scaleY: 1,
            transition: { delay: 0.8, duration: 0.5 }
          }}
        />
        <motion.line 
          x1="100" 
          y1="90" 
          x2="100" 
          y2="130" 
          stroke="#184A2C" 
          strokeWidth="2"
          variants={pathVariants}
        />
        <motion.line 
          x1="75" 
          y1="100" 
          x2="100" 
          y2="100" 
          stroke="#184A2C" 
          strokeWidth="1.5"
          variants={pathVariants}
        />
        <motion.line 
          x1="100" 
          y1="100" 
          x2="125" 
          y2="100" 
          stroke="#184A2C" 
          strokeWidth="1.5"
          variants={pathVariants}
        />
        <motion.line 
          x1="75" 
          y1="110" 
          x2="100" 
          y2="110" 
          stroke="#184A2C" 
          strokeWidth="1.5"
          variants={pathVariants}
        />
        <motion.line 
          x1="100" 
          y1="110" 
          x2="125" 
          y2="110" 
          stroke="#184A2C" 
          strokeWidth="1.5"
          variants={pathVariants}
        />
        <motion.line 
          x1="75" 
          y1="120" 
          x2="100" 
          y2="120" 
          stroke="#184A2C" 
          strokeWidth="1.5"
          variants={pathVariants}
        />
        <motion.line 
          x1="100" 
          y1="120" 
          x2="125" 
          y2="120" 
          stroke="#184A2C" 
          strokeWidth="1.5"
          variants={pathVariants}
        />
        
        {/* Arabic Text KKU */}
        <motion.text 
          x="100" 
          y="155" 
          fontSize="16" 
          fill="#D4AF37" 
          textAnchor="middle" 
          fontWeight="bold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { delay: 1.2, duration: 0.5 }
          }}
        >
          جامعة
        </motion.text>
        <motion.text 
          x="100" 
          y="172" 
          fontSize="14" 
          fill="white" 
          textAnchor="middle" 
          fontWeight="bold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { delay: 1.4, duration: 0.5 }
          }}
        >
          الملك خالد
        </motion.text>
      </motion.g>
      
      <defs>
        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#184A2C" />
          <stop offset="100%" stopColor="#0F3520" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};
