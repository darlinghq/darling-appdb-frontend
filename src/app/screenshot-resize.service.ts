import { Injectable } from '@angular/core';
import { resizeImageToDataUrl } from './screenshot-resize';

/**
 * Thin injectable wrapper around resizeImageToDataUrl so components can have
 * it swapped out via Angular's DI in tests (vi.mock on relative imports
 * isn't supported under Angular's vitest integration).
 */
@Injectable({ providedIn: 'root' })
export class ScreenshotResizeService {
  resize(file: File): Promise<string> {
    return resizeImageToDataUrl(file);
  }
}
