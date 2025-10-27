import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { VacationRequestService } from './vacation-request.service';
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
import { VacationRequestDialogComponent } from './vacation-request-dialog.component';
import { environment } from '../../../environments/environment';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from '../shared/snackbar/custom-snackbar.component';
import { VacationEditDialogComponent } from './edit/vacation-edit-dialog.component';


@Component({
  selector: 'app-vacation-request',
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

  templateUrl: './vacation-request.component.html',
  styleUrls: ['./vacation-request.component.scss'],
})
export class VacationRequestComponent implements OnInit {
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private vacationService: VacationRequestService
    , private dialog: MatDialog, private http: HttpClient
    , private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.vacationService.getRegisteredRequests().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
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


  openVacationDialog() {
  const dialogRef = this.dialog.open(VacationRequestDialogComponent, {
    width: '1600px',
    height: '600px', // Ajusta la altura según sea necesario
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.http.post(`${environment.apiUrlqsa}/vacation-requests`, result).subscribe({
        next: () => {
          //alert('Solicitud enviada con éxito');
          this.snackBar.open('¡Solicitud de vacaciones guardada con éxito!', 'Cerrar', {
  duration: 3000,  // milisegundos
  horizontalPosition: 'right',
  verticalPosition: 'top',
  panelClass: ['success-snackbar']
});

          this.loadRequests(); // vuelve a cargar la tabla
        },
        error: err => {
          console.error('Error al enviar solicitud', err);
          alert('Error al enviar la solicitud');
        }
      });
    }
  });
    }


    aprobarSolicitud(row: any): void {
  console.log('Aprobando solicitud:', row);
   this.vacationService.updateStatus(row.id, 'register', 'approved').subscribe({
    next: () => {
      this.snackBar.openFromComponent(CustomSnackbarComponent, {
        data: { message: `✅ Solicitud ${row.id} aprobada` },
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
      this.loadRequests();
    },
    error: () => {
      this.snackBar.openFromComponent(CustomSnackbarComponent, {
        data: { message: `❌ Error al aprobar solicitud ${row.id}` },
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  });
  // Aquí puedes llamar a tu servicio o lógica de aprobación
}


autorizarSolicitud(row: any): void {
  this.vacationService.updateStatus(row.id, 'register', 'pending').subscribe({
    next: () => {
      this.snackBar.openFromComponent(CustomSnackbarComponent, {
        data: { message: `✅ Solicitud ${row.id} autorizada` },
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
      this.loadRequests();
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

  openEditVacationDialog(row: any) {
  const dialogRef = this.dialog.open(VacationEditDialogComponent, {
    width: '400px',
    data: {
      id: row.id,
      days: row.calculated_days,
      vacationPeriod: row.vacation_period || ''
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
       this.loadRequests();
    }
  });
  }



}
