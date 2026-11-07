import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  readonly notFound = signal(false);

  constructor(private route: ActivatedRoute, private softwareService: SoftwareService) { }

  ngOnInit() {
    this.softwareName = this.route.snapshot.paramMap.get('name') ?? '';
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
