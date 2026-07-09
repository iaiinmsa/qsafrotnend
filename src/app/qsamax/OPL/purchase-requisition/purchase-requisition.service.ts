import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';// Ajusta la ruta si es necesario
import { requestHeader } from './interfaces/requestHeader'; // Ajusta la ruta
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PurchaseRequisitionService {

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la bandeja de tareas según los parámetros enviados desde el componente.
   */
  getBandejaTareas(tipoVista: string, emailUsuario: string, usuarioParam: string ,isHistorial: boolean ): Observable<requestHeader[]> {
    // 1. Asignamos los parámetros que vienen de la pantalla/componente
    let params = new HttpParams()
      .set('tipoVista', tipoVista)
      .set('emailUsuario', emailUsuario)
      .set('historial', isHistorial ? 'true' : 'false' );;

    // 2. Usamos el environment en lugar de localhost y pasamos los params
    return this.http.get<requestHeader[]>(`${environment.apiUrlqsa}/bandeja`, { params });
  }

  /**
   * Actualiza el estado de una solicitud con opción de agregar un comentario.
   */
  cambiarEstado(numero: string, emailUsuario: string, nuevoEstado: number, comentario: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('numero', numero)
      .set('emailUsuario', emailUsuario)
      .set('nuevoEstado', nuevoEstado.toString());

    if (comentario) {
      params = params.set('comentario', comentario);
    }

    return this.http.patch<any>(`${environment.apiUrlqsa}/cambiar-estado`, null, { params });
  }


  obtenerTiemposEficiencia(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrlqsa}/tiempos`);
  }
  
}