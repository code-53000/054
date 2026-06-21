import type { CircuitComponent } from '@/types/circuit';
import { getComponentDef } from '@/components-def';

export function getPinWorldPosition(
  component: CircuitComponent,
  pinId: string,
): { x: number; y: number } {
  const def = getComponentDef(component.type);
  const pin = def.pins.find((p) => p.id === pinId);
  if (!pin) return { x: component.x, y: component.y };

  const rad = (component.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotX = pin.offsetX * cos - pin.offsetY * sin;
  const rotY = pin.offsetX * sin + pin.offsetY * cos;

  return {
    x: component.x + rotX,
    y: component.y + rotY,
  };
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  scale: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  return {
    x: (screenX - offsetX) / scale,
    y: (screenY - offsetY) / scale,
  };
}
