import React, { useState } from 'react';
import { Key, Clock } from 'lucide-react';
import BigInteger from 'big-integer';
import { isProbablePrime, modInverse } from '../../utils/rsa';
import { useLabContext } from '../../contexts/LabContext';

export function KeyGenerationSimulation() {
  const [pText, setPText] = useState('');
  const [qText, setQText] = useState('');
  const [steps, setSteps] = useState<any | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [keyPair, setKeyPair] = useState<any | null>(null);
  const [message, setMessage] = useState('Hello');
  const [cipher, setCipher] = useState('');
  const [showPrivate, setShowPrivate] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [phiValue, setPhiValue] = useState<any>(null);
  const [candidateEs, setCandidateEs] = useState<string[]>([]);
  const [chosenE, setChosenE] = useState('');

  const { addKeyPair, incrementProgress } = useLabContext();

  // Extended Euclidean Algorithm
  const egcd = (a: any, b: any): any => {
    if (b.equals(0)) return { gcd: a, x: BigInteger(1), y: BigInteger(0) };
    const r = egcd(b, a.mod(b));
    const x = r.y;
    const y = r.x.minus(a.divide(b).multiply(r.y));
    return { gcd: r.gcd, x, y };
  };

  const generateCandidates = (phi: any) => {
    const validEs: string[] = [];

    // If phi is small enough, enumerate all odd e from 3..phi-1 and collect candidates (cap to avoid huge loops)
    const PHI_ENUM_CAP = 10000; // iterate only when phi <= cap
    const MAX_COLLECT = 500; // maximum number of candidates to return

    if (phi.lesserOrEquals(PHI_ENUM_CAP)) {
      let e = BigInteger(3);
      while (e.lesser(phi) && validEs.length < MAX_COLLECT) {
        if (egcd(e, phi).gcd.equals(1)) validEs.push(e.toString());
        e = e.add(2);
      }
      return validEs;
    }

    // For large phi: include some well-known exponents if valid, then sample a set of odd candidates
    const wellKnown = [3, 5, 17, 257, 65537];
    for (const v of wellKnown) {
      const e = BigInteger(v);
      if (e.greater(1) && e.lesser(phi) && egcd(e, phi).gcd.equals(1)) {
        validEs.push(e.toString());
      }
    }

    // Random sampling for large phi to collect a reasonable set
    const SAMPLE_TARGET = 200;
    const rand = () => Math.floor(Math.random() * 0xffffffff);
    let attempts = 0;
    while (validEs.length < SAMPLE_TARGET && attempts < SAMPLE_TARGET * 10) {
      attempts++;
      // pick a random odd number in [3, phi-1]
      const phiNum = Number(phi.mod(0xffffffff).toString()); // reduce size for JS range, but we'll create BigInteger from random offset
      // create a candidate by picking a random 32-bit and reducing mod (phi-3) then add 3
      const candidate = BigInteger(Math.abs(rand()) % 0x7fffffff).add(3);
      if (candidate.greaterOrEquals(phi)) continue;
      const e = candidate.isEven() ? candidate.plus(1) : candidate;
      if (e.greater(1) && e.lesser(phi) && egcd(e, phi).gcd.equals(1)) {
        const sval = e.toString();
        if (!validEs.includes(sval)) validEs.push(sval);
      }
    }

    // Ensure we always return at least one candidate (search deterministically if random sampling failed)
    if (validEs.length === 0) {
      let e = BigInteger(3);
      while (e.lesser(phi)) {
        if (egcd(e, phi).gcd.equals(1)) {
          validEs.push(e.toString());
          break;
        }
        e = e.add(2);
      }
    }

    return validEs.slice(0, MAX_COLLECT);
  };

  const prepareSimulation = () => {
    try {
      const p = BigInteger(pText.trim());
      const q = BigInteger(qText.trim());

      if (p.equals(q)) {
        alert('p and q must be different');
        return;
      }

      if (!isProbablePrime(p, 8)) {
        if (!confirm('p does not appear prime. Continue?')) return;
      }
      if (!isProbablePrime(q, 8)) {
        if (!confirm('q does not appear prime. Continue?')) return;
      }

      const phi = p.minus(1).multiply(q.minus(1));
      setPhiValue(phi);
      setCandidateEs(generateCandidates(phi));
      setChosenE(''); // reset previous choice
      alert(`φ(n) computed. Now select e from dropdown.`);
    } catch (err) {
      alert('Error preparing simulation: Ensure p and q are valid integers.');
    }
  };

  const startSimulation = () => {
    try {
      const start = Date.now();
      const p = BigInteger(pText.trim());
      const q = BigInteger(qText.trim());
      const n = p.multiply(q);
      const phi = phiValue;

      if (!chosenE) {
        alert('Please select a valid e from dropdown');
        return;
      }

      const e = BigInteger(chosenE);
      const d = modInverse(e, phi);

      const kp = {
        publicKey: { n: n.toString(), e: e.toString(), bits: n.toString(2).length },
        privateKey: { n: n.toString(), d: d.toString(), bits: n.toString(2).length },
        primes: { p: p.toString(), q: q.toString() },
        phi: phi.toString()
      };

      const stepsObj = {
        step1: { p: p.toString(), q: q.toString() },
        step2: { n: n.toString(), calc: `${p.toString()} × ${q.toString()} = ${n.toString()}` },
        step3: { phi: phi.toString(), calc: `(${p.toString()} - 1) × (${q.toString()} - 1) = ${phi.toString()}` },
        step4: { e: e.toString(), reason: `Selected e = ${e.toString()}` },
        step5: { d: d.toString(), calc: `${e.toString()}⁻¹ mod ${phi.toString()} = ${d.toString()}` },
        step6: { public: `Public Key = (n, e)`, private: `Private Key = (n, d)` }
      };

      setKeyPair(kp);
      setSteps(stepsObj);
      setStepIndex(1);
      setTimeMs(Date.now() - start);

      addKeyPair(kp);
      incrementProgress('keysGenerated');
    } catch (err) {
      console.error(err);
      alert('Failed to start simulation. Ensure inputs are valid.');
    }
  };

  const next = () => setStepIndex((s) => Math.min(6, s + 1));
  const prev = () => setStepIndex((s) => Math.max(0, s - 1));

  const doEncrypt = () => {
    if (!keyPair) return;
    try {
      const e = BigInteger(keyPair.publicKey.e);
      const n = BigInteger(keyPair.publicKey.n);

      const encryptedChars = message.split('').map((ch) => {
        const code = BigInteger(ch.charCodeAt(0));
        const cipherVal = code.modPow(e, n);
        return cipherVal.toString();
      });

      setCipher(encryptedChars.join(' '));
      incrementProgress('messagesEncrypted');
    } catch (err: any) {
      alert('Encryption error: ' + (err.message || err));
    }
  };

  const doDecrypt = () => {
    if (!keyPair) return;
    try {
      const d = BigInteger(keyPair.privateKey.d);
      const n = BigInteger(keyPair.privateKey.n);

      const parts = cipher.trim().split(/\s+/);
      const decryptedChars = parts.map((part) => {
        const num = BigInteger(part);
        const plainVal = num.modPow(d, n).toJSNumber();
        return String.fromCharCode(plainVal);
      });

      setMessage(decryptedChars.join(''));
    } catch (err: any) {
      alert('Decryption error: ' + (err.message || err));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Key className="text-indigo-600" size={28} />
          <div>
            <h3 className="text-2xl font-semibold">Key Generation (Simulation)</h3>
            <p className="text-sm text-gray-600">Manual p, q with dropdown e selection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-700">Prime p (decimal)</label>
            <textarea value={pText} onChange={(e) => setPText(e.target.value)} className="w-full mt-1 p-2 border rounded font-mono text-xs h-28" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Prime q (decimal)</label>
            <textarea value={qText} onChange={(e) => setQText(e.target.value)} className="w-full mt-1 p-2 border rounded font-mono text-xs h-28" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Public Exponent e</label>
            {candidateEs.length === 0 ? (
              <p className="text-xs text-gray-500 mt-2">Click "Prepare" to compute φ(n) and possible e values</p>
            ) : (
              <select value={chosenE} onChange={(e) => setChosenE(e.target.value)} className="w-full mt-1 p-2 border rounded font-mono text-xs">
                <option value="">-- Select e --</option>
                {candidateEs.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 mb-4">
          <button onClick={prepareSimulation} className="px-4 py-2 bg-gray-600 text-white rounded">Prepare</button>
          <button onClick={startSimulation} className="px-4 py-2 bg-indigo-600 text-white rounded">Start Simulation</button>
          <div className="text-sm text-gray-600">{timeMs > 0 && <><Clock size={14} /> <span className="ml-1">{timeMs}ms</span></>}</div>
        </div>

        {steps && (
          <div className="bg-gray-50 rounded p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <button onClick={prev} className="px-2 py-1 bg-white border rounded">Prev</button>
                <button onClick={next} className="px-2 py-1 bg-white border rounded">Next</button>
                <span className="text-sm text-gray-600">Step {stepIndex} / 6</span>
              </div>
            </div>

            <div className="space-y-3">
              {stepIndex >= 1 && (
                <div className="border-l-4 border-blue-500 pl-3">
                  <h4 className="font-medium">Step 1 — Primes</h4>
                  <p className="text-xs font-mono break-all">p = {steps.step1.p}</p>
                  <p className="text-xs font-mono break-all">q = {steps.step1.q}</p>
                </div>
              )}
              {stepIndex >= 2 && (
                <div className="border-l-4 border-green-500 pl-3">
                  <h4 className="font-medium">Step 2 — Modulus</h4>
                  <p className="text-xs font-mono break-all">{steps.step2.calc}</p>
                </div>
              )}
              {stepIndex >= 3 && (
                <div className="border-l-4 border-purple-500 pl-3">
                  <h4 className="font-medium">Step 3 — φ(n)</h4>
                  <p className="text-xs font-mono break-all">{steps.step3.calc}</p>
                </div>
              )}
              {stepIndex >= 4 && (
                <div className="border-l-4 border-orange-500 pl-3">
                  <h4 className="font-medium">Step 4 — Public Exponent</h4>
                  <p className="text-xs">e = {steps.step4.e}</p>
                  <p className="text-xs text-gray-500">{steps.step4.reason}</p>
                </div>
              )}
              {stepIndex >= 5 && (
                <div className="border-l-4 border-red-500 pl-3">
                  <h4 className="font-medium">Step 5 — Private Exponent</h4>
                  <p className="text-xs font-mono break-all">{steps.step5.calc}</p>
                </div>
              )}
              {stepIndex >= 6 && (
                <div className="border-l-4 border-gray-500 pl-3">
                  <h4 className="font-medium">Step 6 — Keys</h4>
                  <p className="text-xs">{steps.step6.public}</p>
                  <p className="text-xs">{steps.step6.private}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {keyPair && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h4 className="font-medium text-green-800">Public Key</h4>
              <p className="text-xs font-mono break-all">n = {keyPair.publicKey.n}</p>
              <p className="text-xs">e = {keyPair.publicKey.e}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-red-800">Private Key</h4>
                <button onClick={() => setShowPrivate(!showPrivate)} className="text-sm text-red-700">{showPrivate ? 'Hide' : 'Show'}</button>
              </div>
              {showPrivate && <p className="text-xs font-mono break-all">d = {keyPair.privateKey.d}</p>}
            </div>

            <div className="bg-gray-50 rounded p-3">
              <h4 className="font-medium">Encrypt / Decrypt (per character)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                <input value={message} onChange={(e) => setMessage(e.target.value)} className="p-2 border rounded col-span-2" />
                <button onClick={doEncrypt} className="px-3 py-2 bg-green-600 text-white rounded">Encrypt</button>

                <textarea value={cipher} readOnly className="p-2 border rounded col-span-2 h-24 font-mono" />
                <button onClick={doDecrypt} className="px-3 py-2 bg-yellow-600 text-white rounded">Decrypt</button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Ciphertext shown as space-separated numbers.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default KeyGenerationSimulation;
