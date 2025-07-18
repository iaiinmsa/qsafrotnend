import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Objective } from '../../models/objective.model';
import { StorageService } from '../../authentication/storage.service';


@Component({
  selector: 'app-add-objective-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './add-objective-dialog.component.html',
  styleUrls: ['./add-objective-dialog.component.scss']
})
export class AddObjectiveDialogComponent implements OnInit {
  objectiveData: Partial<Objective> = { // Usamos Partial porque id, usercreate, createdate no se ingresan aquí
    name: '',
    description: '',
    goalBase: '',
    goalAverage: '0',
    active: true,
    departmentId: undefined // o un valor por defecto si lo tienes
    
  };

  constructor(
    public dialogRef: MatDialogRef<AddObjectiveDialogComponent>,
       private storageService: StorageService ,// Inyecta StorageService
     
    @Inject(MAT_DIALOG_DATA) public data: any // Puedes pasar datos al diálogo si es necesario
  ) {}

  ngOnInit(): void {

    const storedDepartmentIdString = this.storageService.getDepartmentId();
    if (storedDepartmentIdString) {
      const departmentIdNumber = parseInt(storedDepartmentIdString, 10);
      if (!isNaN(departmentIdNumber)) {
        this.objectiveData.departmentId = departmentIdNumber;
      } else {
        console.error('AddObjectiveDialogComponent: departmentId obtenido de StorageService no es un número válido:', storedDepartmentIdString);
      }
    } else {
      console.warn('AddObjectiveDialogComponent: departmentId no encontrado vía StorageService.');
      // Considera cómo manejar este caso: ¿deshabilitar el guardado? ¿mostrar un error?
    }
  }

  onSave(): void {

      // Asignar valores antes de enviar
      this.objectiveData.createdate = new Date().toISOString();
      const userEmail = this.storageService.getCurrentUserEmail();
    this.objectiveData.usercreate = userEmail || 'system_fallback'; // Usar email o valor por defecto

      
    if (this.objectiveData.name && this.objectiveData.goalBase && this.objectiveData.goalAverage && this.objectiveData.departmentId) {
      this.dialogRef.close(this.objectiveData);
    } else {
      // Podrías manejar mejor la validación aquí, mostrando mensajes al usuario
      console.error("Faltan campos requeridos");
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}