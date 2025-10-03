import BigInteger from 'big-integer';

export interface RSAKeyPair {
  publicKey: {
    n: string;
    e: string;
    bits: number;
  };
  privateKey: {
    n: string;
    d: string;
    bits: number;
  };
  primes: {
    p: string;
    q: string;
  };
  phi: string;
}

export interface KeyGenerationSteps {
  step1: { p: string; q: string };
  step2: { n: string; calculation: string };
  step3: { phi: string; calculation: string };
  step4: { e: string; reason: string };
  step5: { d: string; calculation: string };
}

// Generate a random prime number of specified bit length
export function generateRandomPrime(bitLength: number): BigInteger.BigInteger {
  const min = BigInteger(2).pow(bitLength - 1);
  const max = BigInteger(2).pow(bitLength).minus(1);
  
  let candidate: BigInteger.BigInteger;
  do {
    candidate = generateRandomBetween(min, max);
    if (candidate.isEven()) candidate = candidate.plus(1);
  } while (!isProbablePrime(candidate, 10));
  
  return candidate;
}

function generateRandomBetween(min: BigInteger.BigInteger, max: BigInteger.BigInteger): BigInteger.BigInteger {
  const range = max.minus(min);
  const randomBytes = new Uint8Array(Math.ceil(range.toString(2).length / 8));
  crypto.getRandomValues(randomBytes);
  
  let randomNum = BigInteger(0);
  for (let i = 0; i < randomBytes.length; i++) {
    randomNum = randomNum.multiply(256).plus(randomBytes[i]);
  }
  
  return min.plus(randomNum.mod(range));
}

// Miller-Rabin primality test
export function isProbablePrime(n: BigInteger.BigInteger, iterations: number = 10): boolean {
  if (n.lesser(2)) return false;
  if (n.equals(2) || n.equals(3)) return true;
  if (n.isEven()) return false;

  // Write n-1 as d * 2^r
  let d = n.minus(1);
  let r = 0;
  while (d.isEven()) {
    d = d.divide(2);
    r++;
  }

  for (let i = 0; i < iterations; i++) {
    const a = generateRandomBetween(BigInteger(2), n.minus(1));
    let x = modPow(a, d, n);

    if (x.equals(1) || x.equals(n.minus(1))) continue;

    let composite = true;
    for (let j = 0; j < r - 1; j++) {
      x = modPow(x, BigInteger(2), n);
      if (x.equals(n.minus(1))) {
        composite = false;
        break;
      }
    }

    if (composite) return false;
  }

  return true;
}

// Modular exponentiation: (base^exp) mod mod
export function modPow(base: BigInteger.BigInteger, exp: BigInteger.BigInteger, mod: BigInteger.BigInteger): BigInteger.BigInteger {
  let result = BigInteger(1);
  base = base.mod(mod);

  while (exp.greater(0)) {
    if (exp.isOdd()) {
      result = result.multiply(base).mod(mod);
    }
    exp = exp.divide(2);
    base = base.multiply(base).mod(mod);
  }

  return result;
}

// Extended Euclidean Algorithm
export function extendedGcd(a: BigInteger.BigInteger, b: BigInteger.BigInteger): { gcd: BigInteger.BigInteger; x: BigInteger.BigInteger; y: BigInteger.BigInteger } {
  if (b.equals(0)) {
    return { gcd: a, x: BigInteger(1), y: BigInteger(0) };
  }

  const { gcd, x: x1, y: y1 } = extendedGcd(b, a.mod(b));
  const x = y1;
  const y = x1.minus(a.divide(b).multiply(y1));

  return { gcd, x, y };
}

// Modular multiplicative inverse
export function modInverse(a: BigInteger.BigInteger, m: BigInteger.BigInteger): BigInteger.BigInteger {
  const { gcd, x } = extendedGcd(a, m);
  
  if (!gcd.equals(1)) {
    throw new Error('Modular inverse does not exist');
  }

  return x.mod(m).plus(m).mod(m);
}

