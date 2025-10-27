import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SqlConsultService {
  private apiUrl = 'http://localhost:8000/consultar';

  constructor(private http: HttpClient) {}

  consultar(query: { question: string, table: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, query);
  }
}
