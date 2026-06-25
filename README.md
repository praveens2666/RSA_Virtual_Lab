# 🔒 RSA Cryptosystem Virtual Lab

An interactive, visual, and gamified educational simulator designed to teach the mathematics, mechanics, security, and performance of the **Rivest-Shamir-Adleman (RSA)** public-key cryptosystem.

This application acts as a virtual laboratory where users can run step-by-step simulations, perform mathematical calculations, explore classic cryptographic attacks, and test their knowledge with built-in exercises.

---

## 🌟 Features & Modules

The virtual lab is divided into multiple educational modules, each focusing on a specific phase or aspect of RSA:

### 1. 🔑 Key Generation Simulator
* **Interactive Prime Selection:** Generate random prime numbers ($p$ and $q$) of customizable bit lengths.
* **Step-by-Step Walkthrough:** Visualize the entire mathematical process:
  1. Compute modular modulus: $n = p \times q$
  2. Compute Euler's totient function: $\phi(n) = (p-1) \times (q-1)$
  3. Select public exponent: $e$ (typically $65537$)
  4. Compute private exponent: $d = e^{-1} \pmod{\phi(n)}$ using the **Extended Euclidean Algorithm**.
* **Key Inspector:** Inspect and copy generated public key $(n, e)$ and private key $(n, d)$ structures.

### 2. 🧮 Mathematical Playground (Number Theory Tools)
* **Primality Testing:** Run interactive tests using the **Miller-Rabin** probabilistic algorithm and Trial Division, showing candidate witnesses and modular exponentiation steps.
* **Greatest Common Divisor (GCD):** View step-by-step derivation equations using the **Euclidean Algorithm**.
* **Prime Factorization:** Decompose composite numbers into their prime factors.
* **Modular Exponentiation:** Learn the **Square-and-Multiply** method with intermediate binary steps and visualization tables showing how $b^e \pmod m$ is calculated efficiently.

### 3. 📝 Encryption & Decryption Simulator
* **Character Encoding:** Visualize plaintext converting into byte representations (UTF-8/ASCII) and then into big integer values.
* **Modular Exponentiation Action:** Watch the mathematical transformations:
  * **Encryption:** $C = M^e \pmod n$
  * **Decryption:** $M = C^d \pmod n$
* **Size Enforcement:** Learn how key size constraints restrict the length of encryptable plaintext.

### 4. ✍️ Digital Signatures
* **Integrity & Authenticity:** Understand how public-key cryptography provides non-repudiation.
* **Hash-then-Sign Flow:** Watch messages get hashed with **SHA-256** and signed using the RSA private key: $S = H(M)^d \pmod n$.
* **Verification Flow:** Verify signatures using the public key: $H(M) \equiv S^e \pmod n$, confirming message authenticity and tamper-detection.

### 5. 💬 Alice & Bob Secure Messaging
* **Interactive Storyline:** Step into a narrative visualization of secure communication between Alice and Bob.
* **Encrypted Payload Exchange:** Generate individual keypairs, exchange public keys, encrypt messages, and decrypt them.
* **Visual Data Flow:** Clear, animated indicator lines illustrating how public keys are sent over public channels while private keys remain local.

### 6. 💥 Attack Demonstrations
* **Modulus Factorization:** Run a brute-force trial division attack to factorize $n$ back into $p$ and $q$, demonstrating how small key sizes (e.g., $< 512$ bits) are easily broken.
* **Timing & Complexity Tracker:** Watch a live profiler compute factorization times to appreciate why larger key sizes ($2048$ or $4098$ bits) are computationally secure.

### 7. 📊 Performance Profiler
* **Key-Size Benchmarking:** Compare execution times for key generation, encryption, and decryption across different key lengths.
* **Data Visualization:** Built-in charting showing exponential growth in key generation complexity versus the linear performance of encryption.

### 8. 🏆 Gamified Exercises & Badges
* **Interactive Quizzes:** Test theoretical knowledge on modular arithmetic, totients, and RSA mechanics.
* **Assessment Engine:** Calculation challenges and practical usage scenarios.
* **Achievement Badges:** Earn milestones like **Prime Hunter**, **Crypto Breaker**, and **Math Wizard** based on lab interactions and quiz scores.

---

## 🛠️ Tech Stack

* **Framework:** React 18 (Vite, TypeScript)
* **Styling & Icons:** Tailwind CSS, Lucide React
* **Animations:** Framer Motion (for smooth interactive state transitions and messaging animations)
* **Data Visualizations:** Recharts (for performance profiler graphing)
* **Math Engine:** `big-integer` (to handle arbitrary-precision arithmetic for big primes and RSA exponents)

---

## 📁 Project Structure

```bash
rsa_project/
├── .bolt/                # Configuration and instructions for the Bolt.new environment
├── src/
│   ├── components/
│   │   ├── Layout/       # Header, Sidebar, and core navigation layout
│   │   ├── Modules/      # Interactive panels for each learning phase
│   │   └── ModuleRenderer.tsx # Renders active module based on state
│   ├── contexts/
│   │   └── LabContext.tsx     # Holds active module, earned badges, and quiz scores
│   ├── utils/
│   │   ├── numberTheory.ts    # GCD steps, ModPow steps, Miller-Rabin testing
│   │   └── rsa.ts             # Key generation, encrypt, decrypt, signing, and attack logic
│   ├── App.tsx           # Application entry layout
│   ├── main.tsx          # React mount point
│   └── index.css         # Styling system
├── tailwind.config.js    # Tailwind configuration
└── package.json          # Dependency manifest
```

---

## 🚀 Getting Started

To run the RSA Virtual Lab locally on your machine:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 2. Install Dependencies
In the project directory, run:
```bash
npm install
```

### 3. Start the Development Server
Run the local Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to start exploring the lab.

### 4. Build for Production
To bundle the project for production:
```bash
npm run build
```
