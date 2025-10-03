import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, CheckCircle, XCircle, Hash, Copy } from 'lucide-react';
import { rsaSign, rsaVerify } from '../../utils/rsa';
import { useLabContext } from '../../contexts/LabContext';
import CryptoJS from 'crypto-js';

export function DigitalSignatures() {
  const [message, setMessage] = useState('This is a secure message from Alice.');
  const [signature, setSignature] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationSignature, setVerificationSignature] = useState('');
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [selectedKeyPair, setSelectedKeyPair] = useState<any>(null);
  const [selectedKeyPairId, setSelectedKeyPairId] = useState<number | ''>('');
  const [hashAlgorithm, setHashAlgorithm] = useState('SHA-256');
  const [showSteps, setShowSteps] = useState(false);
  const [isSigningLoading, setIsSigningLoading] = useState(false);
  const [isVerifyingLoading, setIsVerifyingLoading] = useState(false);

  const { state, incrementProgress } = useLabContext();

  const hashMessage = (msg: string, algorithm: string): string => {
    switch (algorithm) {
      case 'SHA-1':
        return CryptoJS.SHA1(msg).toString();
      case 'SHA-256':
        return CryptoJS.SHA256(msg).toString();
      case 'SHA-512':
        return CryptoJS.SHA512(msg).toString();
      default:
        return CryptoJS.SHA256(msg).toString();
    }
  };

  const handleSign = async () => {
    if (!message.trim() || !selectedKeyPair) return;

    setIsSigningLoading(true);
    try {
      const sig = await rsaSign(message, selectedKeyPair.privateKey);
      setSignature(sig);
      incrementProgress('signaturesCreated');
    } catch (error) {
      console.error('Signing failed:', error);
    } finally {
      setIsSigningLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationMessage.trim() || !verificationSignature.trim() || !selectedKeyPair) return;

    setIsVerifyingLoading(true);
    try {
      const isValid = await rsaVerify(verificationMessage, verificationSignature, selectedKeyPair.publicKey);
      setVerificationResult(isValid);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult(false);
    } finally {
      setIsVerifyingLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="text-green-600" size={32} />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Digital Signatures</h2>
            <p className="text-gray-600">Create and verify digital signatures using RSA</p>
          </div>
        </div>

        {/* Key Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Key Pair
          </label>
          {state.keyPairs.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                No key pairs available. Please generate a key pair first in the Key Generation module.
              </p>
            </div>
          ) : (
            <select
              value={selectedKeyPairId || ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedKeyPairId(id || '');
                const entry = state.keyPairs.find(kp => kp.id === id);
                setSelectedKeyPair(entry ? entry.keyPair : null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select a key pair...</option>
              {state.keyPairs.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.keyPair.publicKey.bits}-bit RSA Key (Generated: {new Date(entry.id).toLocaleTimeString()})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedKeyPair && (
          <>
            {/* Hash Algorithm Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hash Algorithm
              </label>
              <select
                value={hashAlgorithm}
                onChange={(e) => setHashAlgorithm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="SHA-1">SHA-1 (Legacy)</option>
                <option value="SHA-256">SHA-256 (Recommended)</option>
                <option value="SHA-512">SHA-512 (High Security)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 mb-6">
              <input
                type="checkbox"
                id="showSignatureSteps"
                checked={showSteps}
                onChange={(e) => setShowSteps(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="showSignatureSteps" className="text-sm text-gray-700">
                Show signature process steps
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Signing Section */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                  <FileText className="mr-2" size={20} />
                  Create Signature
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message to Sign
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your message here..."
                      className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {showSteps && message && (
                    <div className="bg-white border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Message Hash ({hashAlgorithm})</h4>
                      <div className="bg-gray-50 p-2 rounded font-mono text-xs break-all">
                        {hashMessage(message, hashAlgorithm)}
                      </div>
                    </div>
                  )}

                  <motion.button
                    onClick={handleSign}
                    disabled={isSigningLoading || !message.trim()}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSigningLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Signing...</span>
                      </>
                    ) : (
                      <>
                        <Shield size={16} />
                        <span>Create Signature</span>
                      </>
                    )}
                  </motion.button>

                  {signature && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Digital Signature
                        </label>
                        <button
                          onClick={() => copyToClipboard(signature)}
                          className="text-xs text-green-600 hover:text-green-800 flex items-center space-x-1"
                        >
                          <Copy size={12} />
                          <span>Copy</span>
                        </button>
                      </div>
                      <textarea
                        value={signature}
                        readOnly
                        className="w-full h-24 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                  )}

                  {showSteps && signature && (
                    <div className="bg-white border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Signing Process</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><code>s = hash(m)^d mod n</code></p>
                        <p>where:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li><code>m</code> = original message</li>
                          <li><code>hash(m)</code> = {hashAlgorithm} hash of message</li>
                          <li><code>d</code> = private exponent</li>
                          <li><code>n</code> = modulus</li>
                          <li><code>s</code> = digital signature</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Section */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                  <CheckCircle className="mr-2" size={20} />
                  Verify Signature
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Message
                    </label>
                    <textarea
                      value={verificationMessage}
                      onChange={(e) => setVerificationMessage(e.target.value)}
                      placeholder="Enter the original message..."
                      className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signature to Verify
                    </label>
                    <textarea
                      value={verificationSignature}
                      onChange={(e) => setVerificationSignature(e.target.value)}
                      placeholder="Paste the signature here..."
                      className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
                    />
                  </div>

                  <motion.button
                    onClick={handleVerify}
                    disabled={isVerifyingLoading || !verificationMessage.trim() || !verificationSignature.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isVerifyingLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span>Verify Signature</span>
                      </>
                    )}
                  </motion.button>

                  {verificationResult !== null && (
                    <div className={`p-4 rounded-lg border ${
                      verificationResult 
                        ? 'bg-green-100 border-green-300 text-green-800' 
                        : 'bg-red-100 border-red-300 text-red-800'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {verificationResult ? (
                          <CheckCircle className="text-green-600" size={20} />
                        ) : (
                          <XCircle className="text-red-600" size={20} />
                        )}
                        <span className="font-medium">
                          {verificationResult ? 'Signature Valid' : 'Signature Invalid'}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        {verificationResult 
                          ? 'The signature is authentic and the message has not been tampered with.'
                          : 'The signature is invalid or the message has been modified.'
                        }
                      </p>
                    </div>
                  )}

                  {showSteps && verificationResult !== null && (
                    <div className="bg-white border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Verification Process</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><code>hash(m) ?= s^e mod n</code></p>
                        <p>where:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li><code>m</code> = received message</li>
                          <li><code>s</code> = received signature</li>
                          <li><code>e</code> = public exponent</li>
                          <li><code>n</code> = modulus</li>
                        </ul>
                        <p className="mt-2">
                          Result: {verificationResult ? 'Hashes match ✓' : 'Hashes do not match ✗'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Test Section */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Test</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setVerificationMessage(message);
                    setVerificationSignature(signature);
                  }}
                  disabled={!signature}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Hash size={16} />
                  <span>Copy to Verification</span>
                </button>
                <button
                  onClick={() => {
                    setVerificationMessage(message + " (modified)");
                    setVerificationSignature(signature);
                  }}
                  disabled={!signature}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle size={16} />
                  <span>Test with Modified Message</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}