
import type Konva from 'konva';

let stageRef: Konva.Stage | null = null;

export function setExportStage(stage: Konva.Stage | null): void {
  stageRef = stage;
}

export async function exportCanvasAsImage(filename: string): Promise<void> {
  const stage = stageRef;
  if (!stage) {
    throw new Error('Canvas not initialized');
  }

  const dataUrl = stage.toDataURL({
    pixelRatio: 2,
    mimeType: 'image/png',
  });

  const bgColor = '#0f172a';
  const canvas = document.createElement('canvas');
  const size = stage.getSize();
  canvas.width = size.width * 2;
  canvas.height = size.height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot create context');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Failed to render canvas'));
    img.src = dataUrl;
  });
}
