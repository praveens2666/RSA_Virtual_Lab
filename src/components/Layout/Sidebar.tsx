import React from 'react';
import { motion } from 'framer-motion';
import { Key, Lock, Shield, Calculator, Target, BookOpen, BarChart3, Users } from 'lucide-react';
import { useLabContext } from '../../contexts/LabContext';

const modules = [
  { id: 'key-generation', name: 'Key Generation', icon: Key },
  { id: 'key-generation-sim', name: 'Key Generation (Sim)', icon: Key },
  { id: 'encryption', name: 'Encryption', icon: Lock },
  { id: 'signatures', name: 'Signatures', icon: Shield },
  { id: 'tools', name: 'Number Theory', icon: Calculator },
  { id: 'exercises', name: 'Exercises', icon: BookOpen },

  { id: 'messaging', name: 'Secure Messaging', icon: Users }
];

export function Sidebar() {
  const { state, setCurrentModule } = useLabContext();

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 h-screen overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-2">RSA Virtual Lab</h1>
        <p className="text-gray-400 text-sm">Interactive Cryptography Learning</p>
      </div>

      <nav className="px-3">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = state.currentModule === module.id;
          
          return (
            <motion.button
              key={module.id}
              onClick={() => setCurrentModule(module.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={20} />
              <span className="font-medium">{module.name}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="p-4 mt-8 border-t border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Session Progress</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Keys Generated</span>
            <span className="text-white">{state.sessionProgress.keysGenerated}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Messages Encrypted</span>
            <span className="text-white">{state.sessionProgress.messagesEncrypted}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Signatures Created</span>
            <span className="text-white">{state.sessionProgress.signaturesCreated}</span>
          </div>
        </div>
      </div>
    </div>
  );
}