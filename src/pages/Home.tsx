import React from 'react';
import { Toolbar } from '@/components/Toolbar';
import { ComponentLibrary } from '@/components/ComponentLibrary';
import { PropertyPanel } from '@/components/PropertyPanel';
import { CircuitCanvas } from '@/components/Canvas/CircuitCanvas';

const Home: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <ComponentLibrary />
        <div className="flex-1 relative">
          <CircuitCanvas />
        </div>
        <PropertyPanel />
      </div>
    </div>
  );
};

export default Home;
