import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SoftwareService {

  constructor(private httpClient: HttpClient) { }

  public getSoftware(name: string): Observable<SoftwareDetail> {
    return this.httpClient.get<SoftwareDetail>('/api/software/' + name);
  }
}

export interface ReportData {
  status: string;
  description: string;
  screenshots?: string[];
}

export interface VersionData {
  version: string;
  download: string;
  issues: number[];
  lastReport: ReportData | null;
}

export interface SoftwareDetail {
  name: string;
  links: { [key: string]: string };
  cpu: string[];
  free: boolean;
  categories: string[];
  lastVersion: VersionData | null;
}
