import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkCardService {
  private baseUrl = `${environment.apiUrlqsa}`;

  constructor(private http: HttpClient) {}

  getRegisteredRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/report/emplooyees`);
  }

  
  getCarnetEmpleado(codigo: string): Observable<Blob> {
  // Ajustamos la ruta para que coincida con tu backend: /report/:codigo/carnets
  return this.http.get(`${this.baseUrl}/report/${codigo}/carnets`, { 
    responseType: 'blob' 
  });
}



}
