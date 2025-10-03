import BigInteger from 'big-integer';

export interface GCDStep {
  a: string;
  b: string;
  quotient: string;
  remainder: string;
  equation: string;
}

// Euclidean Algorithm with steps
export function gcdWithSteps(a: BigInteger.BigInteger, b: BigInteger.BigInteger): { gcd: string; steps: GCDStep[] } {
  const steps: GCDStep[] = [];
  let x = a;
  let y = b;
  
  while (!y.equals(0)) {
    const quotient = x.divide(y);
    const remainder = x.mod(y);
    
    steps.push({
      a: x.toString(),
      b: y.toString(),
      quotient: quotient.toString(),
      remainder: remainder.toString(),
      equation: `${x.toString()} = ${y.toString()} × ${quotient.toString()} + ${remainder.toString()}`
    });
    
    x = y;
    y = remainder;
  }
  
  return {
    gcd: x.toString(),
    steps
  };
}

// Prime factorization
export function primeFactorization(n: BigInteger.BigInteger): { factors: string[]; steps: string[] } {
  const factors: string[] = [];
  const steps: string[] = [];
  let num = n;
  let divisor = BigInteger(2);
  
  steps.push(`Factorizing ${n.toString()}`);
  
  while (divisor.multiply(divisor).lesserOrEquals(num)) {
    while (num.mod(divisor).equals(0)) {
      factors.push(divisor.toString());
      steps.push(`${num.toString()} ÷ ${divisor.toString()} = ${num.divide(divisor).toString()}`);
      num = num.divide(divisor);
    }
    divisor = divisor.plus(1);
  }
  
  if (num.greater(1)) {
    factors.push(num.toString());
    steps.push(`Remaining factor: ${num.toString()}`);
  }
  
  return { factors, steps };
}

// Modular exponentiation with steps
export function modPowWithSteps(base: BigInteger.BigInteger, exp: BigInteger.BigInteger, mod: BigInteger.BigInteger): { result: string; steps: string[]; tableSteps: any[] } {
  const steps: string[] = [];
  const tableSteps: any[] = [];
  let result = BigInteger(1);
  let currentBase = base.mod(mod);
  let currentExp = exp;
  
  steps.push(`Computing ${base.toString()}^${exp.toString()} mod ${mod.toString()}`);
  steps.push(`Using square-and-multiply method:`);
  
  const binaryExp = exp.toString(2);
  steps.push(`${exp.toString()} in binary: ${binaryExp}`);
  
  // Initialize table
  tableSteps.push({
    step: 0,
    bit: 'Init',
    operation: `result = 1, base = ${base.toString()} mod ${mod.toString()}`,
    result: `result = 1, base = ${currentBase.toString()}`
  });

  for (let i = binaryExp.length - 1; i >= 0; i--) {
    const bitPosition = binaryExp.length - 1 - i;
    const currentBit = binaryExp[i];
    
    if (binaryExp[i] === '1') {
      const oldResult = result;
      result = result.multiply(currentBase).mod(mod);
      steps.push(`Bit ${binaryExp.length - 1 - i}: result = (${oldResult.toString()} × ${currentBase.toString()}) mod ${mod.toString()} = ${result.toString()}`);
      
      tableSteps.push({
        step: bitPosition + 1,
        bit: `${currentBit} (bit ${bitPosition})`,
        operation: `result = (${oldResult.toString()} × ${currentBase.toString()}) mod ${mod.toString()}`,
        result: result.toString()
      });
    }
    
    if (i > 0) {
      const oldBase = currentBase;
      currentBase = currentBase.multiply(currentBase).mod(mod);
      steps.push(`Square: ${oldBase.toString()}^2 mod ${mod.toString()} = ${currentBase.toString()}`);
      
      if (binaryExp[i] === '0') {
        tableSteps.push({
          step: bitPosition + 1,
          bit: `${currentBit} (bit ${bitPosition})`,
          operation: `base = ${oldBase.toString()}^2 mod ${mod.toString()}`,
          result: `base = ${currentBase.toString()}`
        });
      }
    }
  }
  
  return {
    result: result.toString(),
    steps,
    tableSteps
  };
}

// Check if number is prime with explanation
export function primalityTestWithSteps(n: BigInteger.BigInteger): { isPrime: boolean; steps: string[]; method: string } {
  const steps: string[] = [];
  
  steps.push(`Testing if ${n.toString()} is prime`);
  
  if (n.lesser(2)) {
    steps.push('Numbers less than 2 are not prime');
    return { isPrime: false, steps, method: 'Definition' };
  }
  
  if (n.equals(2)) {
    steps.push('2 is prime');
    return { isPrime: true, steps, method: 'Definition' };
  }
  
  if (n.isEven()) {
    steps.push('Even numbers > 2 are not prime');
    return { isPrime: false, steps, method: 'Even Check' };
  }
  
  // Trial division for small numbers
  if (n.lesser(1000)) {
    steps.push('Using trial division method');
    for (let i = BigInteger(3); i.multiply(i).lesserOrEquals(n); i = i.plus(2)) {
      if (n.mod(i).equals(0)) {
        steps.push(`${n.toString()} is divisible by ${i.toString()}`);
        return { isPrime: false, steps, method: 'Trial Division' };
      }
    }
    steps.push('No divisors found, number is prime');
    return { isPrime: true, steps, method: 'Trial Division' };
  }
  
  // Miller-Rabin for large numbers
  steps.push('Using Miller-Rabin probabilistic test');
  const iterations = 10;
  
  // Write n-1 as d * 2^r
  let d = n.minus(1);
  let r = 0;
  while (d.isEven()) {
    d = d.divide(2);
    r++;
  }
  
  steps.push(`${n.toString()} - 1 = ${d.toString()} × 2^${r}`);
  
  for (let i = 0; i < iterations; i++) {
    const a = BigInteger(2 + Math.floor(Math.random() * (n.toJSNumber() - 4)));
    steps.push(`Iteration ${i + 1}: Testing with witness a = ${a.toString()}`);
    
    let x = modPow(a, d, n);
    
    if (x.equals(1) || x.equals(n.minus(1))) {
      steps.push(`a^d ≡ ±1 (mod n), continue to next iteration`);
      continue;
    }
    
    let composite = true;
    for (let j = 0; j < r - 1; j++) {
      x = x.multiply(x).mod(n);
      if (x.equals(n.minus(1))) {
        composite = false;
        steps.push(`Found x ≡ -1 (mod n), continue to next iteration`);
        break;
      }
    }
    
    if (composite) {
      steps.push(`Composite number detected with witness ${a.toString()}`);
      return { isPrime: false, steps, method: 'Miller-Rabin' };
    }
  }
  
  steps.push(`Passed ${iterations} iterations of Miller-Rabin test`);
  steps.push('Number is probably prime (with high probability)');
  return { isPrime: true, steps, method: 'Miller-Rabin' };
}

// Modular exponentiation using square-and-multiply
function modPow(base: BigInteger.BigInteger, exp: BigInteger.BigInteger, mod: BigInteger.BigInteger): BigInteger.BigInteger {
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