import React from 'react';
import { useLabContext } from '../contexts/LabContext';
import { 
  KeyGeneration, 
  KeyGenerationSimulation,
  Encryption, 
  NumberTheoryTools, 
  DigitalSignatures, 
  AttackDemonstrations, 
  Exercises, 
  Performance, 
  SecureMessaging 
} from './Modules';

export function ModuleRenderer() {
  const { state } = useLabContext();

  const renderModule = () => {
    switch (state.currentModule) {
      case 'key-generation':
        return <KeyGeneration />;
      case 'key-generation-sim':
        return <KeyGenerationSimulation />;
      case 'encryption':
        return <Encryption />;
      case 'tools':
        return <NumberTheoryTools />;
      case 'signatures':
        return <DigitalSignatures />;
      case 'attacks':
        return <AttackDemonstrations />;
      case 'exercises':
        return <Exercises />;
      case 'performance':
        return <Performance />;
      case 'messaging':
        return <SecureMessaging />;
      default:
        return <KeyGeneration />;
    }
  };

  return (
    <div className="min-h-full">
      {renderModule()}
    </div>
  );
}