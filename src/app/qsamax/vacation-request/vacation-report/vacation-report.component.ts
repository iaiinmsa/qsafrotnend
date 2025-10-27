 import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import * as XLSX from 'xlsx';

import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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


@Component({
  selector: 'app-vacation-report',
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

  templateUrl: './vacation-report.component.html',
  styleUrls: ['./vacation-report.component.scss'],
})
export class VacationReportComponent  implements OnInit {
  displayedColumns: string[] = [
    'id',
    'request_date',
   
    'years_worked',
    'vacation_start_date',
    'vacation_end_date',
    'vacation_hours',
    'dias_previos',
    'current_days',
    'pending_days',
    'calculated_days',
    'status',
    'tipo_dias',
    'employee_code',
    'nombre',
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
   ,private fb: FormBuilder
  ) {}

  ngOnInit(): void {

      this.form = this.fb.group({
      employee_code: ['']
    
    });

   // this.loadRequests();
   this.Email = this.storageService.getEmail() || '';
   this.user = this.storageService.getCurrentUserEmail() || '';
   
   this.loadEmployees();

   console.log('Email del usuario:', this.Email);
      this.loadRequestsByEmail();

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

  

  loadRequestsByEmail(): void {
    this.isLoading = true;

    // Obtener email de localStorage (asegúrate que esté guardado con esta key)
    const email =  this.employeeCode

    if (!email) {
      this.isLoading = false;
      console.warn('No hay email de usuario logueado en localStorage');
      return;
    }

    this.vacationService.getRequestsByEmployee(email).subscribe({
      next: (data) => {
        console.log('Solicitudes obtenidas por email:', data);
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando solicitudes por email', err);
        this.isLoading = false;
      }
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
   
    this.employeeCode = empleado.codigo; // Guardar el código del empleado seleccionado



    console.log('Empleado seleccionado:', empleado);
    this.loadRequestsByEmail();


    }



  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  exportToExcel(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.dataSource.filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vacaciones');
    XLSX.writeFile(workbook, 'solicitudes_vacaciones.xlsx');
  }




 


autorizarSolicitud(row: any): void {


       this.vacationService.updateStatus(row.id, 'register', 'pending').subscribe({
    next: () => {

    },
    error: () => {
      this.snackBar.openFromComponent(CustomSnackbarComponent, {
        data: { message: `❌ Error al autorizar solicitud ${row.id}` },
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  });


  this.vacationService.updateRequester(row.id, this.user ).subscribe({
    next: () => {
      this.snackBar.openFromComponent(CustomSnackbarComponent, {
        data: { message: `✅ Solicitud ${row.id} autorizada` },
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
      this.loadRequestsByEmail();
    },
    error: () => {
      this.snackBar.openFromComponent(CustomSnackbarComponent, {
        data: { message: `❌ Error al autorizar solicitud ${row.id}` },
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  });





  }

  



}
