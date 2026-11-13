import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BundlePayload } from './bundle-payload';

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {

  constructor(private httpClient: HttpClient) { }

  /** Opens ONE pull request for any combination of software, version and report. */
  public submitBundle(payload: BundlePayload): Observable<SubmissionResult> {
    return this.httpClient.post<SubmissionResult>('/api/submissions', payload);
  }
}

export interface SubmissionResult {
  prUrl: string;
  prNumber: number;
}

/** Field-name -> message, as returned by the backend on a 400 validation failure. */
export type ValidationErrors = { [field: string]: string };
