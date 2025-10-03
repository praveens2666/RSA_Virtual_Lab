import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, AlertTriangle, Clock, Zap, Shield } from 'lucide-react';
import { factorizeSmallNumber, generateRSAKeyPair } from '../../utils/rsa';
import { useLabContext } from '../../contexts/LabContext';
import BigInteger from 'big-integer';

export function AttackDemonstrations() {
  const [activeDemo, setActiveDemo] = useState('small-prime');
  const [factorizationResult, setFactorizationResult] = useState<any>(null);
  const [isFactorizing, setIsFactorizing] = useState(false);
  const [customModulus, setCustomModulus] = useState('323');
  const [weakKeyDemo, setWeakKeyDemo] = useState<any>(null);

  const { addBadge } = useLabContext();

  const demos = [
    { id: 'small-prime', name: 'Small Prime Attack', icon: Target },
    { id: 'weak-params', name: 'Weak Parameters', icon: AlertTriangle },
    { id: 'timing', name: 'Timing Analysis', icon: Clock },
    { id: 'common-modulus', name: 'Common Modulus Attack', icon: Zap }
  ];

  const handleFactorization = async () => {
    setIsFactorizing(true);
    try {
      const n = BigInteger(customModulus);
      const result = factorizeSmallNumber(n);
      setFactorizationResult(result);
      
      if (result.p && result.q) {
        addBadge({
          id: 'crypto-breaker',
          name: 'Crypto Breaker',
          description: 'Successfully factorize a small RSA modulus',
          icon: '💥',
          earned: true
        });
      }
    } catch (error) {
      console.error('Factorization failed:', error);
    } finally {
      setIsFactorizing(false);
    }
  };

  const generateWeakKey = () => {
    // Generate a key with small primes for demonstration
    const result = generateRSAKeyPair(512, true);
    setWeakKeyDemo(result);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="text-red-600" size={32} />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Attack Demonstrations</h2>
            <p className="text-gray-600">Educational demonstrations of RSA vulnerabilities</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
          <div className="flex">
            <AlertTriangle className="text-red-400 mr-3 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-medium text-red-800">⚠️ Educational Purpose Only</h3>
              <p className="text-sm text-red-700 mt-1">
                These demonstrations show why proper RSA implementation is crucial. 
                Never use small primes or weak parameters in real cryptographic systems.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8">
          {demos.map((demo) => {
            const Icon = demo.icon;
            return (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeDemo === demo.id
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon size={16} />
                <span>{demo.name}</span>
              </button>
            );
          })}
        </div>

        {/* Demo Content */}
        {activeDemo === 'small-prime' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-yellow-800 mb-4">Small Prime Factorization Attack</h3>
              <p className="text-yellow-700 mb-4">
                When RSA uses small primes, the modulus n = p × q can be factorized quickly using trial division.
                This completely breaks the security of RSA.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RSA Modulus to Factorize
                  </label>
                  <input
                    type="text"
                    value={customModulus}
                    onChange={(e) => setCustomModulus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter a number to factorize..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Try: 323, 1073, 2021, or any small composite number
                  </p>
                </div>
                <div className="flex items-end">
                  <motion.button
                    onClick={handleFactorization}
                    disabled={isFactorizing}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isFactorizing ? 'Factorizing...' : 'Start Attack'}
                  </motion.button>
                </div>
              </div>

              {factorizationResult && (
                <div className="bg-white border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Attack Results</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Time taken:</span>
                      <span className="font-mono">{factorizationResult.time}ms</span>
                    </div>
                    {factorizationResult.p && factorizationResult.q ? (
                      <div className="bg-red-100 border border-red-300 rounded p-3">
                        <p className="text-red-800 font-medium">✅ Factorization Successful!</p>
                        <p className="text-sm text-red-700">
                          {customModulus} = {factorizationResult.p.toString()} × {factorizationResult.q.toString()}
                        </p>
                        <p className="text-xs text-red-600 mt-2">
                          With these factors, an attacker can compute the private key and decrypt all messages!
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-100 border border-green-300 rounded p-3">
                        <p className="text-green-800 font-medium">✅ Number appears to be prime or too large</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-700 mb-2">Attack Steps:</h5>
                    <div className="space-y-1">
                      {factorizationResult.steps.map((step: string, index: number) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeDemo === 'weak-params' && (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-orange-800 mb-4">Weak Parameter Demonstration</h3>
              <p className="text-orange-700 mb-4">
                This demonstrates what happens when RSA is implemented with weak parameters like e=1, 
                small key sizes, or predictable primes.
              </p>
              
              <motion.button
                onClick={generateWeakKey}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 mb-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Generate Weak RSA Key (512-bit)
              </motion.button>

              {weakKeyDemo && (
                <div className="bg-white border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Weak Key Analysis</h4>
                  <div className="space-y-3">
                    <div className="bg-red-100 border border-red-300 rounded p-3">
                      <p className="text-red-800 font-medium">⚠️ Security Issues Detected:</p>
                      <ul className="text-sm text-red-700 mt-2 space-y-1">
                        <li>• Key size too small (512 bits) - vulnerable to factorization</li>
                        <li>• Can be broken by modern computers in reasonable time</li>
                        <li>• Not suitable for any real-world cryptographic use</li>
                      </ul>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Key Size:</span>
                        <p className="font-mono text-red-600">{weakKeyDemo.keyPair.publicKey.bits} bits (WEAK)</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Public Exponent:</span>
                        <p className="font-mono">{weakKeyDemo.keyPair.publicKey.e}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeDemo === 'timing' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">Timing Analysis Attack</h3>
              <p className="text-blue-700 mb-4">
                Timing attacks exploit variations in computation time to extract information about private keys.
                This is why constant-time implementations are crucial.
              </p>
              
              <div className="bg-white border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Timing Attack Simulation</h4>
                <p className="text-sm text-gray-600 mb-4">
                  In a real timing attack, an attacker would measure the time it takes to perform 
                  cryptographic operations and use statistical analysis to recover key bits.
                </p>
                
                <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                  <p className="text-yellow-800 text-sm">
                    <strong>Mitigation:</strong> Use constant-time algorithms, add random delays, 
                    or implement blinding techniques to prevent timing analysis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDemo === 'common-modulus' && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-purple-800 mb-4">Common Modulus Attack</h3>
              <p className="text-purple-700 mb-4">
                When the same modulus n is used with different public exponents, 
                an attacker can decrypt messages without knowing the private key.
              </p>
              
              <div className="bg-white border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Attack Scenario</h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>1. Alice and Bob use the same modulus n but different public exponents e₁ and e₂</p>
                  <p>2. The same message m is encrypted to both: c₁ = m^e₁ mod n, c₂ = m^e₂ mod n</p>
                  <p>3. If gcd(e₁, e₂) = 1, an attacker can recover m using the extended Euclidean algorithm</p>
                  <p>4. The attack works by finding integers a and b such that: a·e₁ + b·e₂ = 1</p>
                  <p>5. Then: m = c₁^a · c₂^b mod n</p>
                </div>
                
                <div className="bg-red-100 border border-red-300 rounded p-3 mt-4">
                  <p className="text-red-800 text-sm">
                    <strong>Prevention:</strong> Never reuse the same modulus with different key pairs. 
                    Each key pair should have its own unique modulus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Best Practices */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="text-green-600" size={24} />
            <h3 className="text-xl font-semibold text-green-800">Security Best Practices</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-700 mb-2">Key Generation</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Use at least 2048-bit keys (4096-bit for high security)</li>
                <li>• Generate cryptographically secure random primes</li>
                <li>• Ensure p and q are sufficiently different</li>
                <li>• Use standard public exponents (65537)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-green-700 mb-2">Implementation</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Use constant-time algorithms</li>
                <li>• Implement proper padding (OAEP, PSS)</li>
                <li>• Never reuse moduli between key pairs</li>
                <li>• Regularly update and rotate keys</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}