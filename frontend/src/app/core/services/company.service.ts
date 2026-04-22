import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyRequest, CompanyResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private readonly apiUrl = 'http://localhost:8080/api/companies';

  constructor(private http: HttpClient) {}

  getAll(): Observable<CompanyResponse[]> {
    return this.http.get<CompanyResponse[]>(this.apiUrl);
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
