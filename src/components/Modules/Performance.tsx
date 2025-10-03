import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, Zap, Shield, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { generateRSAKeyPair, rsaEncrypt, rsaDecrypt } from '../../utils/rsa';

interface PerformanceData {
  keySize: number;
  keyGenTime: number;
  encryptTime: number;
  decryptTime: number;
}

export function Performance() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [progress, setProgress] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState('keyGenTime');

  const keySizes = [512, 1024, 2048, 4096];
  const testMessage = "Performance test message for RSA encryption and decryption benchmarking.";

  const runPerformanceTests = async () => {
    setIsRunning(true);
    setProgress(0);
    const results: PerformanceData[] = [];

    for (let i = 0; i < keySizes.length; i++) {
      const keySize = keySizes[i];
      setCurrentTest(`Testing ${keySize}-bit keys`);
      setProgress((i / keySizes.length) * 100);

      // Key Generation Test
      const keyGenStart = performance.now();
      const { keyPair } = generateRSAKeyPair(keySize);
      const keyGenTime = performance.now() - keyGenStart;

      // Encryption Test
      const encryptStart = performance.now();
      const ciphertext = rsaEncrypt(testMessage, keyPair.publicKey);
      const encryptTime = performance.now() - encryptStart;

      // Decryption Test
      const decryptStart = performance.now();
      rsaDecrypt(ciphertext, keyPair.privateKey);
      const decryptTime = performance.now() - decryptStart;

      results.push({
        keySize,
        keyGenTime: Math.round(keyGenTime),
        encryptTime: Math.round(encryptTime * 100) / 100,
        decryptTime: Math.round(decryptTime * 100) / 100
      });

      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setPerformanceData(results);
    setProgress(100);
    setCurrentTest('Tests completed');
    setIsRunning(false);
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'keyGenTime': return 'Key Generation Time (ms)';
      case 'encryptTime': return 'Encryption Time (ms)';
      case 'decryptTime': return 'Decryption Time (ms)';
      default: return 'Time (ms)';
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'keyGenTime': return '#3B82F6';
      case 'encryptTime': return '#10B981';
      case 'decryptTime': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  // Sample comparison data for RSA vs AES
  const comparisonData = [
    { operation: 'Key Generation', RSA: 1200, AES: 0.1 },
    { operation: 'Encryption (1KB)', RSA: 15, AES: 0.05 },
    { operation: 'Decryption (1KB)', RSA: 45, AES: 0.05 },
    { operation: 'Encryption (1MB)', RSA: 'N/A', AES: 50 }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="text-purple-600" size={32} />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Performance Analysis</h2>
            <p className="text-gray-600">Benchmark RSA operations across different key sizes</p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">RSA Performance Benchmark</h3>
            <motion.button
              onClick={runPerformanceTests}
              disabled={isRunning}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Running Tests...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Run Performance Tests</span>
                </>
              )}
            </motion.button>
          </div>

          {isRunning && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{currentTest}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {performanceData.length > 0 && (
          <>
            {/* Metric Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Metric to Display
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="keyGenTime">Key Generation Time</option>
                <option value="encryptTime">Encryption Time</option>
                <option value="decryptTime">Decryption Time</option>
              </select>
            </div>

            {/* Performance Chart */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {getMetricLabel(selectedMetric)} vs Key Size
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="keySize" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey={selectedMetric} 
                    fill={getMetricColor(selectedMetric)}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Table */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 px-4">Key Size</th>
                      <th className="text-left py-2 px-4">Key Generation (ms)</th>
                      <th className="text-left py-2 px-4">Encryption (ms)</th>
                      <th className="text-left py-2 px-4">Decryption (ms)</th>
                      <th className="text-left py-2 px-4">Security Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((data) => (
                      <tr key={data.keySize} className="border-b border-gray-200">
                        <td className="py-2 px-4 font-medium">{data.keySize} bits</td>
                        <td className="py-2 px-4">{data.keyGenTime}</td>
                        <td className="py-2 px-4">{data.encryptTime}</td>
                        <td className="py-2 px-4">{data.decryptTime}</td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            data.keySize >= 2048 
                              ? 'bg-green-100 text-green-800' 
                              : data.keySize >= 1024
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {data.keySize >= 2048 ? 'Secure' : data.keySize >= 1024 ? 'Legacy' : 'Insecure'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="text-blue-600" size={20} />
                  <h4 className="font-medium text-blue-800">Key Generation</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Time increases exponentially with key size. 4096-bit keys take significantly longer to generate.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="text-green-600" size={20} />
                  <h4 className="font-medium text-green-800">Encryption</h4>
                </div>
                <p className="text-sm text-green-700">
                  Encryption is relatively fast due to small public exponent (65537).
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="text-orange-600" size={20} />
                  <h4 className="font-medium text-orange-800">Decryption</h4>
                </div>
                <p className="text-sm text-orange-700">
                  Decryption is slower than encryption due to large private exponent.
                </p>
              </div>
            </div>
          </>
        )}

        {/* RSA vs AES Comparison */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="mr-2" size={20} />
            RSA vs AES Performance Comparison
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Performance Characteristics</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span>RSA Key Generation</span>
                  <span className="text-red-600">Slow (seconds)</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span>AES Key Generation</span>
                  <span className="text-green-600">Fast (microseconds)</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span>RSA Encryption</span>
                  <span className="text-yellow-600">Moderate (milliseconds)</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span>AES Encryption</span>
                  <span className="text-green-600">Very Fast (microseconds)</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">Use Cases</h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-100 border border-blue-200 rounded">
                  <h5 className="font-medium text-blue-800">RSA (Asymmetric)</h5>
                  <ul className="text-blue-700 mt-1 space-y-1">
                    <li>• Key exchange and distribution</li>
                    <li>• Digital signatures</li>
                    <li>• Small data encryption</li>
                  </ul>
                </div>
                <div className="p-3 bg-green-100 border border-green-200 rounded">
                  <h5 className="font-medium text-green-800">AES (Symmetric)</h5>
                  <ul className="text-green-700 mt-1 space-y-1">
                    <li>• Bulk data encryption</li>
                    <li>• Real-time communication</li>
                    <li>• File and disk encryption</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h5 className="font-medium text-yellow-800 mb-2">Hybrid Cryptography</h5>
            <p className="text-sm text-yellow-700">
              In practice, RSA and AES are used together: RSA encrypts a random AES key, 
              then AES encrypts the actual data. This combines RSA's key distribution 
              capabilities with AES's speed for bulk encryption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}