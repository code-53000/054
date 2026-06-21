export type ComponentType = 'battery' | 'resistor' | 'switch' | 'bulb';

export interface PinDef {
  id: string;
  label: string;
  offsetX: number;
  offsetY: number;
}

export interface ParamDef {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number | boolean;
}

export interface ComponentDef {
  type: ComponentType;
  name: string;
  description: string;
  pins: PinDef[];
  params: ParamDef[];
  width: number;
  height: number;
  color: string;
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number;
  params: Record<string, number | boolean>;
}

export interface Wire {
  id: string;
  from: { componentId: string; pinId: string };
  to: { componentId: string; pinId: string };
}

export interface SolverResult {
  isConnected: boolean;
  nodeVoltages: Record<string, number>;
  branchCurrents: Record<string, number>;
  bulbBrightness: Record<string, number>;
  errors: string[];
}

export interface SavedCircuit {
  id: string;
  name: string;
  components: CircuitComponent[];
  wires: Wire[];
  createdAt: number;
  updatedAt: number;
}
