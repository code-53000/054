import React, { useRef } from 'react';
import { Group, Rect, Circle, Text, Line, RegularPolygon } from 'react-konva';
import Konva from 'konva';
import type { CircuitComponent } from '@/types/circuit';
import { getComponentDef } from '@/components-def';
import { useCircuitStore } from '@/store';
import { getPinWorldPosition } from '@/utils/pin-position';

interface Props {
  component: CircuitComponent;
  brightness?: number;
}

const PIN_RADIUS = 6;

export const CircuitNode: React.FC<Props> = ({ component, brightness = 0 }) => {
  const groupRef = useRef<Konva.Group>(null);
  const def = getComponentDef(component.type);
  const selected = useCircuitStore((s) => s.selectedComponentId === component.id);
  const selectComponent = useCircuitStore((s) => s.selectComponent);
  const updateComponentPosition = useCircuitStore((s) => s.updateComponentPosition);
  const startWire = useCircuitStore((s) => s.startWire);
  const toggleSwitch = useCircuitStore((s) => s.toggleSwitch);

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    updateComponentPosition(component.id, e.target.x(), e.target.y());
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (component.type === 'switch') {
      toggleSwitch(component.id);
    }
    selectComponent(component.id);
  };

  const handlePinMouseDown = (e: Konva.KonvaEventObject<MouseEvent>, pinId: string) => {
    e.cancelBubble = true;
    const pos = getPinWorldPosition(component, pinId);
    startWire(component.id, pinId, pos.x, pos.y);
  };

  const renderPins = () => {
    return def.pins.map((pin) => {
      return (
        <Circle
          key={pin.id}
          x={pin.offsetX}
          y={pin.offsetY}
          radius={PIN_RADIUS}
          fill="#0ea5e9"
          stroke="#38bdf8"
          strokeWidth={2}
          draggable={false}
          onMouseDown={(e) => handlePinMouseDown(e, pin.id)}
          onMouseEnter={(e) => {
            (e.target as Konva.Circle).radius(PIN_RADIUS + 2);
            document.body.style.cursor = 'crosshair';
          }}
          onMouseLeave={(e) => {
            (e.target as Konva.Circle).radius(PIN_RADIUS);
            document.body.style.cursor = 'default';
          }}
        />
      );
    });
  };

  const renderComponentBody = () => {
    const w = def.width;
    const h = def.height;
    const stroke = selected ? '#f59e0b' : '#475569';
    const strokeWidth = selected ? 3 : 2;

    switch (component.type) {
      case 'battery': {
        const voltage = component.params.voltage as number;
        return (
          <>
            <Line
              x={-w / 2}
              y={0}
              points={[0, 0, w * 0.3, 0]}
              stroke={stroke}
              strokeWidth={strokeWidth + 3}
            />
            <Line
              x={-w / 2 + w * 0.3}
              y={-h / 3}
              points={[0, 0, 0, (h * 2) / 3]}
              stroke={stroke}
              strokeWidth={strokeWidth + 3}
            />
            <Line
              x={-w / 2 + w * 0.42}
              y={-h / 5}
              points={[0, 0, 0, (h * 2) / 5]}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <Line
              x={-w / 2 + w * 0.42}
              y={0}
              points={[0, 0, w * 0.28, 0]}
              stroke={stroke}
              strokeWidth={strokeWidth + 3}
            />
            <Line
              x={w / 2 - w * 0.3}
              y={0}
              points={[0, 0, w * 0.3, 0]}
              stroke={stroke}
              strokeWidth={strokeWidth + 3}
            />
            <Text
              x={-12}
              y={-h / 2 - 18}
              text={`${voltage}V`}
              fontSize={14}
              fill="#e2e8f0"
              fontStyle="bold"
            />
            <Text x={-w / 2 + w * 0.42 - 5} y={-h / 3 - 15} text="+" fontSize={16} fill="#ef4444" fontStyle="bold" />
            <Text x={-w / 2 + w * 0.1} y={h / 4} text="-" fontSize={18} fill="#60a5fa" fontStyle="bold" />
          </>
        );
      }

      case 'resistor': {
        const resistance = component.params.resistance as number;
        const label = resistance >= 1000 ? `${resistance / 1000}kΩ` : `${resistance}Ω`;
        return (
          <>
            <Line
              x={-w / 2}
              y={0}
              points={[0, 0, w * 0.2, 0]}
              stroke={stroke}
              strokeWidth={strokeWidth + 1}
            />
            <Rect
              x={-w / 2 + w * 0.2}
              y={-h / 2}
              width={w * 0.6}
              height={h}
              fill="#1e293b"
              stroke={stroke}
              strokeWidth={strokeWidth}
              cornerRadius={4}
            />
            <Line
              x={-w / 2 + w * 0.25}
              y={0}
              points={[0, -8, 8, 8, 16, -8, 24, 8, 32, -8]}
              stroke="#94a3b8"
              strokeWidth={2}
            />
            <Line
              x={w / 2 - w * 0.2}
              y={0}
              points={[0, 0, w * 0.2, 0]}
              stroke={stroke}
              strokeWidth={strokeWidth + 1}
            />
            <Text
              x={-label.length * 4}
              y={-h / 2 - 18}
              text={label}
              fontSize={12}
              fill="#cbd5e1"
            />
          </>
        );
      }

      case 'switch': {
        const closed = component.params.closed === true;
        return (
          <>
            <Line
              x={-w / 2}
              y={0}
              points={[0, 0, w * 0.3, 0]}
              stroke={stroke}
              strokeWidth={strokeWidth + 1}
            />
            {closed ? (
              <Line
                x={-w / 2 + w * 0.3}
                y={0}
                points={[0, 0, w * 0.4, 0]}
                stroke="#22c55e"
                strokeWidth={strokeWidth + 2}
              />
            ) : (
              <Line
                x={-w / 2 + w * 0.3}
                y={0}
                points={[0, 0, w * 0.35, -h * 0.7]}
                stroke="#ef4444"
                strokeWidth={strokeWidth + 2}
              />
            )}
            <Circle
              x={-w / 2 + w * 0.3}
              y={0}
              radius={4}
              fill={closed ? '#22c55e' : '#ef4444'}
            />
            <Circle
              x={-w / 2 + w * 0.7}
              y={0}
              radius={4}
              fill={closed ? '#22c55e' : '#64748b'}
            />
            <Line
              x={w / 2 - w * 0.3}
              y={0}
              points={[0, 0, w * 0.3, 0]}
              stroke={stroke}
              strokeWidth={strokeWidth + 1}
            />
            <Text
              x={-10}
              y={-h / 2 - 18}
              text={closed ? '闭合' : '断开'}
              fontSize={12}
              fill={closed ? '#22c55e' : '#ef4444'}
            />
          </>
        );
      }

      case 'bulb': {
        const glowColor = brightness > 0.1 ? '#fbbf24' : '#475569';
        const fillColor = brightness > 0.5 ? '#fef08a' : brightness > 0.1 ? '#fde047' : '#1e293b';
        return (
          <>
            <Line
              x={0}
              y={-h / 2}
              points={[0, 0, 0, -h * 0.15]}
              stroke={stroke}
              strokeWidth={strokeWidth + 1}
            />
            <RegularPolygon
              x={0}
              y={0}
              sides={50}
              radius={w / 2 - 2}
              fill={fillColor}
              stroke={glowColor}
              strokeWidth={brightness > 0.1 ? 2 + brightness * 3 : 2}
              shadowColor="#fbbf24"
              shadowBlur={brightness * 30}
              shadowOpacity={brightness}
            />
            <Line
              x={-w * 0.2}
              y={-h * 0.05}
              points={[0, 0, w * 0.15, h * 0.15, w * 0.3, -h * 0.05]}
              stroke={brightness > 0.3 ? '#92400e' : '#64748b'}
              strokeWidth={1.5}
            />
            <Line
              x={0}
              y={h / 2 - h * 0.3}
              points={[0, 0, 0, h * 0.3]}
              stroke={stroke}
              strokeWidth={strokeWidth + 1}
            />
            <Rect
              x={-w * 0.25}
              y={h / 2 - h * 0.25}
              width={w * 0.5}
              height={h * 0.15}
              fill="#334155"
              stroke={stroke}
              strokeWidth={1.5}
              cornerRadius={2}
            />
            {brightness > 0.1 && (
              <RegularPolygon
                x={0}
                y={0}
                sides={50}
                radius={w / 2 + brightness * 10}
                fill="transparent"
                stroke="#fbbf24"
                strokeWidth={1}
                opacity={brightness * 0.5}
              />
            )}
          </>
        );
      }
    }
    return null;
  };

  return (
    <Group
      ref={groupRef}
      x={component.x}
      y={component.y}
      rotation={component.rotation}
      draggable
      onDragMove={handleDragMove}
      onClick={handleClick}
      onTap={handleClick}
    >
      {renderComponentBody()}
      {renderPins()}
    </Group>
  );
};
