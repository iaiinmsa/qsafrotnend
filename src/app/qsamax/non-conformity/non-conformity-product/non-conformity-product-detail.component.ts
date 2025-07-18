import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list'; // Para mostrar detalles
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { NonConformityProduct } from '../../../models/non-conformity-product.model'; // Usa tu modelo
import { ProductAttachment } from '../../../models/product-attachment.model'; // <-- importa el modelo




@Component({
  selector: 'app-non-conformity-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    DatePipe
  ],
  templateUrl: './non-conformity-product-detail.component.html',
  styleUrls: ['./non-conformity-product-detail.component.scss']
})
export class NonConformityProductDetailComponent implements OnInit, OnDestroy {
  productDetail: NonConformityProduct | null = null;
  
  isLoading = false;
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();
  attachments: ProductAttachment[] = [];
  manualAttachments: string[] = [ // <-- Aquí agregas esto
    'camello-d4fd95299b384a2e.jpg',
    'camello-d4fd95299b384a2e.jpg',
  ];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

  this.route.paramMap
    .pipe(takeUntil(this.destroy$))
    .subscribe(params => {
      const productId = params.get('id');

      if (!productId) {
        this.errorMessage = 'No se proporcionó un ID de producto de no conformidad.';
        this.isLoading = false;
        return;
      }

      const id = +productId;

      // 1. Obtener el detalle del producto
      this.http.get<NonConformityProduct>(`${environment.apiUrlqsa}/non-conformity/products/${id}`)
        .subscribe({
          next: (data) => {
            this.productDetail = data;
            console.log('productDetail', this.productDetail )
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error cargando el producto:', err);
            this.errorMessage = `Error al cargar el producto: ${err.message}`;
          }
        });

      // 2. Obtener los attachments relacionados
      this.http.get<ProductAttachment[]>(`${environment.apiUrlqsa}/product-attachments/by-product/${id}`)
        .subscribe({
          next: (data) => {
            this.attachments = data;
            console.log('fotos', this.attachments )
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error cargando los adjuntos:', err);
            this.errorMessage = `Error al cargar archivos adjuntos: ${err.message}`;
          },
          complete: () => {
            this.isLoading = false;
          }
        });
    });
    
    
  }


  downloadFiles(filename: string): void {
    console.log('filename', filename)
    const url = `http://localhost:3001/files/download/${filename}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }


  downloadFile(filename: string): void {
    if (!filename) {
      console.warn('Archivo no disponible');
      return;
    }

    console.log('Intentando descargar:', filename); // 
    const url = `http://localhost:3001/product-attachments/download/${filename}`;
    console.log('url', url)
    this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}