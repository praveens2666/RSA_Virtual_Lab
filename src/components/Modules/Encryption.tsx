import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Copy, FileUp, FileDown, AlertTriangle } from 'lucide-react';
import { rsaEncrypt, rsaDecrypt } from '../../utils/rsa';
import { useLabContext } from '../../contexts/LabContext';

export function Encryption() {
  const [message, setMessage] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encFileKey, setEncFileKey] = useState<string>('');
  const [aesFileCiphertext, setAesFileCiphertext] = useState<string>('');
  const [fileIv, setFileIv] = useState<string>('');
  const [fileMeta, setFileMeta] = useState<{ name?: string; type?: string; size?: number }>({});
  const [encryptedPackageJson, setEncryptedPackageJson] = useState<string>('');
  const [decryptedFileUrl, setDecryptedFileUrl] = useState<string>('');
  const [decryptedFileName, setDecryptedFileName] = useState<string>('');
  const [isEncryptingFile, setIsEncryptingFile] = useState(false);
  const [isDecryptingFile, setIsDecryptingFile] = useState(false);
  const [selectedKeyPair, setSelectedKeyPair] = useState<any>(null);
  const [selectedKeyPairId, setSelectedKeyPairId] = useState<number | ''>('');
  const [showSteps, setShowSteps] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState('');

  const { state, incrementProgress } = useLabContext();

  const handleEncrypt = async () => {
    if (!message.trim() || !selectedKeyPair) {
      setError('Please enter a message and select a key pair');
      return;
    }

    setIsEncrypting(true);
    setError('');
    
    try {
      const encrypted = rsaEncrypt(message, selectedKeyPair.publicKey);
      setCiphertext(encrypted);
      incrementProgress('messagesEncrypted');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsEncrypting(false);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const base64ToArrayBuffer = (b64: string) => {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  };

  const bytesToHex = (b: Uint8Array) => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
  const hexToBytes = (hex: string) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes;
  };

  const handleFileEncrypt = async () => {
    if (!selectedFile || !selectedKeyPair) {
      setError('Select a file and a key pair to encrypt');
      return;
    }
    setIsEncryptingFile(true);
    setError('');
    try {
      const fileBuf = await selectedFile.arrayBuffer();

      // AES key
      const aesKeyBytes = new Uint8Array(32);
      crypto.getRandomValues(aesKeyBytes);
      const aesKey = await crypto.subtle.importKey('raw', aesKeyBytes.buffer, { name: 'AES-GCM' }, false, ['encrypt']);

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, fileBuf);

      const cipherB64 = arrayBufferToBase64(cipherBuf);
      const ivB64 = arrayBufferToBase64(iv.buffer);

      const keyHex = bytesToHex(aesKeyBytes);
      const wrappedKey = rsaEncrypt(keyHex, selectedKeyPair.publicKey);

      setEncFileKey(wrappedKey);
      setAesFileCiphertext(cipherB64);
      setFileIv(ivB64);
      setFileMeta({ name: selectedFile.name, type: selectedFile.type, size: selectedFile.size });

      // create packaged JSON for download/share
      const pkg = JSON.stringify({ encKey: wrappedKey, iv: ivB64, ciphertext: cipherB64, filename: selectedFile.name, filetype: selectedFile.type });
      setEncryptedPackageJson(pkg);
      incrementProgress('filesEncrypted');
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setIsEncryptingFile(false);
    }
  };

  const handleFileDecrypt = async () => {
    if (!encFileKey || !aesFileCiphertext || !selectedKeyPair) {
      setError('No encrypted package available or no key selected');
      return;
    }
    setIsDecryptingFile(true);
    setError('');
    try {
      const keyHex = rsaDecrypt(encFileKey, selectedKeyPair.privateKey);
      const keyBytes = hexToBytes(keyHex);
      const cryptoKey = await crypto.subtle.importKey('raw', keyBytes.buffer, { name: 'AES-GCM' }, false, ['decrypt']);

      const cipherBuf = base64ToArrayBuffer(aesFileCiphertext);
      const ivBuf = base64ToArrayBuffer(fileIv);
      const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(ivBuf) }, cryptoKey, cipherBuf as ArrayBuffer);

      const blob = new Blob([plainBuf], { type: fileMeta.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      setDecryptedFileUrl(url);
      setDecryptedFileName(fileMeta.name || 'download');
      incrementProgress('filesDecrypted');
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setIsDecryptingFile(false);
    }
  };

  const handleDecrypt = async () => {
    if (!ciphertext.trim() || !selectedKeyPair) {
      setError('Please enter ciphertext and select a key pair');
      return;
    }

    setIsDecrypting(true);
    setError('');
    
    try {
      const decrypted = rsaDecrypt(ciphertext, selectedKeyPair.privateKey);
      setDecryptedMessage(decrypted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Lock className="text-blue-600" size={32} />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">RSA Encryption & Decryption</h2>
            <p className="text-gray-600">Encrypt and decrypt messages using RSA keys</p>
          </div>
        </div>

        {/* Key Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Key Pair
          </label>
          {state.keyPairs.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="text-yellow-500 mr-3" size={20} />
                <p className="text-yellow-800">
                  No key pairs available. Please generate a key pair first in the Key Generation module.
                </p>
              </div>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="flex items-center space-x-2 mb-6">
              <input
                type="checkbox"
                id="showEncryptionSteps"
                checked={showSteps}
                onChange={(e) => setShowSteps(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showEncryptionSteps" className="text-sm text-gray-700">
                Show encryption/decryption steps
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Encryption Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                    <Lock className="mr-2" size={20} />
                    Encryption
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message to Encrypt
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter your message here..."
                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <motion.button
                      onClick={handleEncrypt}
                      disabled={isEncrypting || !message.trim()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isEncrypting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Encrypting...</span>
                        </>
                      ) : (
                        <>
                          <Lock size={16} />
                          <span>Encrypt Message</span>
                        </>
                      )}
                    </motion.button>

                    {ciphertext && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Ciphertext
                          </label>
                          <button
                            onClick={() => copyToClipboard(ciphertext)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <Copy size={12} />
                            <span>Copy</span>
                          </button>
                        </div>
                        <textarea
                          value={ciphertext}
                          readOnly
                          className="w-full h-24 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-xs"
                        />
                      </div>
                    )}

                    {showSteps && ciphertext && (
                      <div className="bg-white border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">Encryption Process</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><code>c = m^e mod n</code></p>
                          <p>where:</p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li><code>m</code> = message as number</li>
                            <li><code>e</code> = {selectedKeyPair.publicKey.e} (public exponent)</li>
                            <li><code>n</code> = {selectedKeyPair.publicKey.n.slice(0, 20)}... (modulus)</li>
                            <li><code>c</code> = {ciphertext.slice(0, 20)}... (ciphertext)</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                    <Unlock className="mr-2" size={20} />
                    Decryption
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ciphertext to Decrypt
                      </label>
                      <textarea
                        value={ciphertext}
                        onChange={(e) => setCiphertext(e.target.value)}
                        placeholder="Enter ciphertext here or encrypt a message above..."
                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-xs"
                      />
                    </div>

                    <motion.button
                      onClick={handleDecrypt}
                      disabled={isDecrypting || !ciphertext.trim()}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isDecrypting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Decrypting...</span>
                        </>
                      ) : (
                        <>
                          <Unlock size={16} />
                          <span>Decrypt Message</span>
                        </>
                      )}
                    </motion.button>

                    {decryptedMessage && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Decrypted Message
                          </label>
                          <button
                            onClick={() => copyToClipboard(decryptedMessage)}
                            className="text-xs text-green-600 hover:text-green-800 flex items-center space-x-1"
                          >
                            <Copy size={12} />
                            <span>Copy</span>
                          </button>
                        </div>
                        <div className="w-full p-3 bg-green-100 border border-green-300 rounded-lg">
                          <p className="text-green-800">{decryptedMessage}</p>
                        </div>
                      </div>
                    )}

                    {showSteps && decryptedMessage && (
                      <div className="bg-white border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">Decryption Process</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><code>m = c^d mod n</code></p>
                          <p>where:</p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li><code>c</code> = {ciphertext.slice(0, 20)}... (ciphertext)</li>
                            <li><code>d</code> = private exponent</li>
                            <li><code>n</code> = {selectedKeyPair.publicKey.n.slice(0, 20)}... (modulus)</li>
                            <li><code>m</code> = decrypted message</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* File Operations */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">File Operations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select file to encrypt</label>
                  <input type="file" onChange={(e) => setSelectedFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} className="block w-full text-sm text-gray-700 mb-2" />
                  {selectedFile && <div className="text-xs text-gray-500 mb-2">{selectedFile.name} · {Math.round(selectedFile.size/1024)} KB</div>}
                  <button onClick={handleFileEncrypt} disabled={isEncryptingFile || !selectedFile} className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <FileUp size={16} />
                    <span>{isEncryptingFile ? 'Encrypting...' : 'Encrypt File'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Encrypted package / Decrypt</label>
                  <div className="space-y-2">
                    <textarea readOnly value={encryptedPackageJson} className="w-full h-28 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-xs" />
                    <div className="flex space-x-2">
                      <a href={`data:application/json;base64,${btoa(encryptedPackageJson)}`} download={`encrypted-package-${Date.now()}.json`} className={`px-3 py-2 bg-gray-200 rounded text-sm ${!encryptedPackageJson ? 'opacity-40 pointer-events-none' : ''}`}>Download Package</a>
                      <button onClick={handleFileDecrypt} disabled={isDecryptingFile || !encryptedPackageJson || !selectedKeyPair} className="px-3 py-2 bg-purple-600 text-white rounded text-sm">
                        {isDecryptingFile ? 'Decrypting...' : <><FileDown size={14} /> <span className="ml-2">Decrypt File</span></>}
                      </button>
                    </div>
                    {decryptedFileUrl && (
                      <div className="mt-2">
                        <a href={decryptedFileUrl} download={decryptedFileName} className="text-indigo-600 underline">Download Decrypted File</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}