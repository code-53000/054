import type { CircuitComponent, Wire } from '@/types/circuit';

interface ExampleCircuit {
  name: string;
  description: string;
  components: CircuitComponent[];
  wires: Wire[];
}

export const EXAMPLE_CIRCUITS: ExampleCircuit[] = [
  {
    name: '最简单的灯泡电路',
    description: '电池直接连接灯泡，演示最基础的电路',
    components: [
      {
        id: 'b1',
        type: 'battery',
        x: 100,
        y: 200,
        rotation: 0,
        params: { voltage: 9 },
      },
      {
        id: 'bulb1',
        type: 'bulb',
        x: 350,
        y: 200,
        rotation: 90,
        params: { resistance: 50 },
      },
    ],
    wires: [
      { id: 'w1', from: { componentId: 'b1', pinId: 'pos' }, to: { componentId: 'bulb1', pinId: 'a' } },
      { id: 'w2', from: { componentId: 'bulb1', pinId: 'b' }, to: { componentId: 'b1', pinId: 'neg' } },
    ],
  },
  {
    name: '开关控制灯泡',
    description: '加入开关控制灯泡亮灭，点击开关可切换状态',
    components: [
      {
        id: 'b1',
        type: 'battery',
        x: 100,
        y: 200,
        rotation: 0,
        params: { voltage: 9 },
      },
      {
        id: 's1',
        type: 'switch',
        x: 280,
        y: 200,
        rotation: 0,
        params: { closed: true },
      },
      {
        id: 'bulb1',
        type: 'bulb',
        x: 460,
        y: 200,
        rotation: 90,
        params: { resistance: 50 },
      },
    ],
    wires: [
      { id: 'w1', from: { componentId: 'b1', pinId: 'pos' }, to: { componentId: 's1', pinId: 'a' } },
      { id: 'w2', from: { componentId: 's1', pinId: 'b' }, to: { componentId: 'bulb1', pinId: 'a' } },
      { id: 'w3', from: { componentId: 'bulb1', pinId: 'b' }, to: { componentId: 'b1', pinId: 'neg' } },
    ],
  },
  {
    name: '串联电阻分压',
    description: '电阻与灯泡串联，灯泡亮度变暗，演示分压原理',
    components: [
      {
        id: 'b1',
        type: 'battery',
        x: 80,
        y: 200,
        rotation: 0,
        params: { voltage: 9 },
      },
      {
        id: 'r1',
        type: 'resistor',
        x: 250,
        y: 200,
        rotation: 0,
        params: { resistance: 100 },
      },
      {
        id: 's1',
        type: 'switch',
        x: 420,
        y: 200,
        rotation: 0,
        params: { closed: true },
      },
      {
        id: 'bulb1',
        type: 'bulb',
        x: 590,
        y: 200,
        rotation: 90,
        params: { resistance: 50 },
      },
    ],
    wires: [
      { id: 'w1', from: { componentId: 'b1', pinId: 'pos' }, to: { componentId: 'r1', pinId: 'a' } },
      { id: 'w2', from: { componentId: 'r1', pinId: 'b' }, to: { componentId: 's1', pinId: 'a' } },
      { id: 'w3', from: { componentId: 's1', pinId: 'b' }, to: { componentId: 'bulb1', pinId: 'a' } },
      { id: 'w4', from: { componentId: 'bulb1', pinId: 'b' }, to: { componentId: 'b1', pinId: 'neg' } },
    ],
  },
  {
    name: '并联双灯泡',
    description: '两个灯泡并联连接，各自独立工作',
    components: [
      {
        id: 'b1',
        type: 'battery',
        x: 100,
        y: 250,
        rotation: 0,
        params: { voltage: 9 },
      },
      {
        id: 's1',
        type: 'switch',
        x: 280,
        y: 250,
        rotation: 0,
        params: { closed: true },
      },
      {
        id: 'bulb1',
        type: 'bulb',
        x: 460,
        y: 140,
        rotation: 0,
        params: { resistance: 50 },
      },
      {
        id: 'bulb2',
        type: 'bulb',
        x: 460,
        y: 360,
        rotation: 0,
        params: { resistance: 50 },
      },
    ],
    wires: [
      { id: 'w1', from: { componentId: 'b1', pinId: 'pos' }, to: { componentId: 's1', pinId: 'a' } },
      { id: 'w2', from: { componentId: 's1', pinId: 'b' }, to: { componentId: 'bulb1', pinId: 'a' } },
      { id: 'w3', from: { componentId: 's1', pinId: 'b' }, to: { componentId: 'bulb2', pinId: 'a' } },
      { id: 'w4', from: { componentId: 'bulb1', pinId: 'b' }, to: { componentId: 'b1', pinId: 'neg' } },
      { id: 'w5', from: { componentId: 'bulb2', pinId: 'b' }, to: { componentId: 'b1', pinId: 'neg' } },
    ],
  },
];
