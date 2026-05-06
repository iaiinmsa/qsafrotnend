import { Component, OnInit, ViewChild } from '@angular/core';

import { externalHistoryItemService } from './externalhistoryitem.service';

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
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-external-history-item',
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
  MatProgressSpinnerModule
        ],
  templateUrl: './externalhistoryitem.component.html'
})
export class ExternalHistoryItemComponent implements OnInit {
  historial: any[] = [];
  codigoArticulo: string = '50040013STE'; // El código que quieres buscar

  searchCode: string = ''; 
  
  displayedColumns: string[] = ['fecha', 'hora', 'operacion', 'numero_doc', 'cantidad', 'saldo'];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = false; // Lo iniciamos en false hasta que busquen

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private externalHistoryItemService: externalHistoryItemService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
 
  }

  onSearch(): void {
    if (!this.searchCode.trim()) {
      this.snackBar.open('Por favor ingrese un código de artículo', 'Cerrar', { duration: 2000 });
      return;
    }
    this.loadStockHistory(this.searchCode.trim());
  }

  loadStockHistory(codigo: string): void {
    this.isLoading = true;
    this.externalHistoryItemService.getitemhistory(codigo).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false; 
        setTimeout(() => {
          if (this.paginator) this.dataSource.paginator = this.paginator;
        });
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Error: Artículo no encontrado o sin movimientos', 'Cerrar', { duration: 3000 });
      },
    });
  }


  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  exportToExcel(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.dataSource.filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kardex');
    XLSX.writeFile(workbook, 'kardex_inventario.xlsx');
  }

}