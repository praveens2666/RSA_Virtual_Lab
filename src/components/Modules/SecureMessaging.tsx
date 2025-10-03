import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Send, Key, Lock, Unlock, ArrowRight, MessageCircle } from 'lucide-react';
import { generateRSAKeyPair, rsaEncrypt, rsaDecrypt } from '../../utils/rsa';
import { useLabContext } from '../../contexts/LabContext';

interface User {
  name: string;
  keyPair: any;
  color: string;
}

interface Message {
  id: string;
  from: string;
  to: string;
  // encrypted AES key (RSA-encrypted decimal string)
  encKey: string;
  // AES-GCM ciphertext and iv (base64)
  aesCiphertext: string;
  iv: string;
  // decrypted plaintext cached (optional)
  plaintext?: string;
  // sender original plaintext stored for verification
  senderPlaintext?: string;
  // verification state
  verified?: boolean;
  verifiedAt?: Date;
  verifiedMatches?: boolean;
  timestamp: Date;
}

export function SecureMessaging() {
  const [alice, setAlice] = useState<User | null>(null);
  const [bob, setBob] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedSender, setSelectedSender] = useState<'alice' | 'bob'>('alice');
  const [showEncryption, setShowEncryption] = useState(true);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [autoDecrypt, setAutoDecrypt] = useState(false);
  const [viewAs, setViewAs] = useState<'alice' | 'bob'>('alice');

  const { addBadge } = useLabContext();
  const [decryptingIds, setDecryptingIds] = useState<Record<string, boolean>>({});

  const generateUserKeys = async (user: 'alice' | 'bob') => {
    setIsGeneratingKeys(true);
    
    setTimeout(() => {
      const { keyPair } = generateRSAKeyPair(1024);
      const userData: User = {
        name: user === 'alice' ? 'Alice' : 'Bob',
        keyPair,
        color: user === 'alice' ? 'blue' : 'green'
      };

      if (user === 'alice') {
        setAlice(userData);
      } else {
        setBob(userData);
      }
      
      setIsGeneratingKeys(false);
    }, 500);
  };

  const sendMessage = async () => {
  if (!newMessage.trim() || !alice || !bob) return;

    setIsSending(true);
    const sender = selectedSender === 'alice' ? alice : bob;
    const receiver = selectedSender === 'alice' ? bob : alice;

    try {
        // --- Hybrid encryption ---
        // 1) generate random AES-256 key bytes
        const aesKeyBytes = new Uint8Array(32);
        crypto.getRandomValues(aesKeyBytes);

        // 2) encrypt message with AES-GCM
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const enc = await crypto.subtle.importKey('raw', aesKeyBytes.buffer, { name: 'AES-GCM' }, false, ['encrypt']);
        const encoded = new TextEncoder().encode(newMessage);
        const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, enc, encoded);

        // helper: convert ArrayBuffer to base64
        const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          return btoa(binary);
        };

        const aesCiphertext = arrayBufferToBase64(cipherBuffer);
        const ivB64 = arrayBufferToBase64(iv.buffer);

        // 3) encrypt AES key bytes with receiver's RSA public key (convert key bytes to hex string)
        const bytesToHex = (b: Uint8Array) => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
        const keyHex = bytesToHex(aesKeyBytes);
        const encKey = rsaEncrypt(keyHex, receiver.keyPair.publicKey);

      const message: Message = {
        id: Date.now().toString(),
        from: sender.name,
        to: receiver.name,
        // keep sender's original plaintext so sender can view/verify
        senderPlaintext: newMessage,
        encKey,
        aesCiphertext,
        iv: ivB64,
        timestamp: new Date()
      };

  setMessages(prev => [...prev, message]);
  setNewMessage('');

      // Auto-decrypt if enabled
      if (autoDecrypt) {
        // fire-and-forget, then store plaintext in messages
        (async () => {
          setDecryptingIds(d => ({ ...d, [message.id]: true }));
          const plaintext = await decryptMessage(message);
          setMessages(prev => prev.map(m => (m.id === message.id ? { ...m, plaintext } : m)));
          setDecryptingIds(d => ({ ...d, [message.id]: false }));
        })();
      }

      // Award badge for secure messaging
      if (messages.length === 0) {
        addBadge({
          id: 'secure-messenger',
          name: 'Secure Messenger',
          description: 'Exchange encrypted messages between Alice and Bob',
          icon: '\ud83d\udce7',
          earned: true
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const decryptMessage = async (message: Message): Promise<string | undefined> => {
    try {
      const receiver = message.to === 'Alice' ? alice : bob;
  if (!receiver) return undefined;

      // 1) RSA-decrypt AES key hex
      const keyHex = rsaDecrypt(message.encKey, receiver.keyPair.privateKey);

      // helper: hex to bytes
      const hexToBytes = (hex: string) => {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        return bytes;
      };

      const keyBytes = hexToBytes(keyHex);

      // import AES key and decrypt AES-GCM ciphertext
      const cryptoKey = await crypto.subtle.importKey('raw', keyBytes.buffer, { name: 'AES-GCM' }, false, ['decrypt']);

      // base64 -> ArrayBuffer
      const base64ToArrayBuffer = (b64: string) => {
        const binary = atob(b64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
      };

      // Decrypt text
      let plaintext: string | undefined;
      if (message.aesCiphertext) {
        const cipherBuf = base64ToArrayBuffer(message.aesCiphertext);
        const ivBuf = base64ToArrayBuffer(message.iv);
        const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(ivBuf) }, cryptoKey, cipherBuf);
        plaintext = new TextDecoder().decode(new Uint8Array(plainBuf));
      }

  return plaintext ?? undefined;
    } catch (error) {
      console.error('Decryption failed', error);
  return undefined;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="text-indigo-600" size={32} />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Secure Messaging Simulator</h2>
            <p className="text-gray-600">Demonstrate end-to-end encryption between Alice and Bob</p>
          </div>
        </div>

        {/* User Setup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Alice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <h3 className="text-lg font-semibold text-blue-800">Alice</h3>
              </div>
              {alice && (
                <div className="flex items-center space-x-1 text-xs text-blue-600">
                  <Key size={12} />
                  <span>Keys Ready</span>
                </div>
              )}
            </div>

            {!alice ? (
              <button
                onClick={() => generateUserKeys('alice')}
                disabled={isGeneratingKeys}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isGeneratingKeys ? 'Generating...' : 'Generate Alice\'s Keys'}
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-blue-700">Public Key (n)</label>
                  <div className="bg-white border border-blue-300 rounded px-2 py-1">
                    <code className="text-xs break-all">
                      {alice.keyPair.publicKey.n.slice(0, 40)}...
                    </code>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700">Public Exponent (e)</label>
                  <div className="bg-white border border-blue-300 rounded px-2 py-1">
                    <code className="text-xs">{alice.keyPair.publicKey.e}</code>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bob */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  B
                </div>
                <h3 className="text-lg font-semibold text-green-800">Bob</h3>
              </div>
              {bob && (
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <Key size={12} />
                  <span>Keys Ready</span>
                </div>
              )}
            </div>

            {!bob ? (
              <button
                onClick={() => generateUserKeys('bob')}
                disabled={isGeneratingKeys}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isGeneratingKeys ? 'Generating...' : 'Generate Bob\'s Keys'}
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-green-700">Public Key (n)</label>
                  <div className="bg-white border border-green-300 rounded px-2 py-1">
                    <code className="text-xs break-all">
                      {bob.keyPair.publicKey.n.slice(0, 40)}...
                    </code>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700">Public Exponent (e)</label>
                  <div className="bg-white border border-green-300 rounded px-2 py-1">
                    <code className="text-xs">{bob.keyPair.publicKey.e}</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Composer */}
        {alice && bob && (
          <>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Send Encrypted Message</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">View As</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="viewAs"
                        value="alice"
                        checked={viewAs === 'alice'}
                        onChange={() => setViewAs('alice')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Alice (sender)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="viewAs"
                        value="bob"
                        checked={viewAs === 'bob'}
                        onChange={() => setViewAs('bob')}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span>Bob (receiver)</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="sender"
                        value="alice"
                        checked={selectedSender === 'alice'}
                        onChange={(e) => setSelectedSender(e.target.value as 'alice' | 'bob')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Alice</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="sender"
                        value="bob"
                        checked={selectedSender === 'bob'}
                        onChange={(e) => setSelectedSender(e.target.value as 'alice' | 'bob')}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span>Bob</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your secure message here (or attach a file)..."
                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* file upload removed; text-only messaging */}

                <div className="flex items-center space-x-4">
                  <motion.button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Encrypting & Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Encrypted Message</span>
                      </>
                    )}
                  </motion.button>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showEncryption}
                      onChange={(e) => setShowEncryption(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Show encryption details</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Message History */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Message History</h3>
              
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Send your first encrypted message!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            message.from === 'Alice' ? 'bg-blue-600' : 'bg-green-600'
                          }`}>
                            {message.from[0]}
                          </div>
                          <span className="font-medium">{message.from}</span>
                          <ArrowRight size={16} className="text-gray-400" />
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            message.to === 'Alice' ? 'bg-blue-600' : 'bg-green-600'
                          }`}>
                            {message.to[0]}
                          </div>
                          <span className="font-medium">{message.to}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                        {/* Plaintext or Sender/Receiver view */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Unlock className="text-green-600" size={16} />
                            <span className="text-sm font-medium text-gray-700">Plaintext</span>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            {/* If viewing as sender and message.from matches viewer, show sender plaintext */}
                            {((viewAs === 'alice' && message.from === 'Alice') || (viewAs === 'bob' && message.from === 'Bob')) ? (
                              <div className="flex flex-col">
                                <div className="max-w-xl px-4 py-3 bg-gradient-to-r from-white to-gray-50 rounded-lg shadow-sm">
                                  <p className="text-green-800 leading-relaxed">{message.senderPlaintext}</p>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Sent · {formatTime(message.timestamp)}</div>
                              </div>
                            ) : (
                              // Receiver view: show decrypted plaintext or decrypt/verify UI
                              <>
                                {message.plaintext ? (
                                  <div className="space-y-2">
                                    <div className="max-w-xl px-4 py-3 bg-white rounded-lg shadow-sm">
                                      <p className="text-green-800 leading-relaxed">{message.plaintext}</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <button
                                        onClick={() => {
                                          const match = message.plaintext === message.senderPlaintext;
                                          setMessages(prev => prev.map(m => m.id === message.id ? { ...m, verified: true, verifiedAt: new Date(), verifiedMatches: match } : m));
                                        }}
                                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
                                      >
                                        Verify
                                      </button>
                                      {message.verified !== undefined && (
                                        <span className={`text-sm font-medium ${message.verifiedMatches ? 'text-green-600' : 'text-red-600'}`}>
                                          {message.verifiedMatches ? 'Match ✓' : 'Mismatch ✖'}{message.verifiedAt ? ` · ${formatTime(message.verifiedAt)}` : ''}
                                        </span>
                                      )}
                                      <span className="text-sm text-gray-500">{message.senderPlaintext ? `Sent: "${message.senderPlaintext.slice(0,40)}${message.senderPlaintext.length>40?'...':''}"` : ''}</span>
                                      {/* file download removed */}
                                    </div>
                                  </div>
                                ) : (
          <div className="flex items-center justify-between">
                                    <p className="text-green-800 text-sm italic">Encrypted — decrypt to view</p>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={async () => {
                                          setDecryptingIds(d => ({ ...d, [message.id]: true }));
            const res = await decryptMessage(message);
            setMessages(prev => prev.map(m => (m.id === message.id ? { ...m, plaintext: res } : m)));
                                          setDecryptingIds(d => ({ ...d, [message.id]: false }));
                                        }}
                                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                                      >
                                        {decryptingIds[message.id] ? 'Decrypting...' : 'Decrypt'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Encrypted Message */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Lock className="text-red-600" size={16} />
                            <span className="text-sm font-medium text-gray-700">Encrypted (In Transit)</span>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-red-800 font-mono text-xs break-all">
                              {showEncryption ? message.aesCiphertext : '••••••••••••••••••••'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Decryption Process */}
                      {showEncryption && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Key className="text-blue-600" size={16} />
                            <span className="text-sm font-medium text-gray-700">
                              Decryption Process ({message.to}'s Private Key)
                            </span>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-blue-800 text-sm">
                              <code>m = c^d mod n</code> → "{message.plaintext ? message.plaintext : (decryptingIds[message.id] ? 'Decrypting...' : 'Encrypted - decrypt to view')}"
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Security Explanation */}
            <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h4 className="font-medium text-indigo-800 mb-3">How End-to-End Encryption Works</h4>
              <div className="space-y-2 text-sm text-indigo-700">
                <p>1. <strong>Key Exchange:</strong> Alice and Bob generate their own RSA key pairs and share public keys.</p>
                <p>2. <strong>Encryption:</strong> When Alice sends a message to Bob, she encrypts it with Bob's public key.</p>
                <p>3. <strong>Transmission:</strong> The encrypted message travels over the network (safe from eavesdroppers).</p>
                <p>4. <strong>Decryption:</strong> Only Bob can decrypt the message using his private key.</p>
                <p>5. <strong>Security:</strong> Even if intercepted, the message remains secure without the private key.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}