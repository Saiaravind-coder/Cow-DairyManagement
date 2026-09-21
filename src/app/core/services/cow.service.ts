import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cow } from '../models/models';

export interface CowPagedResult {
  data: Cow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class CowService {
  private apiUrl = 'https://localhost:7088/api/cows';

  constructor(private http: HttpClient) {}

  // ✅ Server-side paginated
  getPaged(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    status?: string,
    breed?: string
  ): Observable<CowPagedResult> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    if (breed) params = params.set('breed', breed);

    return this.http.get<CowPagedResult>(this.apiUrl, { params });
  }

  // ✅ For dropdowns — no pagination
  getAll(): Observable<Cow[]> {
    return this.http.get<Cow[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<Cow> {
    return this.http.get<Cow>(`${this.apiUrl}/${id}`);
  }

  create(cow: any): Observable<Cow> {
    return this.http.post<Cow>(this.apiUrl, {
      Name: cow.name,
      TagId: cow.tagId || null,
      Breed: cow.breed || null,
      ParentId: cow.parentId || null,
      Status: cow.status || 'Active',
      HasLoan: cow.hasLoan ?? false,
      HasInsurance: cow.hasInsurance ?? false,
      ImageUrl: cow.imageUrl || null,
      Gender: cow.gender || null,
      DateOfBirth: cow.dateOfBirth || null,
      Weight: cow.weight || null,
      Height: cow.height || null
    });
  }

  update(id: number, cow: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, {
      Name: cow.name,
      TagId: cow.tagId || null,
      Breed: cow.breed || null,
      ParentId: cow.parentId || null,
      Status: cow.status || 'Active',
      HasLoan: cow.hasLoan ?? false,
      HasInsurance: cow.hasInsurance ?? false,
      ImageUrl: cow.imageUrl || null,
      Gender: cow.gender || null,
      DateOfBirth: cow.dateOfBirth || null,
      Weight: cow.weight || null,
      Height: cow.height || null
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}