import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon'; // necesario para los íconos de visibilidad
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomizerSettingsService } from '../../customizer-settings/customizer-settings.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  hide = true;
  hide2 = true;
  resetForm!: FormGroup;
  email = '';
  loading = false;
  successMessage = '';
  errorMessage = '';

  token = ''; 

  private apiUrl = environment.apiUrl;

  constructor(
    public themeService: CustomizerSettingsService,
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el email de los query params (ej. /reset-password?email=...)
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
       this.token = params['token'] || '';
      if (!this.token || !this.email) {
        this.errorMessage = 'Enlace inválido o expirado.';
      }

      if (!this.email) {
        this.errorMessage = 'Falta el parámetro email en la URL.';
      }
    });

    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  // Validador personalizado: las contraseñas deben coincidir
  private passwordsMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { mismatch: true };
    }
    return null;
  }

onSubmit(): void {
  if (this.resetForm.invalid || !this.email || !this.token) {
    this.resetForm.markAllAsTouched();
    if (!this.token) {
      this.errorMessage = 'Enlace inválido o expirado.';
    }
    return;
  }

  this.loading = true;
  this.successMessage = '';
  this.errorMessage = '';

  const newPassword = this.resetForm.value.password;

  this.http
    .patch(
      `${this.apiUrl}/users/change-password?token=${encodeURIComponent(this.token)}&email=${encodeURIComponent(this.email)}`,
      { newPassword }
    )
    .subscribe({
      next: (response: any) => {
        this.successMessage = response.message || 'Contraseña actualizada exitosamente.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/authentication']), 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al cambiar la contraseña.';
        this.loading = false;
      }
    });
}


}