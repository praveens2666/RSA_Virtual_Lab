import { createContext, useContext, useState, ReactNode } from 'react';
import { RSAKeyPair } from '../utils/rsa';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: Date;
}

export interface Exercise {
  id: string;
  title: string;
  type: 'mcq' | 'calculation' | 'practical';
  completed: boolean;
  score?: number;
}

export interface LabState {
  currentModule: string;
  badges: Badge[];
  exercises: Exercise[];
  // Store generated key pairs with an id and typed structure
  keyPairs: Array<{ id: number; keyPair: RSAKeyPair }>;
  sessionProgress: {
    keysGenerated: number;
    messagesEncrypted: number;
    signaturesCreated: number;
    attacksCompleted: number;
  };
}

interface LabContextType {
  state: LabState;
  setCurrentModule: (module: string) => void;
  addBadge: (badge: Badge) => void;
  completeExercise: (exerciseId: string, score: number) => void;
  addKeyPair: (keyPair: any) => void;
  incrementProgress: (type: keyof LabState['sessionProgress']) => void;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

const initialBadges: Badge[] = [
  {
    id: 'first-key',
    name: 'Key Generator',
    description: 'Generate your first RSA key pair',
    icon: '🔑',
    earned: false
  },
  {
    id: 'prime-hunter',
    name: 'Prime Hunter',
    description: 'Generate a 2048-bit prime number',
    icon: '🎯',
    earned: false
  },
  {
    id: 'crypto-breaker',
    name: 'Crypto Breaker',
    description: 'Successfully factorize a small RSA modulus',
    icon: '💥',
    earned: false
  },
  {
    id: 'secure-messenger',
    name: 'Secure Messenger',
    description: 'Exchange encrypted messages between Alice and Bob',
    icon: '📧',
    earned: false
  },
  {
    id: 'signature-master',
    name: 'Signature Master',
    description: 'Create and verify 10 digital signatures',
    icon: '✍️',
    earned: false
  },
  {
    id: 'math-wizard',
    name: 'Math Wizard',
    description: 'Complete all number theory exercises',
    icon: '🧙‍♂️',
    earned: false
  }
];

const initialExercises: Exercise[] = [
  {
    id: 'key-gen-basic',
    title: 'Generate 1024-bit RSA Key Pair',
    type: 'practical',
    completed: false
  },
  {
    id: 'encrypt-decrypt',
    title: 'Encrypt and Decrypt Message',
    type: 'practical',
    completed: false
  },
  {
    id: 'factorization-quiz',
    title: 'Prime Factorization Quiz',
    type: 'mcq',
    completed: false
  },
  {
    id: 'signature-verify',
    title: 'Digital Signature Verification',
    type: 'practical',
    completed: false
  }
];

export function LabProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LabState>({
    currentModule: 'key-generation',
    badges: initialBadges,
    exercises: initialExercises,
    keyPairs: [],
    sessionProgress: {
      keysGenerated: 0,
      messagesEncrypted: 0,
      signaturesCreated: 0,
      attacksCompleted: 0
    }
  });

  const setCurrentModule = (module: string) => {
    setState(prev => ({ ...prev, currentModule: module }));
  };

  const addBadge = (badge: Badge) => {
    setState(prev => ({
      ...prev,
      badges: prev.badges.map(b => 
        b.id === badge.id ? { ...b, earned: true, earnedAt: new Date() } : b
      )
    }));
  };

  const completeExercise = (exerciseId: string, score: number) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, completed: true, score } : ex
      )
    }));
  };

  const addKeyPair = (keyPair: RSAKeyPair) => {
    const entry = { id: Date.now(), keyPair };
    setState(prev => ({
      ...prev,
      keyPairs: [...prev.keyPairs, entry]
    }));
  };

  const incrementProgress = (type: keyof LabState['sessionProgress']) => {
    setState(prev => ({
      ...prev,
      sessionProgress: {
        ...prev.sessionProgress,
        [type]: prev.sessionProgress[type] + 1
      }
    }));
  };

  return (
    <LabContext.Provider value={{
      state,
      setCurrentModule,
      addBadge,
      completeExercise,
      addKeyPair,
      incrementProgress
    }}>
      {children}
    </LabContext.Provider>
  );
}

export function useLabContext() {
  const context = useContext(LabContext);
  if (!context) {
    throw new Error('useLabContext must be used within a LabProvider');
  }
  return context;
}