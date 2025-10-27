 import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import * as XLSX from 'xlsx';

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
import { MatDialog } from '@angular/material/dialog';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from '../../shared/snackbar/custom-snackbar.component';
import { environment } from '../../../../environments/environment';
import { VacationRequestService } from '../vacation-request.service';
import { StorageService } from '../../../authentication/storage.service';


@Component({
  selector: 'app-vaction-associates',
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
  MatSnackBarModule
        ],

  templateUrl: './vaction-associates.component.html',
  styleUrls: ['./vaction-associates.component.scss'],
})
export class VacationAssociatesComponent  implements OnInit {
  displayedColumns: string[] = [
    'id',
    'request_date',
    'employee_code',
    'nombre',
    'years_worked',
    'vacation_start_date',
    'vacation_end_date',
    'vacation_hours',
    'current_days',
    'pending_days',
    'calculated_days',
    'status',
    'acciones',
  ];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;
 Email: string = '';
 user: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private vacationService: VacationRequestService
    , private dialog: MatDialog, private http: HttpClient
    , private snackBar: MatSnackBar
   ,  private storageService: StorageService 
  ) {}

  ngOnInit(): void {
   // this.loadRequests();
   this.Email = this.storageService.getEmail() || '';
   this.user = this.storageService.getCurrentUserEmail() || '';

   console.log('Email del usuario:', this.Email);
      this.loadRequestsByEmail();

  }

  loadRequestsByEmail(): void {
    this.isLoading = true;

    // Obtener email de localStorage (asegúrate que esté guardado con esta key)
    const email = this.Email

    if (!email) {
      this.isLoading = false;
      console.warn('No hay email de usuario logueado en localStorage');
      return;
    }

    this.vacationService.getRequestsByEmail(email).subscribe({
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
