export async function exportCanvasAsImage(filename: string): Promise<void> {
  const stageContainer = document.querySelector('.konvajs-content');
  if (!stageContainer) throw new Error('Canvas not found');

  const canvas = stageContainer.querySelector('canvas');
  if (!canvas) throw new Error('Canvas not found');

  const w = canvas.width;
  const h = canvas.height;

  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = w;
  bgCanvas.height = h;
  const bgCtx = bgCanvas.getContext('2d');
  if (!bgCtx) throw new Error('Cannot create context');

  bgCtx.fillStyle = '#0f172a';
  bgCtx.fillRect(0, 0, w, h);
  bgCtx.drawImage(canvas, 0, 0);

  return new Promise((resolve, reject) => {
    bgCanvas.toBlob((blob) => {
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
  });
}
