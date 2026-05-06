
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { WorkCardService } from './work-card.service';

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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { environment } from '../../../environments/environment';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DigitalEmployeeRecordsComponent } from './employee/digital-employee-records.component';



@Component({
  selector: 'app-work-card',
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
  MatDialogModule
        ],

  templateUrl: './work-card.component.html',
  styleUrls: ['./work-card.component.scss'],
})



export class WorkCardComponent implements OnInit {
  displayedColumns: string[] = [
    'codigo',
    'nombre',
    'posicion',
    'puesto',
    'fechaingreso',
    'dni',
    'acciones'
  ];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;
  loadingId: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private workCardService: WorkCardService
    , private dialog: MatDialog, private http: HttpClient
    , private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }


// En work-card.component.ts

loadRequests(): void {
  this.isLoading = true; // Inicia el estado de carga
  this.workCardService.getRegisteredRequests().subscribe({
    next: (data) => {
      this.dataSource.data = data;
      
      // 1. Primero desactivamos el loading para que el paginador aparezca en el HTML
      this.isLoading = false; 

      // 2. Usamos setTimeout para esperar al siguiente ciclo de renderizado
      // Esto garantiza que @ViewChild(MatPaginator) ya no sea undefined
      setTimeout(() => {
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      });
    },
    error: () => {
      this.isLoading = false;
    },
  });
}


// Mejora el filtro para que reinicie la paginación al buscar
applyFilter(event: Event): void {
  const filterValue = (event.target as HTMLInputElement).value;
  this.dataSource.filter = filterValue.trim().toLowerCase();

  // Reiniciar a la primera página después de filtrar
  if (this.dataSource.paginator) {
    this.dataSource.paginator.firstPage();
  }
}


  exportToExcel(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.dataSource.filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vacaciones');
    XLSX.writeFile(workbook, 'solicitudes_vacaciones.xlsx');
  }



    // lista-empleados.component.ts

generarCarnet(codigo: string) {

    this.loadingId = codigo;

  this.workCardService.getCarnetEmpleado(codigo).subscribe({
    next: (res) => {
      // Creamos un objeto URL para el Blob (PDF)
      const file = new Blob([res], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      // Abrir en pestaña nueva
      window.open(fileURL, '_blank');
      
      this.snackBar.open('Carnet generado con éxito', 'Cerrar', { 
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      
      // Opcional: Liberar memoria después de un tiempo
      setTimeout(() => URL.revokeObjectURL(fileURL), 100);

         this.loadingId = null;
    },
    error: (err) => {
      console.error('Error al generar el carnet:', err);

      this.snackBar.open('No se pudo generar el carnet. Intente de nuevo.', 'Cerrar', { 
        duration: 5000 
      });
      // Aquí podrías usar un SweetAlert o Toast para avisar en San Pedro Sula
    }
  });
}

  openDigitalRecords(row: any): void {
    this.dialog.open(DigitalEmployeeRecordsComponent, {
      width: '900px',
      data: row,
      autoFocus: false
    });
  }

}
