import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { FuelControlComponent } from './fuel-control.component';

@Component({
    standalone: true,
   imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
  ],
  selector: 'app-fuel-consumption',
  templateUrl: './fuel-consumption.component.html',
  styleUrls: ['./fuel-consumption.component.scss']
  
})
export class FuelConsumptionComponent implements OnInit {
      filteredData: any[] = []; // ← agregar esta línea
  isLoading = true;
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = [
    'idtravel',
    'orderDate',
    'productionorderid',
    'activity',
    'initialreading',
    'finalreeading',
    'partial',
    'consume',
     'carName',               
    'operatorName'          
    
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient , private dialog: MatDialog ) {}

  ngOnInit(): void {
    const startDate = '';
    const endDate = '';

    this.http
      .get<any[]>(`${environment.apiUrlqsa}/fuel-consumption-control?startDate=${startDate}&endDate=${endDate}`)
      .subscribe({
        next: (res) => {
          this.dataSource = new MatTableDataSource(res);
          this.dataSource.paginator = this.paginator;
          this.filteredData = res; // ← inicializar filteredData con los datos obtenidos
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }



    openFuelControlDialog() {
    const dialogRef = this.dialog.open(FuelControlComponent, {
      width: '600px', // ancho del popup (ajústalo)
      // puedes pasar data si quieres:
      // data: { ... }
    });

    dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      // Si se insertó, recargar datos
      this.ngOnInit(); // o mejor, un método solo para recargar
    }
  });
  }


}