// Generate RSA key pair with steps
export function generateRSAKeyPair(bitLength: number, showSteps: boolean = false): { keyPair: RSAKeyPair; steps?: KeyGenerationSteps } {
  const halfBits = Math.floor(bitLength / 2);
  
  // Step 1: Generate two distinct prime numbers
  const p = generateRandomPrime(halfBits);
  const q = generateRandomPrime(halfBits);
  
  // Step 2: Compute n = p * q
  const n = p.multiply(q);
  
  // Step 3: Compute Euler's totient function φ(n) = (p-1)(q-1)
  const phi = p.minus(1).multiply(q.minus(1));
  
  // Step 4: Choose e (commonly 65537)
  const e = BigInteger(65537);
  
  // Step 5: Compute d, the modular multiplicative inverse of e
  const d = modInverse(e, phi);

  const keyPair: RSAKeyPair = {
    publicKey: {
      n: n.toString(),
      e: e.toString(),
      bits: bitLength
    },
    privateKey: {
      n: n.toString(),
      d: d.toString(),
      bits: bitLength
    },
    primes: {
      p: p.toString(),
      q: q.toString()
    },
    phi: phi.toString()
  };

  if (showSteps) {
    const steps: KeyGenerationSteps = {
      step1: {
        p: p.toString(),
        q: q.toString()
      },
      step2: {
        n: n.toString(),
        calculation: `${p.toString()} × ${q.toString()} = ${n.toString()}`
      },
      step3: {
        phi: phi.toString(),
        calculation: `(${p.toString()} - 1) × (${q.toString()} - 1) = ${phi.toString()}`
      },
      step4: {
        e: e.toString(),
        reason: "65537 is commonly used because it's a Fermat prime (2^16 + 1), making encryption efficient"
      },
      step5: {
        d: d.toString(),
        calculation: `${e.toString()}⁻¹ mod ${phi.toString()} = ${d.toString()}`
      }
    };

    return { keyPair, steps };
  }

  return { keyPair };
}

// RSA encryption
export function rsaEncrypt(message: string, publicKey: { n: string; e: string }): string {
  const n = BigInteger(publicKey.n);
  const e = BigInteger(publicKey.e);
  
  // Convert message to number (simple implementation)
  const messageBytes = new TextEncoder().encode(message);
  const messageNum = BigInteger(Array.from(messageBytes).map(b => b.toString(16).padStart(2, '0')).join(''), 16);
  
  if (messageNum.greaterOrEquals(n)) {
    throw new Error('Message too long for key size');
  }
  
  const ciphertext = modPow(messageNum, e, n);
  return ciphertext.toString();
}

// RSA decryption
export function rsaDecrypt(ciphertext: string, privateKey: { n: string; d: string }): string {
  const n = BigInteger(privateKey.n);
  const d = BigInteger(privateKey.d);
  const c = BigInteger(ciphertext);
  
  const messageNum = modPow(c, d, n);
  const messageHex = messageNum.toString(16);
  
  // Convert back to string
  const bytes = [];
  for (let i = 0; i < messageHex.length; i += 2) {
    bytes.push(parseInt(messageHex.substr(i, 2), 16));
  }
  
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Digital signature
// --- Helper: SHA-256 via Web Crypto ---
async function sha256Hex(message: string): Promise<string> {
  const enc = new TextEncoder().encode(message);
  // SubtleCrypto.digest returns a Promise
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Digital signature (demo): hash with SHA-256 then raw RSA private exponent
export async function rsaSign(message: string, privateKey: { n: string; d: string }): Promise<string> {
  const hashHex = await sha256Hex(message);
  const n = BigInteger(privateKey.n);
  const d = BigInteger(privateKey.d);
  const hashNum = BigInteger(hashHex, 16);

  const signature = modPow(hashNum, d, n);
  return signature.toString();
}

// Verify signature (demo): raw RSA public exponent
export async function rsaVerify(message: string, signature: string, publicKey: { n: string; e: string }): Promise<boolean> {
  const hashHex = await sha256Hex(message);
  const n = BigInteger(publicKey.n);
  const e = BigInteger(publicKey.e);
  const sig = BigInteger(signature);

  const decryptedHash = modPow(sig, e, n);
  const expectedHash = BigInteger(hashHex, 16);

  return decryptedHash.equals(expectedHash);
}

// Factorization attack demo
export function factorizeSmallNumber(n: BigInteger.BigInteger): { p?: BigInteger.BigInteger; q?: BigInteger.BigInteger; steps: string[]; time: number } {
  const start = Date.now();
  const steps: string[] = [];
  
  steps.push(`Attempting to factorize ${n.toString()}`);
  
  // Trial division
  for (let i = BigInteger(2); i.multiply(i).lesserOrEquals(n); i = i.plus(1)) {
    if (n.mod(i).equals(0)) {
      const p = i;
      const q = n.divide(i);
      steps.push(`Found factors: ${p.toString()} × ${q.toString()} = ${n.toString()}`);
      
      return {
        p,
        q,
        steps,
        time: Date.now() - start
      };
    }
  }
  
  steps.push('No factors found (number might be prime)');
  return {
    steps,
    time: Date.now() - start
  };
}