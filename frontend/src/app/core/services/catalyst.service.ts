import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalystRequest, CatalystResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CatalystService {
  private readonly apiUrl = `${environment.apiBaseUrl}/catalysts`;
  private readonly importUrl = `${environment.apiBaseUrl}/import`;

  constructor(private http: HttpClient) {}

  getAllCatalysts(): Observable<CatalystResponse[]> {
    return this.http.get<CatalystResponse[]>(this.apiUrl);
  }

  getCatalystById(id: number): Observable<CatalystResponse> {
    return this.http.get<CatalystResponse>(`${this.apiUrl}/${id}`);
  }

  createCatalyst(catalyst: CatalystRequest): Observable<CatalystResponse> {
    return this.http.post<CatalystResponse>(this.apiUrl, catalyst);
  }

  updateCatalyst(id: number, catalyst: CatalystRequest): Observable<CatalystResponse> {
    return this.http.put<CatalystResponse>(`${this.apiUrl}/${id}`, catalyst);
  }

  deleteCatalyst(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  importFromClinicalTrials(companyId: number): Observable<{ imported: number; message: string }> {
    return this.http.post<{ imported: number; message: string }>(
      `${this.importUrl}/clinicaltrials/${companyId}`,
      {},
    );
  }
}
