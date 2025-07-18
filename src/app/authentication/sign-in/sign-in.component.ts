import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Importa HttpClient y HttpErrorResponse
import { MatIconModule } from '@angular/material/icon'; // <-- IMPORTA MatIconModule AQUÍ
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../../models/auth.interfaces';
import { StorageService } from '../storage.service';




@Component({
    selector: 'app-sign-in',
    standalone: true,
    imports: [RouterLink, MatFormFieldModule, MatInputModule, 
        MatButtonModule, MatCheckboxModule, ReactiveFormsModule, NgIf, MatIconModule ],
    templateUrl: './sign-in.component.html',
    styleUrl: './sign-in.component.scss'
})
export class SignInComponent {

    private apiUrl = environment.apiUrl; // Asume que apiUrl es 'http://localhost:3000'


    constructor(
        private fb: FormBuilder,
        private router: Router,
        public themeService: CustomizerSettingsService,
        private http: HttpClient ,// Inyecta HttpClient
        private storageService: StorageService ,
        @Inject(PLATFORM_ID) private platformId: Object // Opcional para este componente si onSubmit es solo cliente
  
    ) {
        this.authForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            rememberMe: [true] // <-- ESTA LÍNEA ES CRUCIAL Y DEBE ESTAR PRESENTE

        });
    }

    // Password Hide
    hide = true;

    // Form
    authForm: FormGroup;
    isLoading = false; // Para mostrar un spinner o deshabilitar el botón
    loginError: string | null = null; // Para mostrar mensajes de error


    onSubmit() {
        this.loginError = null; // Resetea el error
        console.log('API URL en uso:', environment.apiUrl);
        
        if (this.authForm.invalid) {
            // Marcar campos como tocados para mostrar errores de validación si no lo están
            this.authForm.markAllAsTouched();
            console.log('Form is invalid. Please check the fields.');
            return;
        }

        this.isLoading = true;
        const credentials = {
            email: this.authForm.value.email,
            password: this.authForm.value.password
        };

        this.http.post<LoginResponse>(`${this.apiUrl}/users/login`, credentials)
        .subscribe({
          next: (response) => {
            console.log('Respuesta del servidor:', response);
            this.isLoading = false;
            if (response.success && response.user) {
              // Usar StorageService
              this.storageService.setCurrentUserEmail(response.user.useremail);
              this.storageService.setDepartmentId(response.user.departmentId.toString());
              this.storageService.setDepartmentName(response.user.department.name.toString());
  
              if (response.user.user_roles && Array.isArray(response.user.user_roles) && response.user.user_roles.length > 0) {
                const roleNames = response.user.user_roles.map(userRoleObj => {
                  if (userRoleObj && userRoleObj.role && typeof userRoleObj.role.name !== 'undefined') {
                    return userRoleObj.role.name;
                  }
                  return null;
                }).filter(name => name !== null);
  
                if (roleNames.length > 0) {
                  this.storageService.setUserRoles(roleNames); // Usar StorageService
                  console.log('Nombres de roles guardados vía StorageService:', roleNames);
                } else {
                  this.storageService.removeItem('userRoles'); // Usar StorageService
                }
              } else {
                this.storageService.removeItem('userRoles'); // Usar StorageService
              }
              this.router.navigate(['/welcome']); // O tu ruta de bienvenida/dashboard
            } else {
              this.loginError = response.message || 'Credenciales incorrectas.';
            }
          },
          error: (err: HttpErrorResponse) => { /* ... (manejo de errores) ... */ }
        });
    }

}