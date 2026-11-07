import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {

  constructor(private httpClient: HttpClient) { }

  public submitNewSoftware(payload: NewSoftwarePayload): Observable<SubmissionResult> {
    return this.httpClient.post<SubmissionResult>('/api/software', payload);
  }

  public submitNewVersion(softwareName: string, payload: NewVersionPayload): Observable<SubmissionResult> {
    return this.httpClient.post<SubmissionResult>('/api/software/' + softwareName + '/versions', payload);
  }

  public submitNewReport(softwareName: string, versionId: string, payload: NewReportPayload): Observable<SubmissionResult> {
    return this.httpClient.post<SubmissionResult>(
      '/api/software/' + softwareName + '/versions/' + versionId + '/reports', payload
    );
  }
}

export interface SubmissionResult {
  prUrl: string;
  prNumber: number;
}

export interface NewSoftwarePayload {
  name: string;
  links: { [key: string]: string };
  cpu: string[];
  free: boolean;
  categories: string[];
}

export interface NewVersionPayload {
  version: string;
  download: string;
}

export interface NewReportPayload {
  status: string;
  description: string;
}

/** Field-name -> message, as returned by the backend on a 400 validation failure. */
export type ValidationErrors = { [field: string]: string };
