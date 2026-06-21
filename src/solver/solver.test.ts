import { describe, it, expect } from 'vitest';
import { solveCircuit } from './index';
import type { CircuitComponent, Wire } from '@/types/circuit';

describe('电路求解器', () => {
  describe('基本检测', () => {
    it('空电路应返回错误', () => {
      const result = solveCircuit({ components: [], wires: [] });
      expect(result.isConnected).toBe(false);
      expect(result.errors).toContain('电路中没有元件');
    });

    it('没有电池应返回错误', () => {
      const components: CircuitComponent[] = [
        {
          id: 'r1',
          type: 'resistor',
          x: 0,
          y: 0,
          rotation: 0,
          params: { resistance: 100 },
        },
      ];
      const result = solveCircuit({ components, wires: [] });
      expect(result.isConnected).toBe(false);
      expect(result.errors).toContain('电路中没有电池作为电源');
    });
  });

  describe('通断检测', () => {
    it('未连接导线时电路未通', () => {
      const components: CircuitComponent[] = [
        {
          id: 'b1',
          type: 'battery',
          x: 0,
          y: 0,
          rotation: 0,
          params: { voltage: 9 },
        },
        {
          id: 'r1',
          type: 'resistor',
          x: 100,
          y: 0,
          rotation: 0,
          params: { resistance: 100 },
        },
      ];
      const result = solveCircuit({ components, wires: [] });
      expect(result.isConnected).toBe(false);
    });

    it('简单串联电路应连通', () => {
      const components: CircuitComponent[] = [
        {
          id: 'b1',
          type: 'battery',
          x: 0,
          y: 0,
          rotation: 0,
          params: { voltage: 9 },
        },
        {
          id: 'r1',
          type: 'resistor',
          x: 150,
          y: 0,
          rotation: 0,
          params: { resistance: 100 },
        },
      ];
      const wires: Wire[] = [
        { id: 'w1', from: { componentId: 'b1', pinId: 'pos' }, to: { componentId: 'r1', pinId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', pinId: 'b' }, to: { componentId: 'b1', pinId: 'neg' } },
      ];
      const result = solveCircuit({ components, wires });
      expect(result.isConnected).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('欧姆定律计算', () => {
    it('单个电阻的电流计算正确', () => {
      const components: CircuitComponent[] = [
        {
          id: 'b1',
          type: 'battery',
          x: 0,
          y: 0,
          rotation: 0,
          params: { voltage: 9 },
        },
        {
          id: 'r1',
          type: 'resistor',
          x: 150,
          y: 0,
          rotation: 0,
          params: { resistance: 100 },
        },
      ];
      const wires: Wire[] = [
        { id: 'w1', from: { componentId: 'b1', pinId: 'pos' }, to: { componentId: 'r1', pinId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', pinId: 'b' }, to: { componentId: 'b1', pinId: 'neg' } },
      ];
      const result = solveCircuit({ components, wires });
      expect(result.branchCurrents['r1']).toBeCloseTo(0.09, 4);
    });

    it('电压和电阻变化时电流应随之变化', () => {
      const components: CircuitComponent[] = [
        {
          id: 'b1',
          type: 'battery',
          x: 0,
          y: 0,
          rotation: 0,
          params: { voltage: 12 },
        },
        {
          id: 'r1',
          type: 'resistor',
          x: 150,
          y: 0,
          rotation: 0,
          params: { resistance: 1000 },
        },
      ];
      const wires: Wire[] = [
        { id: 'w1', from: { componentId: 'b1', pinId: 'pos' }, to: { componentId: 'r1', pinId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', pinId: 'b' }, to: { componentId: 'b1', pinId: 'neg' } },
      ];
      const result = solveCircuit({ components, wires });
      expect(result.branchCurrents['r1']).toBeCloseTo(0.012, 4);
    });
  });

  describe('开关控制', () => {
    it('开关断开时电路不通', () => {
      const components: CircuitComponent[] = [
        {
          id: 'b1',
          type: 'battery',
          x: 0,
          y: 0,
          rotation: 0,
          params: { voltage: 9 },
        },
        {
          id: 's1',
          type: 'switch',
          x: 150,
          y: 0,
          rotation: 0,
          params: { closed: false },
        },
        {
          id: 'b1b',
          type: 'bulb',
          x: 300,
          y: 0,
          rotation: 0,
          params: { resistance: 50 },
        },
      ];
      const wires: Wire[] = [
        { id: 'w1', from: { componentId: 'b1', pinId: 'pos' }, to: { componentId: 's1', pinId: 'a' } },
        { id: 'w2', from: { componentId: 's1', pinId: 'b' }, to: { componentId: 'b1b', pinId: 'a' } },
        { id: 'w3', from: { componentId: 'b1b', pinId: 'b' }, to: { componentId: 'b1', pinId: 'neg' } },
      ];
      const result = solveCircuit({ components, wires });
      expect(result.isConnected).toBe(false);
    });

    it('开关闭合时电路导通并点亮灯泡', () => {
      const components: CircuitComponent[] = [
        {
          id: 'b1',
          type: 'battery',
          x: 0,
          y: 0,
          rotation: 0,
          params: { voltage: 9 },
        },
        {
          id: 's1',
          type: 'switch',
          x: 150,
          y: 0,
          rotation: 0,
          params: { closed: true },
        },
        {
          id: 'b1b',
          type: 'bulb',
          x: 300,
          y: 0,
          rotation: 0,
          params: { resistance: 50 },
        },
      ];
      const wires: Wire[] = [
        { id: 'w1', from: { componentId: 'b1', pinId: 'pos' }, to: { componentId: 's1', pinId: 'a' } },
        { id: 'w2', from: { componentId: 's1', pinId: 'b' }, to: { componentId: 'b1b', pinId: 'a' } },
        { id: 'w3', from: { componentId: 'b1b', pinId: 'b' }, to: { componentId: 'b1', pinId: 'neg' } },
      ];
      const result = solveCircuit({ components, wires });
      expect(result.isConnected).toBe(true);
      expect(result.bulbBrightness['b1b']).toBeGreaterThan(0);
      expect(result.branchCurrents['b1b']).toBeCloseTo(0.18, 3);
    });
  });

  describe('灯泡亮度', () => {
    it('灯泡应有正确的亮度值', () => {
      const components: CircuitComponent[] = [
        {
          id: 'b1',
          type: 'battery',
          x: 0,
          y: 0,
          rotation: 0,
          params: { voltage: 9 },
        },
        {
          id: 'b1b',
          type: 'bulb',
          x: 150,
          y: 0,
          rotation: 0,
          params: { resistance: 50 },
        },
      ];
      const wires: Wire[] = [
        { id: 'w1', from: { componentId: 'b1', pinId: 'pos' }, to: { componentId: 'b1b', pinId: 'a' } },
        { id: 'w2', from: { componentId: 'b1b', pinId: 'b' }, to: { componentId: 'b1', pinId: 'neg' } },
      ];
      const result = solveCircuit({ components, wires });
      expect(result.bulbBrightness['b1b']).toBeCloseTo(1, 3);
    });

    it('串联电阻后灯泡变暗', () => {
      const components: CircuitComponent[] = [
        {
          id: 'b1',
          type: 'battery',
          x: 0,
          y: 0,
          rotation: 0,
          params: { voltage: 9 },
        },
        {
          id: 'r1',
          type: 'resistor',
          x: 150,
          y: 0,
          rotation: 0,
          params: { resistance: 50 },
        },
        {
          id: 'b1b',
          type: 'bulb',
          x: 300,
          y: 0,
          rotation: 0,
          params: { resistance: 50 },
        },
      ];
      const wires: Wire[] = [
        { id: 'w1', from: { componentId: 'b1', pinId: 'pos' }, to: { componentId: 'r1', pinId: 'a' } },
        { id: 'w2', from: { componentId: 'r1', pinId: 'b' }, to: { componentId: 'b1b', pinId: 'a' } },
        { id: 'w3', from: { componentId: 'b1b', pinId: 'b' }, to: { componentId: 'b1', pinId: 'neg' } },
      ];
      const result = solveCircuit({ components, wires });
      expect(result.isConnected).toBe(true);
      expect(result.bulbBrightness['b1b']).toBeGreaterThan(0);
      expect(result.bulbBrightness['b1b']).toBeLessThan(1);
    });
  });
});
