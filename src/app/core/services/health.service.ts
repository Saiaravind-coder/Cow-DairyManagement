import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HealthRecord } from '../models/models';

export interface HealthPagedResult {
  data: HealthRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class HealthService {
  private apiUrl = 'https://localhost:7088/api/health';

  constructor(private http: HttpClient) {}

  getPaged(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    disease?: string,
    pregnancy?: string,
    fromDate?: string,
    toDate?: string
  ): Observable<HealthPagedResult> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (search) params = params.set('search', search);
    if (disease) params = params.set('disease', disease);
    if (pregnancy) params = params.set('pregnancy', pregnancy);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<HealthPagedResult>(this.apiUrl, { params });
  }

  getAll(): Observable<HealthRecord[]> {
    return this.http.get<HealthRecord[]>(`${this.apiUrl}/all`);
  }

  add(record: any): Observable<HealthRecord> {
    return this.http.post<HealthRecord>(this.apiUrl, {
      CowId: record.cowId,
      CheckupDate: record.checkupDate,
      PregnancyMonth: record.pregnancyMonth,
      DiseaseName: record.diseaseName,
      MedicationGiven: record.medicationGiven,
      MedicalCost: record.medicalCost,
      Notes: record.notes
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}