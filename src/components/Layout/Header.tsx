import React from 'react';
import { motion } from 'framer-motion';
import { Award, Trophy, Star } from 'lucide-react';
import { useLabContext } from '../../contexts/LabContext';

export function Header() {
  const { state } = useLabContext();
  const earnedBadges = state.badges.filter(b => b.earned);
  
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 capitalize">
            {state.currentModule.replace('-', ' ')} Lab
          </h2>
          <p className="text-gray-600">Interactive RSA Cryptography Learning Platform</p>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-medium text-gray-700">
              {earnedBadges.length}/{state.badges.length} Badges
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {earnedBadges.slice(0, 3).map((badge) => (
              <motion.div
                key={badge.id}
                className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full"
                whileHover={{ scale: 1.1 }}
                title={badge.name}
              >
                <span className="text-sm">{badge.icon}</span>
              </motion.div>
            ))}
            {earnedBadges.length > 3 && (
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                <span className="text-xs text-gray-600">+{earnedBadges.length - 3}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}