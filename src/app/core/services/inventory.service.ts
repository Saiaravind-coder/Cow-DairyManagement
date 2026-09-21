import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inventory } from '../models/models';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private apiUrl = 'https://localhost:7088/api/inventory';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(this.apiUrl);
  }

  getById(id: number): Observable<Inventory> {
    return this.http.get<Inventory>(`${this.apiUrl}/${id}`);
  }

  add(item: any): Observable<Inventory> {
    return this.http.post<Inventory>(this.apiUrl, {
      ItemName: item.itemName,
      QuantityRemaining: item.quantityRemaining,
      UnitCost: item.unitCost
    });
  }

  update(id: number, item: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, {
      ItemName: item.itemName,
      QuantityRemaining: item.quantityRemaining,
      UnitCost: item.unitCost
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}