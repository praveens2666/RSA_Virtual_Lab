import React from 'react';
import { LabProvider } from './contexts/LabContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { ModuleRenderer } from './components/ModuleRenderer';

function App() {
  return (
    <LabProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            <ModuleRenderer />
          </main>
        </div>
      </div>
    </LabProvider>
  );
}

export default App;