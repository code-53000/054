import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { CircuitComponent, Wire, SolverResult, ComponentType } from '@/types/circuit';
import { getDefaultParams } from '@/components-def';
import { solveCircuit } from '@/solver';

interface PendingWire {
  fromComponentId: string;
  fromPinId: string;
  mouseX: number;
  mouseY: number;
}

interface CircuitState {
  components: CircuitComponent[];
  wires: Wire[];
  solverResult: SolverResult;
  selectedComponentId: string | null;
  selectedWireId: string | null;
  pendingWire: PendingWire | null;
  scale: number;
  offsetX: number;
  offsetY: number;

  addComponent: (type: ComponentType, x: number, y: number) => void;
  removeComponent: (id: string) => void;
  updateComponentPosition: (id: string, x: number, y: number) => void;
  updateComponentParam: (id: string, key: string, value: number | boolean) => void;
  toggleSwitch: (id: string) => void;

  startWire: (componentId: string, pinId: string, mouseX: number, mouseY: number) => void;
  updatePendingWire: (x: number, y: number) => void;
  cancelWire: () => void;
  finishWire: (componentId: string, pinId: string) => void;
  removeWire: (id: string) => void;

  selectComponent: (id: string | null) => void;
  selectWire: (id: string | null) => void;

  setViewTransform: (scale: number, offsetX: number, offsetY: number) => void;

  clearAll: () => void;
  loadCircuit: (components: CircuitComponent[], wires: Wire[]) => void;

  solve: () => void;
}

const initialResult: SolverResult = {
  isConnected: false,
  nodeVoltages: {},
  branchCurrents: {},
  bulbBrightness: {},
  errors: [],
};

export const useCircuitStore = create<CircuitState>((set, get) => ({
  components: [],
  wires: [],
  solverResult: initialResult,
  selectedComponentId: null,
  selectedWireId: null,
  pendingWire: null,
  scale: 1,
  offsetX: 0,
  offsetY: 0,

  addComponent: (type, x, y) => {
    const comp: CircuitComponent = {
      id: uuidv4(),
      type,
      x,
      y,
      rotation: 0,
      params: getDefaultParams(type),
    };
    set((state) => ({
      components: [...state.components, comp],
      selectedComponentId: comp.id,
      selectedWireId: null,
    }));
    get().solve();
  },

  removeComponent: (id) => {
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      wires: state.wires.filter(
        (w) => w.from.componentId !== id && w.to.componentId !== id,
      ),
      selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
    }));
    get().solve();
  },

  updateComponentPosition: (id, x, y) => {
    set((state) => ({
      components: state.components.map((c) => (c.id === id ? { ...c, x, y } : c)),
    }));
  },

  updateComponentParam: (id, key, value) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, params: { ...c.params, [key]: value } } : c,
      ),
    }));
    get().solve();
  },

  toggleSwitch: (id) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id && c.type === 'switch'
          ? { ...c, params: { ...c.params, closed: !c.params.closed } }
          : c,
      ),
    }));
    get().solve();
  },

  startWire: (componentId, pinId, mouseX, mouseY) => {
    set({
      pendingWire: { fromComponentId: componentId, fromPinId: pinId, mouseX, mouseY },
      selectedWireId: null,
      selectedComponentId: null,
    });
  },

  updatePendingWire: (x, y) => {
    set((state) =>
      state.pendingWire
        ? { pendingWire: { ...state.pendingWire, mouseX: x, mouseY: y } }
        : state,
    );
  },

  cancelWire: () => {
    set({ pendingWire: null });
  },

  finishWire: (componentId, pinId) => {
    const { pendingWire, wires } = get();
    if (!pendingWire) return;
    if (
      pendingWire.fromComponentId === componentId &&
      pendingWire.fromPinId === pinId
    ) {
      set({ pendingWire: null });
      return;
    }

    const exists = wires.some(
      (w) =>
        (w.from.componentId === pendingWire.fromComponentId &&
          w.from.pinId === pendingWire.fromPinId &&
          w.to.componentId === componentId &&
          w.to.pinId === pinId) ||
        (w.to.componentId === pendingWire.fromComponentId &&
          w.to.pinId === pendingWire.fromPinId &&
          w.from.componentId === componentId &&
          w.from.pinId === pinId),
    );

    if (!exists) {
      const wire: Wire = {
        id: uuidv4(),
        from: { componentId: pendingWire.fromComponentId, pinId: pendingWire.fromPinId },
        to: { componentId, pinId },
      };
      set((state) => ({
        wires: [...state.wires, wire],
        pendingWire: null,
      }));
      get().solve();
    } else {
      set({ pendingWire: null });
    }
  },

  removeWire: (id) => {
    set((state) => ({
      wires: state.wires.filter((w) => w.id !== id),
      selectedWireId: state.selectedWireId === id ? null : state.selectedWireId,
    }));
    get().solve();
  },

  selectComponent: (id) => {
    set({ selectedComponentId: id, selectedWireId: null });
  },

  selectWire: (id) => {
    set({ selectedWireId: id, selectedComponentId: null });
  },

  setViewTransform: (scale, offsetX, offsetY) => {
    set({ scale, offsetX, offsetY });
  },

  clearAll: () => {
    set({
      components: [],
      wires: [],
      solverResult: initialResult,
      selectedComponentId: null,
      selectedWireId: null,
      pendingWire: null,
    });
  },

  loadCircuit: (components, wires) => {
    set({
      components,
      wires,
      selectedComponentId: null,
      selectedWireId: null,
      pendingWire: null,
    });
    get().solve();
  },

  solve: () => {
    const { components, wires } = get();
    const result = solveCircuit({ components, wires });
    set({ solverResult: result });
  },
}));
