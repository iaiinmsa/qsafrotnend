import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // Esto hace que el servicio esté disponible en toda la aplicación
})
export class StorageService {

  private isBrowser: boolean;
  private userRolesSubject: BehaviorSubject<string[]>; // BehaviorSubject para los roles
  public userRoles$: Observable<string[]>; // Observable público para los roles


  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    let initialRoles: string[] = [];
    if (this.isBrowser) {
      const rolesString = localStorage.getItem('userRoles');
      if (rolesString) {
        try {
          const parsedRoles = JSON.parse(rolesString);
          if (Array.isArray(parsedRoles)) {
            initialRoles = parsedRoles.map(role => String(role));
          }
        } catch (e) { /* Silently fail or log */ }
      }
    }
    this.userRolesSubject = new BehaviorSubject<string[]>(initialRoles);
    this.userRoles$ = this.userRolesSubject.asObservable();
 

  }

  /**
   * Guarda un valor en localStorage si está en el navegador.
   * @param key La clave bajo la cual guardar el valor.
   * @param value El valor (string) a guardar.
   */
  setItem(key: string, value: string): void {
    if (this.isBrowser) {
      localStorage.setItem(key, value);
    } else {
      console.warn(`StorageService: localStorage no está disponible. No se guardó ${key}.`);
    }
  }

  /**
   * Obtiene un valor de localStorage si está en el navegador.
   * @param key La clave del valor a obtener.
   * @returns El valor (string) o null si no se encuentra o no está en el navegador.
   */
  getItem(key: string): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(key);
    }
    console.warn(`StorageService: localStorage no está disponible. No se pudo obtener ${key}.`);
    return null;
  }

  /**
   * Elimina un valor de localStorage si está en el navegador.
   * @param key La clave del valor a eliminar.
   */
  removeItem(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    } else {
      console.warn(`StorageService: localStorage no está disponible. No se eliminó ${key}.`);
    }
  }

  // Métodos específicos para datos comunes (opcional pero útil)

  /**
   * Guarda los roles del usuario (como un array de strings) en localStorage.
   * @param roles Array de strings representando los roles.
   */
  setUserRoles(roles: string[]): void {
    this.setItem('userRoles', JSON.stringify(roles));
    this.userRolesSubject.next(roles); // Emitir los nuevos roles
 
  }

  /**
   * Obtiene los roles del usuario de localStorage.
   * @returns Un array de strings con los roles, o un array vacío si no se encuentran o hay error.
   */
  getUserRoles(): string[] {
    const rolesString = this.getItem('userRoles');
    if (rolesString) {
      try {
        const parsedRoles = JSON.parse(rolesString);
        if (Array.isArray(parsedRoles)) {
          return parsedRoles.map(role => String(role));
        }
      } catch (e) {
        console.error('StorageService: Error al parsear userRoles:', e);
      }
    }
    return []; // Devuelve array vacío si no hay roles o hay error
  }

  /**
   * Guarda el email del usuario actual.
   */
  setCurrentUserEmail(email: string): void {
    this.setItem('currentUserEmail', email);
  }

  /**
   * Obtiene el email del usuario actual.
   */
  getCurrentUserEmail(): string | null {
    return this.getItem('currentUserEmail');
  }

   /**
   * Guarda el ID del departamento.
   */
  setDepartmentId(departmentId: string): void {
    this.setItem('departmentId', departmentId);
  }

  /**
   * Obtiene el ID del departamento.
   */
  getDepartmentId(): string | null {
    return this.getItem('departmentId');
  }

  setDepartmentName(departmentName: string): void {
    this.setItem('departmentName', departmentName);
  }

  /**
   * Obtiene el ID del departamento.
   */
  getDepartmentName(): string | null {
    return this.getItem('departmentName');
  }


   setEmail(email: string): void {
    this.setItem('email', email);
  }

  /**
   * Obtiene el ID del departamento.
   */
  getEmail(): string | null {
    return this.getItem('email');
  }

  /**
   * Limpia los datos de sesión relevantes del usuario.
   */
  clearUserSession(): void {
    this.removeItem('currentUserEmail');
    this.removeItem('userRoles');
     this.removeItem('departmentName');
    this.removeItem('departmentId'); // Si también quieres limpiar esto al cerrar sesión
    // Añade aquí otras claves que deban limpiarse al cerrar sesión
  }
}