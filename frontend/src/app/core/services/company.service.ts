import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyRequest, CompanyResponse, Page } from '../models';
import { environment } from '../../../environments/environment';
import type { PageQuery } from './catalyst.service';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private readonly apiUrl = `${environment.apiBaseUrl}/companies`;

  constructor(private http: HttpClient) {}

  getCompanies(query: PageQuery = {}): Observable<Page<CompanyResponse>> {
    let params = new HttpParams();
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.size !== undefined) params = params.set('size', query.size);
    if (query.sort) params = params.set('sort', query.sort);
    return this.http.get<Page<CompanyResponse>>(this.apiUrl, { params });
  }

  getAll(): Observable<CompanyResponse[]> {
    return this.http.get<CompanyResponse[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<CompanyResponse> {
    return this.http.get<CompanyResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: CompanyRequest): Observable<CompanyResponse> {
    return this.http.post<CompanyResponse>(this.apiUrl, request);
  }

  update(id: number, request: CompanyRequest): Observable<CompanyResponse> {
    return this.http.put<CompanyResponse>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
