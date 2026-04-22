export type CatalystSource = 'MANUAL' | 'CLINICALTRIALS_GOV';

export interface CatalystResponse {
  id: number;
  catalystType: string;
  expectedDateStart: string | null;
  expectedDateEnd: string | null;
  drugName: string;
  companyName: string;
  companyTicker: string;
  notes: string | null;
  source: CatalystSource | null;
  externalId: string | null;
}

export interface CatalystRequest {
  catalystType: string;
  expectedDateStart: string;
  expectedDateEnd: string | null;
  drugName: string;
  companyId: number;
  notes: string | null;
}
