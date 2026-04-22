export interface CompanyResponse {
  id: number;
  ticker: string;
  name: string;
  notes: string | null;
}

export interface CompanyRequest {
  ticker: string;
  name: string;
  notes: string | null;
}
