import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SoftwareService, SoftwareDetail } from '../software.service';

@Component({
  selector: 'app-software-detail',
  templateUrl: './software-detail.component.html',
  styleUrls: ['./software-detail.component.css'],
  standalone: false
})
export class SoftwareDetailComponent implements OnInit {
  softwareName: string = '';
  software: SoftwareDetail | null = null;
  notFound = false;

  constructor(private route: ActivatedRoute, private softwareService: SoftwareService) { }

  ngOnInit() {
    this.softwareName = this.route.snapshot.paramMap.get('name') ?? '';
    this.softwareService.getSoftware(this.softwareName).subscribe({
      next: v => {
        this.software = v;
      },
      error: () => {
        this.notFound = true;
      }
    });
  }
}
