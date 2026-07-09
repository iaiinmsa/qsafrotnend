 import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import * as XLSX from 'xlsx';

import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule , Validators} from '@angular/forms';
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
import { MatDialog } from '@angular/material/dialog';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from '../../shared/snackbar/custom-snackbar.component';
import { environment } from '../../../../environments/environment';
import { VacationRequestService } from '../vacation-request.service';
import { StorageService } from '../../../authentication/storage.service';
import { BehaviorSubject, map, Observable, startWith } from 'rxjs';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-accrued-vacation',
    standalone: true,
    imports: [MatPaginator,
         MatPaginatorModule,
         CommonModule,
     FormsModule,
      MatCardModule,
    MatPaginatorModule,
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
  MatSnackBarModule,
  
    ReactiveFormsModule,
        ],
 providers: [DatePipe],
  templateUrl: './accrued-vacation.component.html',
  styleUrls: ['./accrued-vacation.component.scss'],
})



export class AccruedVacationComponent  implements OnInit {
  displayedColumns: string[] = [
    'codigo',
    'nombre',
    'fecha_ingreso',
    'fecha_ultimo_aniversario',
    'antiguedad_anios',
    'fecha_calculo',
    'dias_pendientes',
    'dias_proporcionales',
    'dias_derecho_anual',
    'dias_por_ley',
    'dias_por_contratocolectivo',
    'dias_transcurridos_360',
    'salario_nominal',
    'salario_diario',
    'pasivo_total_vacaciones',
    'mensaje_actualizacion'
  ];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;
 Email: string = '';
 user: string = '';

  
    

         employees: any[] = [];
     filteredEmployees$!: Observable<any[]>;
     employeeSearchTerm = new BehaviorSubject<string>('');
    form!: FormGroup;  
    employeeCode: string = '';
     

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private vacationService: VacationRequestService
    , private dialog: MatDialog, private http: HttpClient
    , private snackBar: MatSnackBar
   ,  private storageService: StorageService 
   ,private fb: FormBuilder,
   private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
      this.form = this.fb.group({
     vacation_start_date: [null, Validators.required]
    });

  
  }


 generarReporte() {
  if (this.form.invalid) return;

  this.isLoading = true;

  // El operador || '' asegura que siempre sea un string, eliminando el error de null
  const start = this.datePipe.transform(this.form.value.vacation_start_date, 'yyyy-MM-dd') || '';
 
  this.vacationService.getAccruedVacation(start).subscribe({
    next: (data) => {
      this.dataSource.data = data;
      console.log('Datos recibidos:', data); // Agrega este log para depuración
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Error al generar reporte', err);
      this.isLoading = false;
    }
  });
}


  getTotalVacationPay(): number {
  // Usamos filteredData para que, si el usuario filtra la tabla, 
  // la suma se actualice automáticamente
  return this.dataSource.data
    .map(t => Number(t.pasivo_total_vacaciones) || 0)
    .reduce((acc, value) => acc + value, 0);
}





  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  exportToExceld(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.dataSource.filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vacacionespago');
    XLSX.writeFile(workbook, 'pasivos_vacacionespago.xlsx');
  }

  exportToExcel(): void {
  // 1. Creamos una copia de los datos filtrados para no afectar la vista de la tabla
  const dataToExport = [...this.dataSource.filteredData];

  // 2. Calculamos el total usando tu función existente
  const totalPay = this.getTotalVacationPay();

  // 3. Creamos un objeto que represente la fila del footer
  // IMPORTANTE: Los nombres de las propiedades deben ser EXACTAMENTE iguales a los de tu tabla
  const footerRow = {
   codigo: '',
    nombre: 'TOTAL GENERAL',
    fecha_ingreso: '',
    fecha_ultimo_aniversario: '',
    antiguedad_anios: '',
    fecha_calculo: '',
    dias_pendientes: '',
    dias_proporcionales: '',
    dias_derecho_anual: '',
    dias_por_ley: '',
    dias_por_contratocolectivo: '',
    dias_transcurridos_360: '',
    salario_nominal: '',
    salario_diario: '',
    pasivo_total_vacaciones: totalPay, // El Gran Total
    mensaje_actualizacion: ''
  };

  // 4. Agregamos la fila al final del arreglo
  dataToExport.push(footerRow);

  // 5. Generamos el Excel con la fila incluida
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vacaciones_Pago');
  
  // Guardamos el archivo
  XLSX.writeFile(workbook, 'reporte_pagos_vacaciones.xlsx');
}



 

  



}
