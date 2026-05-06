import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';




@Injectable({ providedIn: 'root' })
export class externalHistoryItemService {
  private baseUrl = `${environment.apiUrlqsa}`;

  constructor(private http: HttpClient) {}


getitemhistory(codigo: string): Observable<any[]> {
    // Configuramos el parámetro ?artCode=
    const params = new HttpParams().set('artCode', codigo);
    
    return this.http.get<any[]>(`${this.baseUrl}/externalhistoryitem`, { params });
  }



}
