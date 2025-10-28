import React from 'react';
import { motion } from 'framer-motion';

// Base Card component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = true 
}) => {
  return (
    <motion.div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      whileHover={hover ? { 
        y: -4, 
        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)'
      } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

// Card Content component
export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

// Card Header component
export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return <div className={`px-6 pt-6 pb-2 ${className}`}>{children}</div>;
};

// Card Title component
export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return <h3 className={`text-xl font-semibold ${className}`}>{children}</h3>;
};