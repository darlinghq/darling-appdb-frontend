import { Component, ChangeDetectionStrategy, HostListener, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ScreenshotLightboxData {
  urls: string[];
  index: number;
}

@Component({
  selector: 'app-screenshot-lightbox',
  templateUrl: './screenshot-lightbox.component.html',
  styleUrls: ['./screenshot-lightbox.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ScreenshotLightboxComponent {
  readonly index = signal(0);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ScreenshotLightboxData,
    private dialogRef: MatDialogRef<ScreenshotLightboxComponent>
  ) {
    this.index.set(data.index);
  }

  get url(): string {
    return this.data.urls[this.index()];
  }

  get hasMultiple(): boolean {
    return this.data.urls.length > 1;
  }

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') { this.step(-1); }
    else if (event.key === 'ArrowRight') { this.step(1); }
  }

  step(delta: number) {
    const n = this.data.urls.length;
    this.index.set((this.index() + delta + n) % n);
  }

  close() {
    this.dialogRef.close();
  }
}
