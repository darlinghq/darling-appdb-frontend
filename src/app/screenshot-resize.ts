export const MAX_SCREENSHOT_BYTES = 150 * 1024;
export const MAX_SCREENSHOTS = 5;

/**
 * Downscales and recompresses an image file client-side until its JPEG data
 * URL fits within maxBytes, so screenshots can be committed as plain git
 * blobs (no git-lfs) without bloating the database repo's history.
 */
export function resizeImageToDataUrl(file: File, maxBytes: number = MAX_SCREENSHOT_BYTES): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        resolve(shrinkToFit(img, maxBytes));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image'));
    };
    img.src = objectUrl;
  });
}

function shrinkToFit(img: HTMLImageElement, maxBytes: number): string {
  let maxDimension = 1600;

  for (let attempt = 0; attempt < 8; attempt++) {
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }
    ctx.drawImage(img, 0, 0, width, height);

    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrlByteLength(dataUrl) <= maxBytes) {
        return dataUrl;
      }
    }

    maxDimension = Math.round(maxDimension * 0.7);
  }

  throw new Error('Could not shrink this screenshot below 150KB');
}

function dataUrlByteLength(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.floor(base64.length * 0.75);
}
