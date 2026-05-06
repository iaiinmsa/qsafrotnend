import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      
      <!-- Se muestra solo si es una acción de RECHAZAR -->
      <mat-form-field *ngIf="data.requiresComment" appearance="outline" style="width: 100%; margin-top: 15px;">
        <mat-label>Motivo o comentario (obligatorio)</mat-label>
        <textarea matInput [(ngModel)]="comentario" rows="3" required></textarea>
      </mat-form-field>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <!-- El botón se deshabilita si pide comentario y está vacío -->
      <button mat-raised-button 
              color="{{ data.isDestructive ? 'warn' : 'primary' }}" 
              [disabled]="data.requiresComment && !comentario.trim()" 
              (click)="onConfirm()">
        Confirmar
      </button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  comentario = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, message: string, requiresComment: boolean, isDestructive: boolean }
  ) {}

  onCancel(): void {
    this.dialogRef.close(); // Devuelve undefined
  }

  onConfirm(): void {
    this.dialogRef.close({ confirmed: true, comentario: this.comentario }); // Devuelve el resultado
  }
}