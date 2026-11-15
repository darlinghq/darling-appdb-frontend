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

  /** One version with all of its reports, newest first. */
  public getVersion(name: string, version: string): Observable<VersionDetail> {
    return this.httpClient.get<VersionDetail>(
      `/api/software/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`
    );
  }
}

/** Who submitted a report, from git history. `login` only when reliably known. */
export interface Submitter {
  name: string;
  login?: string;
}

export interface ReportData {
  id?: string;
  status: string;
  description: string;
  screenshots?: string[];
  submittedAt?: string;
  submitter?: Submitter;
}

/** One row of the version history. */
export interface VersionSummary {
  version: string;
  reportCount: number;
  status?: string;
  submittedAt?: string;
}

export interface VersionDetail {
  version: string;
  download: string;
  issues: number[];
  reports: ReportData[];
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
  /** Newest first; absent when talking to an older backend. */
  versions?: VersionSummary[];
}
