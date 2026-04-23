import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalystRequest, CatalystResponse, Page } from '../models';
import { environment } from '../../../environments/environment';

export interface PageQuery {
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CatalystService {
  private readonly apiUrl = `${environment.apiBaseUrl}/catalysts`;
  private readonly importUrl = `${environment.apiBaseUrl}/import`;

  constructor(private http: HttpClient) {}

  getCatalysts(query: PageQuery = {}): Observable<Page<CatalystResponse>> {
    let params = new HttpParams();
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.size !== undefined) params = params.set('size', query.size);
    if (query.sort) params = params.set('sort', query.sort);
    return this.http.get<Page<CatalystResponse>>(this.apiUrl, { params });
  }

  getCatalystsInRange(from: string, to: string): Observable<CatalystResponse[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<CatalystResponse[]>(`${this.apiUrl}/range`, { params });
  }

  getUndatedCatalysts(): Observable<CatalystResponse[]> {
    return this.http.get<CatalystResponse[]>(`${this.apiUrl}/undated`);
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
