import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Hash, Target, Zap } from 'lucide-react';
import { gcdWithSteps, primalityTestWithSteps, modPowWithSteps, primeFactorization } from '../../utils/numberTheory';
import BigInteger from 'big-integer';

export function NumberTheoryTools() {
  const [activeTab, setActiveTab] = useState('gcd');
  
  const tabs = [
    { id: 'gcd', name: 'GCD Calculator', icon: Calculator },
    { id: 'primality', name: 'Primality Test', icon: Target },
    { id: 'modpow', name: 'Modular Exponentiation', icon: Zap },
    { id: 'factorization', name: 'Prime Factorization', icon: Hash }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Calculator className="text-blue-600" size={32} />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Number Theory Tools</h2>
            <p className="text-gray-600">Interactive mathematical tools for understanding RSA</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon size={16} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'gcd' && <GCDCalculator />}
        {activeTab === 'primality' && <PrimalityTest />}
        {activeTab === 'modpow' && <ModularExponentiation />}
        {activeTab === 'factorization' && <PrimeFactorization />}
      </div>
    </div>
  );
}

function GCDCalculator() {
  const [a, setA] = useState('391');
  const [b, setB] = useState('299');
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateGCD = () => {
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const bigA = BigInteger(a);
        const bigB = BigInteger(b);
        const gcdResult = gcdWithSteps(bigA, bigB);
        setResult(gcdResult);
      } catch (error) {
        console.error('GCD calculation failed:', error);
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Number (a)</label>
          <input
            type="text"
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Second Number (b)</label>
          <input
            type="text"
            value={b}
            onChange={(e) => setB(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-end">
          <motion.button
            onClick={calculateGCD}
            disabled={isCalculating}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isCalculating ? 'Calculating...' : 'Calculate GCD'}
          </motion.button>
        </div>
      </div>

      {result && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            GCD({a}, {b}) = {result.gcd}
          </h3>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Euclidean Algorithm Steps:</h4>
            {result.steps.map((step: any, index: number) => (
              <div key={index} className="bg-white border border-gray-200 rounded p-3">
                <code className="text-sm">{step.equation}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PrimalityTest() {
  const [number, setNumber] = useState('982451653');
  const [result, setResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testPrimality = () => {
    setIsTesting(true);
    setTimeout(() => {
      try {
        const bigNum = BigInteger(number);
        const testResult = primalityTestWithSteps(bigNum);
        setResult(testResult);
      } catch (error) {
        console.error('Primality test failed:', error);
      } finally {
        setIsTesting(false);
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number to Test</label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-end">
          <motion.button
            onClick={testPrimality}
            disabled={isTesting}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isTesting ? 'Testing...' : 'Test Primality'}
          </motion.button>
        </div>
      </div>

      {result && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className={`text-lg font-semibold mb-4 ${result.isPrime ? 'text-green-600' : 'text-red-600'}`}>
            {number} is {result.isPrime ? 'probably PRIME' : 'COMPOSITE'}
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Method used:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {result.method}
              </span>
            </div>
            
            <h4 className="font-medium text-gray-800">Test Steps:</h4>
            {result.steps.map((step: string, index: number) => (
              <div key={index} className="bg-white border border-gray-200 rounded p-3">
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModularExponentiation() {
  const [base, setBase] = useState('3');
  const [exponent, setExponent] = useState('7');
  const [modulus, setModulus] = useState('13');
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showTable, setShowTable] = useState(true);

  const calculateModPow = () => {
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const bigBase = BigInteger(base);
        const bigExp = BigInteger(exponent);
        const bigMod = BigInteger(modulus);
        const modPowResult = modPowWithSteps(bigBase, bigExp, bigMod);
        setResult(modPowResult);
      } catch (error) {
        console.error('Modular exponentiation failed:', error);
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Base</label>
          <input
            type="text"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Exponent</label>
          <input
            type="text"
            value={exponent}
            onChange={(e) => setExponent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Modulus</label>
          <input
            type="text"
            value={modulus}
            onChange={(e) => setModulus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-end">
          <motion.button
            onClick={calculateModPow}
            disabled={isCalculating}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isCalculating ? 'Computing...' : 'Compute'}
          </motion.button>
        </div>
      </div>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showTable}
            onChange={(e) => setShowTable(e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700">Show calculation table</span>
        </label>
      </div>

      {result && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {base}^{exponent} mod {modulus} = {result.result}
          </h3>
          
          {showTable ? (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Square-and-Multiply Table:</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left">Step</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Binary Bit</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Operation</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tableSteps?.map((step: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-3 py-2">{step.step}</td>
                        <td className="border border-gray-300 px-3 py-2 font-mono">{step.bit}</td>
                        <td className="border border-gray-300 px-3 py-2 font-mono text-xs">{step.operation}</td>
                        <td className="border border-gray-300 px-3 py-2 font-mono">{step.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Square-and-Multiply Steps:</h4>
              {result.steps.map((step: string, index: number) => (
                <div key={index} className="bg-white border border-gray-200 rounded p-3">
                  <code className="text-sm">{step}</code>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PrimeFactorization() {
  const [number, setNumber] = useState('315');
  const [result, setResult] = useState<any>(null);
  const [isFactorizing, setIsFactorizing] = useState(false);

  const factorizeNumber = () => {
    setIsFactorizing(true);
    setTimeout(() => {
      try {
        const bigNum = BigInteger(number);
        const factorResult = primeFactorization(bigNum);
        setResult(factorResult);
      } catch (error) {
        console.error('Factorization failed:', error);
      } finally {
        setIsFactorizing(false);
      }
    }, 100);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number to Factorize</label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-end">
          <motion.button
            onClick={factorizeNumber}
            disabled={isFactorizing}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isFactorizing ? 'Factorizing...' : 'Factorize'}
          </motion.button>
        </div>
      </div>

      {result && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Prime Factorization of {number}
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-4">
              <h4 className="font-medium text-gray-800 mb-2">Result:</h4>
              <p className="text-lg">
                {number} = {result.factors.join(' × ')}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Factorization Steps:</h4>
              {result.steps.map((step: string, index: number) => (
                <div key={index} className="bg-white border border-gray-200 rounded p-3">
                  <p className="text-sm">{step}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h5 className="font-medium text-blue-800 mb-2">Security Implication:</h5>
              <p className="text-sm text-blue-700">
                {result.factors.length > 1 
                  ? `This number has ${result.factors.length} prime factors. If this were an RSA modulus, knowing these factors would allow an attacker to compute the private key and break the encryption.`
                  : 'This number is prime and cannot be factored further. Prime numbers are the building blocks of RSA security.'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}