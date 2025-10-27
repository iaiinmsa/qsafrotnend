import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VacationRequestService } from '../vacation-request.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

@Component({
     standalone: true,
        imports: [
            
            CommonModule,
        FormsModule,
        MatCardModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatSortModule,
        MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule ,
    MatInputModule ,
    ReactiveFormsModule ,
    MatDialogModule,
    MatSnackBarModule
            ],
  selector: 'app-vacation-edit-dialog',
  templateUrl: './vacation-edit-dialog.component.html'
})
export class VacationEditDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<VacationEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number, days: number, vacationPeriod: string },
    private fb: FormBuilder,
    private vacationService: VacationRequestService
  ) {
    this.form = this.fb.group({
      days: [data.days, [Validators.required, Validators.min(0)]],
      vacationPeriod: [data.vacationPeriod, Validators.required]
    });
  }

  save() {
    if (this.form.valid) {
      this.vacationService.updateDaysVacationAvailable(
        this.data.id,
        this.form.value.days,
        this.form.value.vacationPeriod
      ).subscribe(() => {
        this.dialogRef.close(true); // Para recargar datos en el componente padre
      });
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
