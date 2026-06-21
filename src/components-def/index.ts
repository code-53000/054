import type { ComponentDef, ComponentType } from '@/types/circuit';

export const COMPONENT_DEFS: Record<ComponentType, ComponentDef> = {
  battery: {
    type: 'battery',
    name: '电池',
    description: '直流电源，提供电压',
    width: 80,
    height: 40,
    color: '#ef4444',
    pins: [
      { id: 'pos', label: '+', offsetX: 40, offsetY: 0 },
      { id: 'neg', label: '-', offsetX: -40, offsetY: 0 },
    ],
    params: [
      { key: 'voltage', label: '电压', unit: 'V', min: 0, max: 24, step: 0.5, default: 9 },
    ],
  },
  resistor: {
    type: 'resistor',
    name: '电阻',
    description: '限制电流流动',
    width: 80,
    height: 30,
    color: '#6b7280',
    pins: [
      { id: 'a', label: 'A', offsetX: -40, offsetY: 0 },
      { id: 'b', label: 'B', offsetX: 40, offsetY: 0 },
    ],
    params: [
      { key: 'resistance', label: '阻值', unit: 'Ω', min: 1, max: 1000000, step: 10, default: 100 },
    ],
  },
  switch: {
    type: 'switch',
    name: '开关',
    description: '控制电路通断',
    width: 70,
    height: 30,
    color: '#22c55e',
    pins: [
      { id: 'a', label: 'A', offsetX: -35, offsetY: 0 },
      { id: 'b', label: 'B', offsetX: 35, offsetY: 0 },
    ],
    params: [
      { key: 'closed', label: '闭合', unit: '', min: 0, max: 1, step: 1, default: false },
    ],
  },
  bulb: {
    type: 'bulb',
    name: '灯泡',
    description: '发光指示电流大小',
    width: 50,
    height: 60,
    color: '#eab308',
    pins: [
      { id: 'a', label: 'A', offsetX: 0, offsetY: -30 },
      { id: 'b', label: 'B', offsetX: 0, offsetY: 30 },
    ],
    params: [
      { key: 'resistance', label: '内阻', unit: 'Ω', min: 1, max: 1000, step: 5, default: 50 },
    ],
  },
};

export const getComponentDef = (type: ComponentType): ComponentDef => COMPONENT_DEFS[type];

export const getDefaultParams = (type: ComponentType): Record<string, number | boolean> => {
  const def = COMPONENT_DEFS[type];
  const params: Record<string, number | boolean> = {};
  def.params.forEach((p) => {
    params[p.key] = p.default;
  });
  return params;
};
