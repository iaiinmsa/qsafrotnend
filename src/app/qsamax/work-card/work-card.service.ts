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


  getEmployeeRecords(codigo: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/employee-records/employee/${codigo}`);



  }


   getCategoriesRecords(): Observable<any> {
    return this.http.get(`${this.baseUrl}/employee-records/categories`);
  }


  saveEmployeeRecord(data: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/employee-records`, data);
}


/**
   * Sube el archivo y la metadata (año, código, categoría) al endpoint de SharePoint
   * @param formData Objeto que contiene 'file', 'year', 'codigo' y 'categoria'
   */
  uploadToSharePoint(formData: FormData): Observable<any> {
    // Apuntamos a la ruta de credentials que definiste en el controlador
    return this.http.post(`${this.baseUrl}/credentials/expediente`, formData);
  }


// En work-card.service.ts
downloadFileFromProxy(sharepointUrl: string): Observable<Blob> {
  // Llamamos a nuestro backend pasando la URL de SharePoint como parámetro
  return this.http.get(`${this.baseUrl}/credentials/download-file`, {
    params: { url: sharepointUrl },
    responseType: 'blob'
  });
}



}


