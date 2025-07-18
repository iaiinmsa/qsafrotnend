import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';



import { StorageService } from '../../../authentication/storage.service'; // Asegúrate de que StorageService esté correctamente implementado
import { NonConformityProduct, NonConformityProductDetail } from '../../../models/non-conformity-product.model';
import { AddNonConformityProductDialogComponent } from './add-non-conformity-product-dialog.component';
@Component({
  selector: 'app-non-conformity-product',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    DatePipe
  ],
  templateUrl: './non-conformity-product.component.html',
  styleUrls: ['./non-conformity-product.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class NonConformityProductComponent implements OnInit, OnDestroy {
  // Columnas para la tabla principal (campos importantes)
  displayedColumns: string[] = [
    'nonConformingProductId',
    'productionOrderId',
    'idProduct', // Considera mostrar productName
    'manufacturingDate',
    'rejectedQuantity',
    'idCauseNonConformity', // Considera mostrar causeName
    'departmentId',
    'creationDate',
    'acciones'
  ];
  dataSource = new MatTableDataSource<NonConformityProduct>();
  departmentId: string | null = null; // O number si tu servicio lo devuelve así

  selectedProductForDetail: NonConformityProduct | null = null;
  detailDataSource = new MatTableDataSource<NonConformityProductDetail>(); // O un modelo específico para el detalle
  // Columnas para la tabla de detalle (todos o más campos)
  displayedColumnsDetail: string[] = [
    'idproject',
    'createdBy',
    'intendedRecipient',
    'planningComment',
    'iddisposition', // Considera mostrar dispositionName
    'doComment',
    'dispositionCost',
    'estimatedClosingDate',
    'doObservation',
    'approvedProject',
    'approvedFinancialManagement',
    'approvedGeneralManagement',
    'realClosingDate',
    'checkObservation',
    'idNonConformityAttachmentId'
    // Podrías añadir 'accionesDetail' si tienes acciones para el detalle
  ];

  isLoading = false;
  isLoadingDetail = false;
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    public dialog: MatDialog,
    private storageService: StorageService
  ) {}


  
  openAddNonConformityDialog(): void {
    if (!this.departmentId) {
      console.error("No se puede agregar producto no conforme sin ID de departamento.");
      // Podrías mostrar una notificación al usuario aquí
      return;
    }

    const dialogRef = this.dialog.open(AddNonConformityProductDialogComponent, {
      width: '800px', // Ajusta el ancho según necesites
      disableClose: true, // Evita cerrar al hacer clic fuera
      data: { departmentId: this.departmentId } // Pasa el departmentId al diálogo
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        // 'result' contiene los datos del formulario del diálogo
        this.isLoading = true;
        this.http.post<NonConformityProduct>(`${environment.apiUrlqsa}/non-conformity/products`, result)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (newProduct) => {
              console.log('Producto no conforme agregado:', newProduct);
              this.loadNonConformityProducts(); // Recarga la tabla
              // Podrías mostrar un mensaje de éxito (ej. MatSnackBar)
            },
            error: (err: HttpErrorResponse) => {
              console.error('Error al agregar producto no conforme:', err);
              this.isLoading = false;
              // Podrías mostrar un mensaje de error
            }
          });
      }
    });
  }
  

  ngOnInit(): void {
    const deptIdFromStorage = this.storageService.getDepartmentId();
    if (deptIdFromStorage) {
        this.departmentId = deptIdFromStorage; // Asegúrate que el tipo coincida
        this.loadNonConformityProducts();
    } else {
        console.warn('NonConformityProductComponent: departmentId no encontrado vía StorageService.');
    }
  }

  loadNonConformityProducts(): void {
    if (!this.departmentId) {
      console.warn('Intento de cargar no conformidades sin departmentId.');
      return;
    }
    this.isLoading = true;
    // Ajusta la URL si necesitas filtrar por departmentId en el backend
    // Por ahora, obtendremos todos y filtraremos en el cliente o asumiremos que el backend ya filtra si es necesario
    this.http.get<NonConformityProduct[]>(`${environment.apiUrlqsa}/non-conformity/products`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Si necesitas filtrar por departmentId en el cliente:
          // this.dataSource.data = data.filter(p => p.departmentId === Number(this.departmentId));
          this.dataSource.data = data; // Asumiendo que ya vienen filtrados o muestras todos
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al cargar las no conformidades de productos:', err);
          this.isLoading = false;
        }
      });
  }

  toggleProductDetail(product: NonConformityProduct): void {
    if (this.selectedProductForDetail === product) {
      this.selectedProductForDetail = null; // Colapsar
    } else {
      this.selectedProductForDetail = product;
      this.loadProductDetails(product); // Cargar detalles específicos
    }
  }

  loadProductDetails(product: NonConformityProduct): void {
    this.isLoadingDetail = true;
    // Aquí, como ya tienes todos los datos en 'product' según tu JSON,
    // puedes simplemente asignarlos.
    // Si el detalle requiriera una llamada HTTP separada, la harías aquí.
    // Para este caso, el "detalle" es solo mostrar más campos del mismo objeto.
    // Creamos un array con un solo elemento para el detailDataSource
    // o si tuvieras una estructura de detalle más compleja, la construirías aquí.

    // Asumiendo que NonConformityProductDetail es compatible con NonConformityProduct
    const detailData: NonConformityProductDetail[] = [{ ...product }];
    this.detailDataSource.data = detailData;
    this.isLoadingDetail = false;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // --- Métodos CRUD para NonConformityProduct (Similares a ObjectiveGoal) ---
  // openAddNonConformityDialog(): void { /* ... */ }
  // editNonConformityProduct(product: NonConformityProduct): void { /* ... */ }
  // deleteNonConformityProduct(product: NonConformityProduct): void { /* ... */ }

  // --- Métodos para el detalle si tuviera sus propias acciones ---
  // editNonConformityDetail(detail: NonConformityProductDetail): void { /* ... */ }
  // deleteNonConformityDetail(detail: NonConformityProductDetail): void { /* ... */ }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}