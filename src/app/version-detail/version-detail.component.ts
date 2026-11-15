import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ScreenshotLightboxComponent } from '../screenshot-lightbox/screenshot-lightbox.component';
import { SoftwareService, VersionDetail } from '../software.service';

/** Read-only page for one version: every report submitted for it, newest first. */
@Component({
  selector: 'app-version-detail',
  templateUrl: './version-detail.component.html',
  styleUrls: ['./version-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class VersionDetailComponent implements OnInit {
  softwareName = '';
  versionId = '';
  readonly version = signal<VersionDetail | null>(null);
  readonly notFound = signal(false);

  constructor(private route: ActivatedRoute, private softwareService: SoftwareService, private dialog: MatDialog) { }

  ngOnInit() {
    const params = this.route.snapshot.paramMap;
    this.softwareName = params.get('name') ?? '';
    this.versionId = params.get('version') ?? '';
    this.softwareService.getVersion(this.softwareName, this.versionId).subscribe({
      next: v => this.version.set(v),
      error: () => this.notFound.set(true)
    });
  }

  openScreenshot(event: MouseEvent, urls: string[], index: number) {
    // Let ctrl/cmd/middle-click keep the native open-in-new-tab behaviour.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) { return; }
    event.preventDefault();
    this.dialog.open(ScreenshotLightboxComponent, {
      data: { urls, index },
      maxWidth: '95vw',
      panelClass: 'screenshot-lightbox-panel'
    });
  }
}
