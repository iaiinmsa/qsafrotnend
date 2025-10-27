    import { Component, Inject } from '@angular/core';
    import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
    import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
    import { MatInputModule } from '@angular/material/input';
    import { MatFormFieldModule } from '@angular/material/form-field';
    import { MatNativeDateModule } from '@angular/material/core';
    import { MatDatepickerModule } from '@angular/material/datepicker';
    import { MatSelectModule } from '@angular/material/select';


    import { CommonModule } from '@angular/common';
    import { FormsModule } from '@angular/forms';
    import { HttpClient, HttpClientModule } from '@angular/common/http';
    import { MatCardModule } from '@angular/material/card';
    import { MatIconModule } from '@angular/material/icon';
    import { MatButtonModule } from '@angular/material/button';
    import { MatSortModule } from '@angular/material/sort';
    import { MatTooltipModule } from '@angular/material/tooltip';
    import { MatDialog } from '@angular/material/dialog';
    import { MatTableModule } from '@angular/material/table';
    import { MatCheckboxModule } from '@angular/material/checkbox';
    import { MatSlideToggleModule } from '@angular/material/slide-toggle';
    import { BehaviorSubject, map, Observable, startWith } from 'rxjs';
import { environment } from '../../../environments/environment';


    @Component({
    selector: 'app-vacation-request-dialog',
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
    MatCheckboxModule ,
    MatSlideToggleModule
            ],
    templateUrl: './vacation-request-dialog.component.html',
     styleUrls: ['./vacation-request-dialog.component.scss'],
    })
    export class VacationRequestDialogComponent {


        employees: any[] = [];
    filteredEmployees$!: Observable<any[]>;
    employeeSearchTerm = new BehaviorSubject<string>('');


    form = this.fb.group({
        request_date: [new Date(), Validators.required],
        employee_code: ['', Validators.required],
        years_worked: [0, Validators.required],
        vacation_hours: [0, Validators.required],
        vacation_start_date: ['', Validators.required],
        vacation_end_date: ['', Validators.required],
        half_day_vacation: [false],
        vacation_period: [new Date().getFullYear().toString()],
        status: ['register'],
        requester: [''],
        immediate_supervisor_approved: [false],
        process_manager_approved: [false],
        pending_days: [0],
        current_days: [0],
        calculated_days: [0],
        process_manageruser_by: [''],
        process_manager_at: [new Date()],
        superviso_by: [''],
        superviso_at: [new Date()],
        

            // Campos solo lectura para empleado
    fecha_ingreso: [{ value: '', disabled: true }],
    proceso: [{ value: '', disabled: true }],
    puesto: [{ value: '', disabled: true }]

    });

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<VacationRequestDialogComponent>,
        private http: HttpClient
    ) {


        this.loadEmployees();
    }


ngOnInit() {


  // Escuchar cambios en las fechas
  this.form.get('vacation_start_date')?.valueChanges.subscribe(() => {
    this.calculateVacationHours();
  });

  this.form.get('vacation_end_date')?.valueChanges.subscribe(() => {
    this.calculateVacationHours();
  });

    // Detectar cambio de medio día
  this.form.get('half_day_vacation')?.valueChanges.subscribe((isHalfDay) => {
      this.calculateVacationHours(isHalfDay?? false );
    });


}

calculateVacationHours( isHalfDay: boolean = this.form.get('half_day_vacation')?.value ?? false   ) {
  const start = this.form.get('vacation_start_date')?.value;
  const end = this.form.get('vacation_end_date')?.value;

  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Diferencia en milisegundos
    const diffTime = endDate.getTime() - startDate.getTime();

    // Pasar a días
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir el primer día

    // Multiplicar por 8 horas
   // const hours = diffDays * 8;
     let hours = diffDays * 8;

        if (isHalfDay) {
      hours = hours / 2;
    }

    this.form.get('vacation_hours')?.setValue(hours, { emitEvent: false });
  }
}



    // Cargar empleados desde API
