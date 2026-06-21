import type { CircuitComponent, Wire, SolverResult } from '@/types/circuit';
import { getComponentDef } from '@/components-def';

type PinKey = string;
type NodeId = string;

const pinKey = (componentId: string, pinId: string): PinKey => `${componentId}:${pinId}`;

class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
      return x;
    }
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }

  union(x: string, y: string): void {
    const xr = this.find(x);
    const yr = this.find(y);
    if (xr === yr) return;
    const rx = this.rank.get(xr) || 0;
    const ry = this.rank.get(yr) || 0;
    if (rx < ry) {
      this.parent.set(xr, yr);
    } else if (rx > ry) {
      this.parent.set(yr, xr);
    } else {
      this.parent.set(yr, xr);
      this.rank.set(xr, rx + 1);
    }
  }
}

interface SolverInput {
  components: CircuitComponent[];
  wires: Wire[];
}

interface GraphEdge {
  fromNode: NodeId;
  toNode: NodeId;
  componentId: string;
  resistance: number;
  type: 'resistor' | 'bulb' | 'switch' | 'wire';
}

function buildGraph(
  components: CircuitComponent[],
  wires: Wire[],
): { uf: UnionFind; edges: GraphEdge[]; posNode: NodeId; negNode: NodeId; battery: CircuitComponent } | null {
  const batteries = components.filter((c) => c.type === 'battery');
  if (batteries.length === 0) return null;
  const battery = batteries[0];
  const batteryDef = getComponentDef('battery');

  const uf = new UnionFind();

  components.forEach((comp) => {
    const def = getComponentDef(comp.type);
    def.pins.forEach((pin) => {
      uf.find(pinKey(comp.id, pin.id));
    });
  });

  wires.forEach((wire) => {
    const from = pinKey(wire.from.componentId, wire.from.pinId);
    const to = pinKey(wire.to.componentId, wire.to.pinId);
    uf.union(from, to);
  });

  const edges: GraphEdge[] = [];

  components.forEach((comp) => {
    const def = getComponentDef(comp.type);
    if (def.pins.length < 2) return;

    if (comp.type === 'switch') {
      if (comp.params.closed === true) {
        uf.union(
          pinKey(comp.id, def.pins[0].id),
          pinKey(comp.id, def.pins[1].id),
        );
      }
    } else if (comp.type === 'resistor' || comp.type === 'bulb') {
      const n1 = uf.find(pinKey(comp.id, def.pins[0].id));
      const n2 = uf.find(pinKey(comp.id, def.pins[1].id));
      if (n1 !== n2) {
        edges.push({
          fromNode: n1,
          toNode: n2,
          componentId: comp.id,
          resistance: Number(comp.params.resistance) || 1,
          type: comp.type as 'resistor' | 'bulb',
        });
      }
    }
  });

  const posNode = uf.find(pinKey(battery.id, batteryDef.pins[0].id));
  const negNode = uf.find(pinKey(battery.id, batteryDef.pins[1].id));

  return { uf, edges, posNode, negNode, battery };
}

function hasPathBetween(
  start: NodeId,
  end: NodeId,
  edges: GraphEdge[],
): boolean {
  if (start === end) return true;

  const adjacency: Map<NodeId, NodeId[]> = new Map();
  edges.forEach((e) => {
    if (!adjacency.has(e.fromNode)) adjacency.set(e.fromNode, []);
    if (!adjacency.has(e.toNode)) adjacency.set(e.toNode, []);
    adjacency.get(e.fromNode)!.push(e.toNode);
    adjacency.get(e.toNode)!.push(e.fromNode);
  });

  const visited = new Set<NodeId>();
  const queue: NodeId[] = [start];
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === end) return true;
    const neighbors = adjacency.get(current) || [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    }
  }
  return false;
}

function findAllPaths(
  start: NodeId,
  end: NodeId,
  edges: GraphEdge[],
): GraphEdge[][] {
  const adjacency: Map<NodeId, GraphEdge[]> = new Map();
  edges.forEach((e) => {
    if (!adjacency.has(e.fromNode)) adjacency.set(e.fromNode, []);
    if (!adjacency.has(e.toNode)) adjacency.set(e.toNode, []);
    const reverse: GraphEdge = {
      ...e,
      fromNode: e.toNode,
      toNode: e.fromNode,
    };
    adjacency.get(e.fromNode)!.push(e);
    adjacency.get(e.toNode)!.push(reverse);
  });

  const paths: GraphEdge[][] = [];
  const visited = new Set<string>();

  function dfs(node: NodeId, path: GraphEdge[]) {
    if (node === end) {
      paths.push([...path]);
      return;
    }
    const neighbors = adjacency.get(node) || [];
    for (const edge of neighbors) {
      const edgeKey = edge.componentId;
      if (!visited.has(edgeKey)) {
        visited.add(edgeKey);
        path.push(edge);
        dfs(edge.toNode, path);
        path.pop();
        visited.delete(edgeKey);
      }
    }
  }

  dfs(start, []);
  return paths;
}

