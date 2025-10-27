import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VacationRequestService {
  private baseUrl = `${environment.apiUrlqsa}/vacation-requests`;

  constructor(private http: HttpClient) {}

  getRegisteredRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/registered`);
  }

   updateStatus(id: number, currentStatus: string, newStatus: string): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/update-status?currentStatus=${currentStatus}`,
      { id, newStatus }
    );
  }


  getRequestsByEmail(email: string) {
  const url = `${this.baseUrl}/registered-by-email?email=${encodeURIComponent(email)}`;
  return this.http.get<any[]>(url);
}


getRequestsBySupervisor(supervisorCode: string): Observable<any[]> {
  const url = `${this.baseUrl}/by-supervisor/${encodeURIComponent(supervisorCode)}`;
  return this.http.get<any[]>(url);
}

getRequestsByEmployee(employeecode: string): Observable<any[]> {
  const url = `${this.baseUrl}/approved-by-employee/${encodeURIComponent(employeecode)}`;
  return this.http.get<any[]>(url);
}



updateRequester(id: number, requester: string) {
  return this.http.patch(`${this.baseUrl}/${id}/update-requester`, { requester });
}

approveBySupervisor(id: number, supervisedBy: string, approved: boolean): Observable<any> {
  return this.http.patch(
    `${this.baseUrl}/${id}/approve-by-supervisor`,
    {
      supervisedBy,
      approved
    }
  );
}



updateDaysVacationAvailable(id: number, days: number, vacationPeriod: string) {
  return this.http.patch(`${this.baseUrl}/${id}/days`, {
    days,
    vacationPeriod
  });
}


  
}
