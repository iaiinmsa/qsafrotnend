import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepicker } from '@angular/material/datepicker'; // Importar MatDatepicker
import { MatNativeDateModule } from '@angular/material/core'; // O MatMomentDateModule si usas moment
import { ObjectiveGoalDetail } from '../../../models/ObjectiveGoalDetail.model';



// IMPORTS NECESARIOS PARA DATEPICKER EN EL CONTEXTO DEL COMPONENTE QUE ABRE EL DIÁLOGO
import { MatDatepickerModule } from '@angular/material/datepicker';
import { StorageService } from '../../../authentication/storage.service';


@Component({
  selector: 'app-add-objective-goal-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule // O MatMomentDateModule
  ],
  templateUrl: './add-objective-goal-detail-dialog.component.html',
  styleUrls: ['./add-objective-goal-detail-dialog.component.scss']
})
export class AddObjectiveGoalDetailDialogComponent implements OnInit {
  detailForm: FormGroup;
  idObjective: number;

  constructor(
    public dialogRef: MatDialogRef<AddObjectiveGoalDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idObjective: number },
    @Inject(PLATFORM_ID) private platformId: Object,
    private storageService: StorageService ,// Inyecta StorageService
  
    private fb: FormBuilder
  ) {
    this.idObjective = data.idObjective;
    this.detailForm = this.fb.group({
      currentGoal: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      selectedDate: [new Date(), Validators.required] // Para el datepicker
    });
  }

  ngOnInit(): void {}

  /**
   * Actualiza el control del formulario 'selectedDate' con la fecha seleccionada (mes/año).
   * Este método es llamado por los eventos (yearSelected) y (monthSelected) del datepicker.
   * @param normalizedMonthAndYear La fecha normalizada emitida por el evento del datepicker.
   * @param datepicker La instancia del datepicker (opcional, para controlarlo programáticamente si es necesario).
   */
  setMonthAndYear(normalizedMonthAndYear: Date, datepicker: MatDatepicker<any>): void {
    const selectedDateControl = this.detailForm.get('selectedDate');
    if (selectedDateControl) {
      selectedDateControl.setValue(normalizedMonthAndYear);
    }
    // La lógica para cerrar el datepicker (picker.close()) ya está en el template para (monthSelected).
    // Si también quieres cerrar en (yearSelected), puedes añadir datepicker.close() aquí condicionalmente.
  }

  onSave(): void {
    if (this.detailForm.invalid) {
      this.detailForm.markAllAsTouched();
      return;
    }

    const formValues = this.detailForm.value;
    const selectedDate = new Date(formValues.selectedDate);
    const userEmail = this.storageService.getCurrentUserEmail();


    const newDetail: Omit<ObjectiveGoalDetail, 'idObjgoal'> = {
      idObjective: this.idObjective,
      currentGoal: formValues.currentGoal,
      month: selectedDate.getMonth() + 1, // getMonth() es 0-indexado
      years: selectedDate.getFullYear(),
      createdate: new Date().toISOString(),
      usercreate: 'system' // Valor por defecto
    };

    console.log('Nuevo detalle:', newDetail);
    if (isPlatformBrowser(this.platformId)) {
      newDetail.usercreate = userEmail || 'system_fallback';
    }

    this.dialogRef.close(newDetail);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}