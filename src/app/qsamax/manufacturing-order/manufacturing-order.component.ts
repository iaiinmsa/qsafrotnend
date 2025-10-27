import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { environment } from '../../../environments/environment';
import { ManufacturingOrder } from '../../models/manufacturing-order.model';
import * as XLSX from 'xlsx';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../shared/material.module';

import { ManufacturingOrderDialogComponent } from './add/manufacturing-order-dialog.component';
import { ManufacturingOrderUploadAttachmentComponent } from './uploadattachment/manufacturing-order-uploadattachment.component';

// ✅ Import correcto de animaciones
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-manufacturing-order',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MaterialModule
  ],
  templateUrl: './manufacturing-order.component.html',
  styleUrls: ['./manufacturing-order.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4,0.0,0.2,1)'))
    ])
  ]
})
export class ManufacturingOrderComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['idManufacturingOrder', 'productionOrder', 'customerCode', 'projectScope', 'createDate', 'acciones'];
  displayedColumnsDetail: string[] = ['fileName', 'description', 'uploadBy', 'filePath', 'descargar'];

  dataSource = new MatTableDataSource<ManufacturingOrder>();
  selectedOrder: ManufacturingOrder | null = null;
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private http: HttpClient,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadOrders(): void {
    this.loading = true;
    this.http.get<ManufacturingOrder[]>(`${environment.apiUrlqsa}/manufacturing-order`).subscribe({
      next: (data) => {
        this.dataSource.data = data;

        // Asignar paginator con un pequeño delay para asegurar que ViewChild ya está listo
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
        });

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  toggleDetail(order: ManufacturingOrder): void {
    this.selectedOrder = this.selectedOrder === order ? null : order;
  }

  downloadFile(filePath: string): void {
    const fileName = encodeURIComponent(filePath.split('\\').pop() || '');
    const url = `${environment.apiUrlqsa}/download?file=${fileName}`;
    window.open(url, '_blank');
  }


  verPdf(orderId: number) {
  window.open(`${environment.apiUrlqsa}/report/${orderId}/pdfmake`, '_blank');
}

downloadPdf(orderId: number) {
  const link = document.createElement('a');
  link.href = `${environment.apiUrlqsa}/report/${orderId}/pdf`;
  link.download = `reporte_${orderId}.pdf`;
  link.click();
}


  exportToExcel(): void {
    const dataToExport = this.dataSource.data.map(order => ({
      ID: order.idManufacturingOrder,
      'Orden Producción': order.productionOrder,
      Proyecto: order.projectScope,
      Cliente: order.customerCode,
      Fecha: order.createDate,
      Total: order.grandTotal
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ordenes');
    XLSX.writeFile(workbook, 'ordenes-produccion.xlsx');
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ManufacturingOrderDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadOrders();
    });
  }

  openCreateDetailDialog(order: any): void {
    const dialogRef = this.dialog.open(ManufacturingOrderDialogComponent, {
      width: '600px',
      data: { order }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('¡Se guardó la Orden de producción con éxito!', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadOrders();
      }
    });
  }

  openupdateDetailDialog(order: any): void {
    const dialogRef = this.dialog.open(ManufacturingOrderUploadAttachmentComponent, {
      width: '600px',
      data: { order }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('¡Se guardó la Orden de producción con éxito!', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadOrders();
      }
    });
  }

}
