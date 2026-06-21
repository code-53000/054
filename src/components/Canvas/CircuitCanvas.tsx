import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';
import { useCircuitStore } from '@/store';
import { CircuitNode } from './CircuitNode';
import { CircuitWire, PendingWire } from './CircuitWire';
import { screenToWorld, getPinWorldPosition } from '@/utils/pin-position';
import { getComponentDef } from '@/components-def';
import type { ComponentType } from '@/types/circuit';

interface DropEvent {
  dataTransfer: {
    getData: (type: string) => string;
  };
}

const GRID_SIZE = 20;

export const CircuitCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const components = useCircuitStore((s) => s.components);
  const wires = useCircuitStore((s) => s.wires);
  const solverResult = useCircuitStore((s) => s.solverResult);
  const pendingWire = useCircuitStore((s) => s.pendingWire);
  const scale = useCircuitStore((s) => s.scale);
  const offsetX = useCircuitStore((s) => s.offsetX);
  const offsetY = useCircuitStore((s) => s.offsetY);

  const addComponent = useCircuitStore((s) => s.addComponent);
  const updatePendingWire = useCircuitStore((s) => s.updatePendingWire);
  const cancelWire = useCircuitStore((s) => s.cancelWire);
  const finishWire = useCircuitStore((s) => s.finishWire);
  const setViewTransform = useCircuitStore((s) => s.setViewTransform);
  const selectComponent = useCircuitStore((s) => s.selectComponent);
  const selectWire = useCircuitStore((s) => s.selectWire);

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - offsetX) / oldScale,
      y: (pointer.y - offsetY) / oldScale,
    };

    const delta = e.evt.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, oldScale * delta));
    const newOffsetX = pointer.x - mousePointTo.x * newScale;
    const newOffsetY = pointer.y - mousePointTo.y * newScale;

    setViewTransform(newScale, newOffsetX, newOffsetY);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!pendingWire) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const world = screenToWorld(pos.x, pos.y, scale, offsetX, offsetY);
    updatePendingWire(world.x, world.y);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (pendingWire) {
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const world = screenToWorld(pos.x, pos.y, scale, offsetX, offsetY);

      let closest: { compId: string; pinId: string; dist: number } | null = null;
      const snapDist = 15 / scale;

      for (const comp of components) {
        const def = getComponentDef(comp.type);
        for (const pin of def.pins) {
          const pinPos = getPinWorldPosition(comp, pin.id);
          const dx = pinPos.x - world.x;
          const dy = pinPos.y - world.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < snapDist && (!closest || dist < closest.dist)) {
            closest = { compId: comp.id, pinId: pin.id, dist };
          }
        }
      }

      if (closest) {
        finishWire(closest.compId, closest.pinId);
      } else {
        cancelWire();
      }
      return;
    }

    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectComponent(null);
      selectWire(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('component-type') as ComponentType;
    if (!type) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY, scale, offsetX, offsetY);

    const snappedX = Math.round(world.x / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(world.y / GRID_SIZE) * GRID_SIZE;

    addComponent(type, snappedX, snappedY);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pendingWire) {
      cancelWire();
    }
  };

  const renderGrid = () => {
    const lines: React.ReactNode[] = [];
    const w = stageSize.width / scale + Math.abs(offsetX) / scale + 200;
    const h = stageSize.height / scale + Math.abs(offsetY) / scale + 200;
    const startX = -Math.abs(offsetX) / scale - 200;
    const startY = -Math.abs(offsetY) / scale - 200;

    for (let x = Math.floor(startX / GRID_SIZE) * GRID_SIZE; x < startX + w; x += GRID_SIZE) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, startY + h]}
          stroke="#1e293b"
          strokeWidth={0.5}
          listening={false}
        />,
      );
    }
    for (let y = Math.floor(startY / GRID_SIZE) * GRID_SIZE; y < startY + h; y += GRID_SIZE) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, startX + w, y]}
          stroke="#1e293b"
          strokeWidth={0.5}
          listening={false}
        />,
      );
    }
    return lines;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#0f172a] relative overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onContextMenu={handleContextMenu}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        x={offsetX}
        y={offsetY}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onClick={handleStageClick}
        onTap={handleStageClick}
        draggable={!pendingWire}
        onDragEnd={(e) => {
          const node = e.target;
          setViewTransform(scale, node.x(), node.y());
        }}
      >
        <Layer>{renderGrid()}</Layer>
        <Layer>
          {wires.map((wire) => (
            <CircuitWire key={wire.id} wire={wire} components={components} />
          ))}
          <PendingWire />
        </Layer>
        <Layer>
          {components.map((comp) => (
            <CircuitNode
              key={comp.id}
              component={comp}
              brightness={solverResult.bulbBrightness[comp.id] || 0}
            />
          ))}
        </Layer>
      </Stage>
      {pendingWire && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/90 text-slate-200 px-4 py-2 rounded-lg text-sm border border-slate-600">
          点击另一引脚完成连线，右键或空白处取消
        </div>
      )}
    </div>
  );
};
