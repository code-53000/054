import React from 'react';
import { Battery, Gauge, ToggleLeft, Lightbulb } from 'lucide-react';
import { COMPONENT_DEFS } from '@/components-def';
import type { ComponentType } from '@/types/circuit';

const iconMap: Record<ComponentType, React.ReactNode> = {
  battery: <Battery className="w-6 h-6 text-red-400" />,
  resistor: <Gauge className="w-6 h-6 text-slate-400" />,
  switch: <ToggleLeft className="w-6 h-6 text-green-400" />,
  bulb: <Lightbulb className="w-6 h-6 text-yellow-400" />,
};

export const ComponentLibrary: React.FC = () => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, type: ComponentType) => {
    e.dataTransfer.setData('component-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-56 bg-slate-900/95 border-r border-slate-700 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700">
        <h2 className="text-slate-200 font-semibold text-sm tracking-wider">元件库</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {(Object.keys(COMPONENT_DEFS) as ComponentType[]).map((type) => {
          const def = COMPONENT_DEFS[type];
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-sky-500 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${def.color}20` }}
                >
                  {iconMap[type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-100 font-medium text-sm">{def.name}</div>
                  <div className="text-slate-400 text-xs truncate">{def.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3 border-t border-slate-700">
        <p className="text-slate-500 text-xs leading-relaxed">
          拖拽元件到画布，点击元件引脚开始连线
        </p>
      </div>
    </div>
  );
};
