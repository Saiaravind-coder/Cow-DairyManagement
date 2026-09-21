import { Injectable } from '@angular/core';
import { HttpClient,HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MilkProduction } from '../models/models';

export interface MilkPagedResult{
  data:MilkProduction[];
  totalCount:number;
  page:number;
  pageSize: number;
  totalPages:number;
}
@Injectable({ providedIn: 'root' })
export class MilkService {
  private apiUrl = 'https://localhost:7088/api/milk';

  constructor(private http: HttpClient) {}

  getPaged(
    page:number=1,
    pageSize:number=10,
    search?: string,
    shift?:string,
    fromDate?:string,
    toDate?:string,
  ):Observable<MilkPagedResult>{
    let params=new HttpParams()
    .set('page',page.toString())
    .set('pageSize',pageSize.toString());

    if(search) params=params.set('search',search);
    if(shift) params=params.set('shift',shift);
    if(fromDate) params=params.set('fromDate',fromDate);
    if(toDate) params=params.set('toDate',toDate);
    return this.http.get<MilkPagedResult>(this.apiUrl, { params }); 
  }

  getAll(): Observable<MilkProduction[]> {
    return this.http.get<MilkProduction[]>(this.apiUrl);
  }
  getByCow(cowId: number): Observable<MilkProduction[]> {
  return this.http.get<MilkProduction[]>(`${this.apiUrl}/bycow/${cowId}`);
}

  getById(id: number): Observable<MilkProduction> {
    return this.http.get<MilkProduction>(`${this.apiUrl}/${id}`);
  }

  log(milk: any): Observable<MilkProduction> {
    return this.http.post<MilkProduction>(this.apiUrl, {
      CowId: milk.cowId,
      Quantity: milk.quantity,
      QualityDegree: milk.qualityDegree,
      PricePerLiter: milk.pricePerLiter,
      Shift: milk.shift,
      LogDate: milk.logDate
    });
  }

  update(id: number, milk: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, {
      CowId: milk.cowId,
      Quantity: milk.quantity,
      QualityDegree: milk.qualityDegree,
      PricePerLiter: milk.pricePerLiter,
      Shift: milk.shift,
      LogDate: milk.logDate
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}