loadEmployees() {
  this.http.get<any[]>(`${environment.apiUrlqsa}/employees/details`).subscribe(data => {
    this.employees = data;

    // Inicializar filtrado
    this.filteredEmployees$ = this.employeeSearchTerm.pipe(
      startWith(''),
      map(term => {
        const lowerTerm = term?.toLowerCase() ?? '';
        return this.employees.filter(emp =>
          (emp.nombre?.toLowerCase() ?? '').includes(lowerTerm) ||
          (emp.codigo?.toLowerCase() ?? '').includes(lowerTerm)
        );
      })
    );
  });
}





    // Emitir cambios del input
    onEmployeeSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.employeeSearchTerm.next(input.value);
    }

    // Opcional: hacer algo con el empleado seleccionado
    onEmployeeSelected(event: any): void {
    const codigo = event.value;
    const empleado = this.employees.find(e => e.codigo === codigo);
    this.loadLastApprovedVacation(empleado.codigo);

    console.log('Empleado seleccionado:', empleado);

    if (empleado) {
      this.form.patchValue({
        fecha_ingreso: empleado.fechaingreso?.split('T')[0] ?? '',
        proceso: empleado.proceso ?? '',
        puesto: empleado.puesto ?? '',
        employee_code: empleado.codigo ?? ''
      });

       // Calcular años y vacaciones disponibles
    this.calcularAniosYVacaciones(empleado.fechaingreso);
    }

    }


    private calcularAniosYVacaciones(fechaIngreso: string | Date) {
  if (!fechaIngreso) return;

  const fechaInicio = new Date(fechaIngreso);
  const fechaActual = new Date();

  let anios = fechaActual.getFullYear() - fechaInicio.getFullYear();

  // Ajustar si todavía no ha cumplido el año en este año
  const mesActual = fechaActual.getMonth();
  const mesIngreso = fechaInicio.getMonth();
  if (
    mesActual < mesIngreso ||
    (mesActual === mesIngreso && fechaActual.getDate() < fechaInicio.getDate())
  ) {
    anios--;
  }

  // Determinar días de vacaciones según tabla
  let diasHabiles = 0;
  if (anios >= 4) {
    diasHabiles = 20;
  } else if (anios === 3) {
    diasHabiles = 15;
  } else if (anios === 2) {
    diasHabiles = 12;
  } else if (anios === 1) {
    diasHabiles = 10;
  }

  // Actualizar campos en el formulario
  this.form.patchValue({
    years_worked: anios,
    calculated_days: diasHabiles
  });
}


loadLastApprovedVacation(employeeCode: string) {
  this.http
    .get<any>(`${environment.apiUrlqsa}/vacation-requests/employeeapproved/${employeeCode}`)
    .subscribe({
      next: (data) => {
        console.log('Últimas vacaciones aprobadas:', data);
        if (data) {
          this.form.patchValue({
            pending_days: data.pending_days,
            current_days: data.current_days
          });
        }
      },
      error: (err) => {
        console.error('Error al obtener vacaciones aprobadas', err);
      }
    });
}



AgregaDiasCalculados() {

  // Poner días calculados en el formulario
  this.form.patchValue({
    vacation_start_date: new Date('1900-01-01T00:00:00Z').toISOString(),
    vacation_end_date: new Date('1900-01-01T00:00:00Z').toISOString(),
    vacation_hours: 0 ,
    pending_days : this.form.get('calculated_days')?.value ?? 0 + (this.form.get('pending_days')?.value ?? 0),
    current_days : 0,
    vacation_period: new Date().getFullYear().toString()

  });

  // Enviar la info al cerrar
  this.dialogRef.close(this.form.value);

}

    submit() {
      console.log('Formulario enviado:', this.form.value);

        if (this.form.valid) {

  const hours = this.form.get('vacation_hours')?.value ?? 0;
    const pendingDays = this.form.get('pending_days')?.value ?? 0;

    // Calcular días usados
    const daysUsed = hours / 8; // Ejemplo: 8 horas = 1 día, 4 horas = 0.5

    // Restar los días usados de los pendientes
    const updatedPendingDays = pendingDays - daysUsed;

    this.form.patchValue({
      pending_days: updatedPendingDays,
      current_days: daysUsed,
      vacation_period: new Date().getFullYear().toString(),
      calculated_days: 0
    });


        this.dialogRef.close(this.form.value);
        }
    }

    close() {
        this.dialogRef.close();
    }


    
    }
