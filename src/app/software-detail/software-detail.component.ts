import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ScreenshotLightboxComponent } from '../screenshot-lightbox/screenshot-lightbox.component';
import { CategoryService } from '../category.service';
import { SoftwareService, SoftwareDetail } from '../software.service';

@Component({
  selector: 'app-software-detail',
  templateUrl: './software-detail.component.html',
  styleUrls: ['./software-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class SoftwareDetailComponent implements OnInit {
  softwareName: string = '';
  readonly software = signal<SoftwareDetail | null>(null);
  /** Category id -> display name; ids fall back to themselves until/unless this loads. */
  readonly categoryNames = signal<Record<string, string>>({});
  readonly notFound = signal(false);

  constructor(private route: ActivatedRoute, private softwareService: SoftwareService, private dialog: MatDialog, private categoryService: CategoryService) { }

  linkEntries(software: SoftwareDetail): { key: string; url: string }[] {
    return Object.entries(software.links ?? {})
      .filter(([, url]) => !!url)
      .map(([key, url]) => ({ key, url }));
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

  ngOnInit() {
    this.softwareName = this.route.snapshot.paramMap.get('name') ?? '';
    this.categoryService.getCategories().subscribe({
      next: cats => this.categoryNames.set(Object.fromEntries(cats.map(c => [c.id, c.name]))),
      error: () => { /* keep showing ids */ }
    });
    this.softwareService.getSoftware(this.softwareName).subscribe({
      next: v => {
        this.software.set(v);
      },
      error: () => {
        this.notFound.set(true);
      }
    });
  }
}
