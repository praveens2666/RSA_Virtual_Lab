import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Download, Eye, EyeOff, Clock, Info } from 'lucide-react';
import { generateRSAKeyPair, RSAKeyPair, KeyGenerationSteps } from '../../utils/rsa';
import { useLabContext } from '../../contexts/LabContext';

export function KeyGeneration() {
  const [bitLength, setBitLength] = useState(1024);
  const [showSteps, setShowSteps] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyPair, setKeyPair] = useState<RSAKeyPair | null>(null);
  const [steps, setSteps] = useState<KeyGenerationSteps | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [generationTime, setGenerationTime] = useState<number>(0);

  const { addKeyPair, incrementProgress, addBadge } = useLabContext();

  const handleGenerateKeys = async () => {
    setIsGenerating(true);
    const startTime = Date.now();
    
    setTimeout(() => {
      try {
        const result = generateRSAKeyPair(bitLength, showSteps);
        setKeyPair(result.keyPair);
        setSteps(result.steps || null);
        setGenerationTime(Date.now() - startTime);
        
        addKeyPair(result.keyPair);
        incrementProgress('keysGenerated');
        
        // Award badge for first key generation
        addBadge({
          id: 'first-key',
          name: 'Key Generator',
          description: 'Generate your first RSA key pair',
          icon: '🔑',
          earned: true
        });

        if (bitLength >= 2048) {
          addBadge({
            id: 'prime-hunter',
            name: 'Prime Hunter',
            description: 'Generate a 2048-bit prime number',
            icon: '🎯',
            earned: true
          });
        }
      } catch (error) {
        console.error('Key generation failed:', error);
      } finally {
        setIsGenerating(false);
      }
    }, 100); // Small delay to show loading state
  };

  const downloadKeys = () => {
    if (!keyPair) return;
    
    const keyData = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      generated: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(keyData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rsa-keys-${bitLength}bit.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Key className="text-blue-600" size={32} />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">RSA Key Generation</h2>
            <p className="text-gray-600">Generate cryptographically secure RSA key pairs</p>
          </div>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Size (bits)
              </label>
              <select
                value={bitLength}
                onChange={(e) => setBitLength(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              >
                <option value={512}>512 bits (Demo only - Insecure)</option>
                <option value={1024}>1024 bits (Legacy)</option>
                <option value={2048}>2048 bits (Recommended)</option>
                <option value={4096}>4096 bits (High Security)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showSteps"
                checked={showSteps}
                onChange={(e) => setShowSteps(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isGenerating}
              />
              <label htmlFor="showSteps" className="text-sm text-gray-700">
                Show step-by-step generation process
              </label>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <motion.button
              onClick={handleGenerateKeys}
              disabled={isGenerating}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Key size={20} />
                  <span>Generate Key Pair</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Security Warning */}
        {bitLength < 2048 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <Info className="text-yellow-400 mr-3 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Security Warning</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Keys smaller than 2048 bits are not recommended for production use. 
                  Use them only for educational purposes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Generation Steps */}
        <AnimatePresence>
          {steps && showSteps && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-lg p-6 mb-8"
            >
              <h3 className="text-xl font-semibold mb-4">Generation Steps</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900">Step 1: Generate Prime Numbers</h4>
                  <p className="text-sm text-gray-600">p = {steps.step1.p.slice(0, 50)}...</p>
                  <p className="text-sm text-gray-600">q = {steps.step1.q.slice(0, 50)}...</p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-900">Step 2: Compute Modulus</h4>
                  <p className="text-sm text-gray-600 font-mono">{steps.step2.calculation}</p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium text-gray-900">Step 3: Euler's Totient Function</h4>
                  <p className="text-sm text-gray-600 font-mono">{steps.step3.calculation}</p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium text-gray-900">Step 4: Choose Public Exponent</h4>
                  <p className="text-sm text-gray-600">e = {steps.step4.e}</p>
                  <p className="text-xs text-gray-500">{steps.step4.reason}</p>
                </div>
                
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-gray-900">Step 5: Compute Private Exponent</h4>
                  <p className="text-sm text-gray-600 font-mono">{steps.step5.calculation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Keys */}
        <AnimatePresence>
          {keyPair && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Generated Key Pair</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{generationTime}ms</span>
                  </div>
                  <button
                    onClick={downloadKeys}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Download size={16} />
                    <span>Download Keys</span>
                  </button>
                </div>
              </div>

              {/* Public Key */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-3">Public Key (Share freely)</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-green-700">Modulus (n)</label>
                      <div className="bg-white border border-green-300 rounded px-3 py-2">
                        <code className="text-xs break-all">
                          {keyPair.publicKey.n.slice(0, 100)}...
                        </code>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-700">Public Exponent (e)</label>
                      <div className="bg-white border border-green-300 rounded px-3 py-2">
                        <code className="text-xs">{keyPair.publicKey.e}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Private Key */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-red-800">Private Key (Keep secret!)</h4>
                  <button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showPrivateKey ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                
                {showPrivateKey && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-red-700">Modulus (n)</label>
                        <div className="bg-white border border-red-300 rounded px-3 py-2">
                          <code className="text-xs break-all">
                            {keyPair.privateKey.n.slice(0, 100)}...
                          </code>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-red-700">Private Exponent (d)</label>
                        <div className="bg-white border border-red-300 rounded px-3 py-2">
                          <code className="text-xs break-all">
                            {keyPair.privateKey.d.slice(0, 100)}...
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Key Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Key Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Key Size:</span>
                    <p className="font-mono">{keyPair.publicKey.bits} bits</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Prime p:</span>
                    <p className="font-mono">{keyPair.primes.p.slice(0, 20)}...</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Prime q:</span>
                    <p className="font-mono">{keyPair.primes.q.slice(0, 20)}...</p>
                  </div>
                  <div>
                    <span className="text-gray-600">φ(n):</span>
                    <p className="font-mono">{keyPair.phi.slice(0, 20)}...</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}