export function solveCircuit(input: SolverInput): SolverResult {
  const { components, wires } = input;
  const errors: string[] = [];

  if (components.length === 0) {
    return {
      isConnected: false,
      nodeVoltages: {},
      branchCurrents: {},
      bulbBrightness: {},
      errors: ['电路中没有元件'],
    };
  }

  const batteries = components.filter((c) => c.type === 'battery');
  if (batteries.length === 0) {
    return {
      isConnected: false,
      nodeVoltages: {},
      branchCurrents: {},
      bulbBrightness: {},
      errors: ['电路中没有电池作为电源'],
    };
  }

  if (batteries.length > 1) {
    errors.push('当前版本仅支持单个电池供电');
  }

  const graph = buildGraph(components, wires);
  if (!graph) {
    return {
      isConnected: false,
      nodeVoltages: {},
      branchCurrents: {},
      bulbBrightness: {},
      errors: ['无法构建电路'],
    };
  }

  const { edges, posNode, negNode, battery } = graph;
  const isConnected = hasPathBetween(posNode, negNode, edges);

  const nodeVoltages: Record<string, number> = {};
  const branchCurrents: Record<string, number> = {};
  const bulbBrightness: Record<string, number> = {};

  components.forEach((c) => {
    branchCurrents[c.id] = 0;
    if (c.type === 'bulb') {
      bulbBrightness[c.id] = 0;
    }
  });

  if (!isConnected) {
    return {
      isConnected: false,
      nodeVoltages,
      branchCurrents,
      bulbBrightness,
      errors: [...errors, '电路未形成完整回路'],
    };
  }

  const batteryVoltage = Number(battery.params.voltage) || 0;
  nodeVoltages[negNode] = 0;
  nodeVoltages[posNode] = batteryVoltage;

  const paths = findAllPaths(posNode, negNode, edges);

  const pathResistances: number[] = paths.map((path) =>
    path.reduce((sum, e) => sum + e.resistance, 0),
  );

  const pathCurrents: number[] = pathResistances.map((r) =>
    r > 0 ? batteryVoltage / r : 0,
  );

  const edgeCurrentContributions: Map<string, number[]> = new Map();

  paths.forEach((path, pathIdx) => {
    const I = pathCurrents[pathIdx];
    path.forEach((edge) => {
      if (!edgeCurrentContributions.has(edge.componentId)) {
        edgeCurrentContributions.set(edge.componentId, []);
      }
      edgeCurrentContributions.get(edge.componentId)!.push(I);
    });
  });

  edgeCurrentContributions.forEach((currents, compId) => {
    const total = currents.reduce((sum, c) => sum + c, 0);
    branchCurrents[compId] = total;
  });

  paths.forEach((path, pathIdx) => {
    const I = pathCurrents[pathIdx];
    let accumulated = 0;
    path.forEach((edge) => {
      const vDrop = I * edge.resistance;
      if (edge.fromNode !== posNode && !nodeVoltages[edge.fromNode]) {
        nodeVoltages[edge.fromNode] = batteryVoltage - accumulated;
      }
      accumulated += vDrop;
      if (edge.toNode !== negNode && !nodeVoltages[edge.toNode]) {
        nodeVoltages[edge.toNode] = batteryVoltage - accumulated;
      }
    });
  });

  nodeVoltages[posNode] = batteryVoltage;
  nodeVoltages[negNode] = 0;

  components.forEach((comp) => {
    if (comp.type === 'bulb') {
      const current = Math.abs(branchCurrents[comp.id] || 0);
      const resistance = Number(comp.params.resistance) || 50;
      const maxCurrent = resistance > 0 ? batteryVoltage / resistance : 0;
      const brightness = maxCurrent > 0 ? Math.min(1, current / maxCurrent) : 0;
      bulbBrightness[comp.id] = brightness;
    }
  });

  return {
    isConnected,
    nodeVoltages,
    branchCurrents,
    bulbBrightness,
    errors,
  };
}

export function formatVoltage(v: number): string {
  if (Math.abs(v) < 0.001) return '0 V';
  if (Math.abs(v) >= 1) return `${v.toFixed(2)} V`;
  return `${(v * 1000).toFixed(1)} mV`;
}

export function formatCurrent(i: number): string {
  const abs = Math.abs(i);
  if (abs < 0.000001) return '0 A';
  if (abs >= 1) return `${i.toFixed(2)} A`;
  if (abs >= 0.001) return `${(i * 1000).toFixed(2)} mA`;
  return `${(i * 1000000).toFixed(2)} μA`;
}

export function formatResistance(r: number): string {
  if (r >= 1000000) return `${(r / 1000000).toFixed(2)} MΩ`;
  if (r >= 1000) return `${(r / 1000).toFixed(2)} kΩ`;
  return `${r.toFixed(0)} Ω`;
}
