import React from 'react';
import { Line } from 'react-konva';
import Konva from 'konva';
import type { Wire, CircuitComponent } from '@/types/circuit';
import { useCircuitStore } from '@/store';
import { getPinWorldPosition } from '@/utils/pin-position';
import { formatCurrent } from '@/solver';

interface Props {
  wire: Wire;
  components: CircuitComponent[];
}

export const CircuitWire: React.FC<Props> = ({ wire, components }) => {
  const selected = useCircuitStore((s) => s.selectedWireId === wire.id);
  const selectWire = useCircuitStore((s) => s.selectWire);
  const branchCurrents = useCircuitStore((s) => s.solverResult.branchCurrents);
  const isConnected = useCircuitStore((s) => s.solverResult.isConnected);

  const fromComp = components.find((c) => c.id === wire.from.componentId);
  const toComp = components.find((c) => c.id === wire.to.componentId);

  if (!fromComp || !toComp) return null;

  const from = getPinWorldPosition(fromComp, wire.from.pinId);
  const to = getPinWorldPosition(toComp, wire.to.pinId);

  const current = branchCurrents[wire.id] || 0;
  const hasCurrent = isConnected && Math.abs(current) > 0.000001;
  const strokeColor = selected ? '#f59e0b' : hasCurrent ? '#38bdf8' : '#64748b';
  const strokeWidth = selected ? 4 : 2.5;

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  return (
    <>
      <Line
        points={[from.x, from.y, midX, from.y, midX, to.y, to.x, to.y]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        tension={0}
        onClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
          e.cancelBubble = true;
          selectWire(wire.id);
        }}
        hitStrokeWidth={10}
      />
      {hasCurrent && (
        <Line
          points={[from.x, from.y, midX, from.y, midX, to.y, to.x, to.y]}
          stroke="#7dd3fc"
          strokeWidth={1.5}
          lineCap="round"
          opacity={0.6}
          listening={false}
        />
      )}
    </>
  );
};

export const PendingWire: React.FC = () => {
  const pendingWire = useCircuitStore((s) => s.pendingWire);
  const components = useCircuitStore((s) => s.components);

  if (!pendingWire) return null;

  const fromComp = components.find((c) => c.id === pendingWire.fromComponentId);
  if (!fromComp) return null;

  const from = getPinWorldPosition(fromComp, pendingWire.fromPinId);

  return (
    <Line
      points={[from.x, from.y, pendingWire.mouseX, pendingWire.mouseY]}
      stroke="#0ea5e9"
      strokeWidth={2.5}
      strokeScaleEnabled={false}
      dash={[6, 4]}
      lineCap="round"
      listening={false}
    />
  );
};
