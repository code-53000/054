import React from 'react';
import { Trash2, Zap, Activity } from 'lucide-react';
import { useCircuitStore } from '@/store';
import { getComponentDef } from '@/components-def';
import { formatVoltage, formatCurrent, formatResistance } from '@/solver';

export const PropertyPanel: React.FC = () => {
  const selectedId = useCircuitStore((s) => s.selectedComponentId);
  const selectedWireId = useCircuitStore((s) => s.selectedWireId);
  const components = useCircuitStore((s) => s.components);
  const wires = useCircuitStore((s) => s.wires);
  const solverResult = useCircuitStore((s) => s.solverResult);
  const updateComponentParam = useCircuitStore((s) => s.updateComponentParam);
  const removeComponent = useCircuitStore((s) => s.removeComponent);
  const removeWire = useCircuitStore((s) => s.removeWire);
  const toggleSwitch = useCircuitStore((s) => s.toggleSwitch);

  if (!selectedId && !selectedWireId) {
    return (
      <div className="w-64 bg-slate-900/95 border-l border-slate-700 flex flex-col h-full">
        <div className="px-4 py-3 border-b border-slate-700">
          <h2 className="text-slate-200 font-semibold text-sm tracking-wider">属性面板</h2>
        </div>
        <div className="flex-1 p-4">
          <div className="text-slate-500 text-sm text-center mt-8">
            选择一个元件或导线查看属性
          </div>
        </div>
        <div className="px-4 py-3 border-t border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Activity className="w-4 h-4" />
            <span>电路状态：</span>
            {solverResult.isConnected ? (
              <span className="text-green-400">已连通</span>
            ) : (
              <span className="text-red-400">未连通</span>
            )}
          </div>
          {solverResult.errors.length > 0 && (
            <div className="mt-2 text-red-400 text-xs">
              {solverResult.errors[0]}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedWireId) {
    const wire = wires.find((w) => w.id === selectedWireId);
    const current = solverResult.branchCurrents[selectedWireId] || 0;
    return (
      <div className="w-64 bg-slate-900/95 border-l border-slate-700 flex flex-col h-full">
        <div className="px-4 py-3 border-b border-slate-700">
          <h2 className="text-slate-200 font-semibold text-sm tracking-wider">导线属性</h2>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1">电流</div>
            <div className="text-slate-100 font-mono text-lg">
              {formatCurrent(current)}
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={() => removeWire(selectedWireId)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-300 rounded-lg text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除导线
          </button>
        </div>
      </div>
    );
  }

  const comp = components.find((c) => c.id === selectedId);
  if (!comp) return null;

  const def = getComponentDef(comp.type);
  const current = solverResult.branchCurrents[comp.id] || 0;
  const brightness = solverResult.bulbBrightness[comp.id] || 0;

  return (
    <div className="w-64 bg-slate-900/95 border-l border-slate-700 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700">
        <h2 className="text-slate-200 font-semibold text-sm tracking-wider">
          {def.name}属性
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {def.params.map((param) => {
          const value = comp.params[param.key];
          if (typeof value === 'boolean') {
            return (
              <div key={param.key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 text-sm">{param.label}</label>
                  <button
                    onClick={() => toggleSwitch(comp.id)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      value
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {value ? '闭合' : '断开'}
                  </button>
                </div>
              </div>
            );
          }
          return (
            <div key={param.key}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-slate-300 text-sm">{param.label}</label>
                <span className="text-slate-400 text-xs font-mono">
                  {typeof value === 'number' ? (
                    param.key === 'resistance' ? formatResistance(value) : `${value}${param.unit}`
                  ) : value}
                </span>
              </div>
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={Number(value)}
                onChange={(e) =>
                  updateComponentParam(comp.id, param.key, Number(e.target.value))
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{param.min}</span>
                <span>{param.max}</span>
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t border-slate-700 space-y-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>仿真数据</span>
          </div>
          {(comp.type === 'resistor' || comp.type === 'bulb') && (
            <div className="bg-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">电流</span>
                <span className="text-slate-100 font-mono">{formatCurrent(current)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">压降</span>
                <span className="text-slate-100 font-mono">
                  {formatVoltage(current * Number(comp.params.resistance || 0))}
                </span>
              </div>
              {comp.type === 'bulb' && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">亮度</span>
                  <span className="text-yellow-400 font-mono">
                    {Math.round(brightness * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-700">
        <button
          onClick={() => removeComponent(comp.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-300 rounded-lg text-sm transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          删除元件
        </button>
      </div>
    </div>
  );
};
