import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
 import { environment } from '../../../environments/environment';      


@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,           // 👈 añadido para *ngIf, etc.
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    ReactiveFormsModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']   // nota: styleUrl -> styleUrls
})


export class ForgotPasswordComponent {

      forgotForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
    private apiUrl = environment.apiUrl; // 👈 propiedad para la URL base


  constructor(
    public themeService: CustomizerSettingsService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) return;

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    



    const email = this.forgotForm.value.email;

    // Llamada GET al endpoint (como indicaste)
    this.http.post(`${this.apiUrl}/users/send-password-reset`, { email })
    .subscribe({
      next: (response: any) => {
        this.successMessage = response.message || 'Correo enviado. Revisa tu bandeja de entrada.';
        this.loading = false;
        this.forgotForm.reset();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al enviar el correo. Intenta de nuevo.';
        this.loading = false;
      }
    });
    
     }   

}