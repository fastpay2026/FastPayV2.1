import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../i18n/i18n';

interface NotificationProps {
  title: string;
  message: string;
  type: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ title, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: -20, x: 20 }}
        className="fixed top-4 right-4 z-[1000] bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl text-white max-w-sm"
      >
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs opacity-80">{message}</p>
      </motion.div>
    </AnimatePresence>
  );
};

export default Notification;
