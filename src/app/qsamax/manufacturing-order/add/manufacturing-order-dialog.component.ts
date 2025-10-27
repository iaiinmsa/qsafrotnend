import { Component, inject, Inject } from '@angular/core';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, startWith, Subject } from 'rxjs';
import { customer, WorkOrder } from '../../../models/Product.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { throws } from 'assert/strict';
import { StorageService } from '../../../authentication/storage.service';
import { FileDropComponent } from '../../shared/file-drop/file-drop.component';
import { MatTableModule } from '@angular/material/table';
import { CustomSnackbarComponent } from '../../shared/snackbar/custom-snackbar.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { environment } from '../../../../environments/environment';




@Component({
  selector: 'app-manufacturing-order-dialog',
standalone: true,

  imports: [
    CommonModule,
    MatSelectModule,
    MatOptionModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    
    MatButtonModule,
    MatIconModule ,
     MatAutocompleteModule, 
    MatOptionModule ,
    MatDatepickerModule,
    MatTableModule   ,
    MatSnackBarModule,
    
    FileDropComponent
  ],
  templateUrl: './manufacturing-order-dialog.component.html',
  styleUrls: ['./manufacturing-order-dialog.component.scss']
})
export class ManufacturingOrderDialogComponent {
   private snackBar = inject(MatSnackBar); // ✅ inyección usando inject()
   
  orderForm: FormGroup;
  selectedFiles: File[] = [];
  uploadedFiles: any[] = [];
  uploading = false;
  ps$: Observable<WorkOrder[]> = of([]);
 private allops: WorkOrder[] = [];
 filteredWorkOrdersd$!: Observable<WorkOrder[]>;
 workOrderSearchTerm = new Subject<string>();


  private allcustomers: customer[] = [];
 filteredCustomer$!: Observable<customer[]>;
 customerSearchTerm = new Subject<string>();
 units: any[] = [];
 currency: any[] = [];
 currentUserEmail: string | null = null; 
 customername: string | null = null; 


 selectedFile: File | null = null;
   
   fileTypes = ['Alcance', 'Tiempo', 'Costo'];
   displayedColumns: string[] = ['type', 'file', 'actions'];


   selectedFilesByType: { [key: string]: File[] } = {
  Alcance: [],
  Tiempo: [],
  Costo: []
};

loading: boolean = false; // para bloquear el formulario mientras se guarda

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<ManufacturingOrderDialogComponent>,
    private storageService: StorageService,
    
     @Inject(MAT_DIALOG_DATA) public data: any 

  ) {



         
 this.currentUserEmail = this.storageService.getCurrentUserEmail();
    this.orderForm = this.fb.group({
      productionOrder: ['', Validators.required],
      assignedTo: [''],
      requestedBy: [''],
      createDate: [new Date(), Validators.required],
      customerCode: [''],
      contactName: [''],
      contactPhone: [''],
      contactEmail: [''],
      projectScope: [''],
      location: [''],
      metalWeight: [0],
      unitofMeasure: [''],
      grandTotal: [0, Validators.required],
      currency: [''],
      paymentFactor: [0],
      payTerm: [''],
      deliveryTime: [''],
      productionOrderLabel: [''],
      ProductionOrderId: [0],
      observation: [''],
      createAt: [new Date()],
      createBy: ['']
      
    });
  }


  

    ngOnInit(): void {
  

  

// console.log( 'Usuario actual email:', this.currentUserEmail );
      this.orderForm.patchValue({
    createBy: this.currentUserEmail
  });


  this.workOrderSearchTerm.next('');
  this.loadworkorder();
  this.customerSearchTerm.next('');
  this.loadCustomers();
  this.loadunits();
  this.loadcurrency();
}



 loadunits ()
 {
     this.http.get<any[]>(`${environment.apiUrlqsa}/unit`)
    .subscribe(data => {
      this.units = data;
   //   console.log('Units:', this.units);
    });

 }


  loadcurrency ()
 {
     this.http.get<any[]>(`${environment.apiUrlqsa}/currency`)
    .subscribe(data => {
      this.currency = data;
   //   console.log('currency:', this.currency);
    });

 }


  cancel(): void {
    this.dialogRef.close();
  }

  
submit(): void { 
  if (this.orderForm.invalid || this.loading) return;

  this.orderForm.patchValue({
    productionOrderLabel: this.orderForm.value.productionOrder,
  });

  this.loading = true; // ❌ Bloqueamos UI

  this.http.post(`${environment.apiUrlqsa}/manufacturing-order`, this.orderForm.value)
    .subscribe({
      next: (order: any) => {
        // Subimos archivos clasificados
        this.uploadFiles(order.idManufacturingOrder)
          .then(() => {
            // Una vez que se suben todos los archivos
            const labelPayload = {
              code: this.orderForm.value.productionOrder,
              name: this.customername,
              level: 0,
              syncversion: 1,
              closed: 0,
              type: 'OPS'
            };

            this.http.post(`${environment.apiUrlqsa}/label/create`, labelPayload)
              .subscribe({
                next: (label: any) => {
                  if (label?.internalId) {
                    this.orderForm.patchValue({ ProductionOrderId: label.internalId });
                  }

                  this.loading = false; // ✅ Liberamos UI aquí

                     // Mostramos snackbar
                  this.snackBar.open('Orden y etiqueta creada exitosamente', 'Cerrar', {
                    duration: 3000, // 3 segundos
                    horizontalPosition: 'center',
                    verticalPosition: 'top'
                  });

                  this.dialogRef.close(true);
                },
                error: (err) => {
                  console.error(err);
                  this.loading = false; // ✅ Liberamos UI incluso si hay error
                }
              });
          })
          .catch(err => {
            console.error(err);
            this.loading = false; // ✅ Liberamos UI si falla uploadFiles
          });
      },
      error: err => {
        console.error(err);
        this.loading = false; // ✅ Liberamos UI si falla el post inicial
      }
    });
}




uploadFiles(orderId: number): Promise<void> {
  const uploads: any[] = [];

  for (const [type, files] of Object.entries(this.selectedFilesByType)) {
    files.forEach(file => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('manufacturingOrderId', orderId.toString());
      formData.append('uploadBy', this.orderForm.value.createBy);
      formData.append('description', type);

      uploads.push(this.http.post(`${environment.apiUrlqsa}/manufacturing-order/detail`, formData).toPromise());
    });
  }

  return Promise.all(uploads).then(() => undefined);
}




  // ------- MANEJO DE ARCHIVOS --------
  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    this.selectedFiles = [...this.selectedFiles, ...Array.from(files)];
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  clearSelectedFiles(): void {
    this.selectedFiles = [];
  }

  uploadFilesc(orderId: number): void {
    this.uploading = true;
    const uploads = this.selectedFiles.map(file => {
      const formData = {
        manufacturingOrderId: orderId,
        filePath: 'ruta/fake', // si quieres, genera real en backend
        uploadBy: this.orderForm.value.createBy,
        fileName: file.name,
        description: 'Archivo de soporte'
      };
      return this.http.post(`${environment.apiUrlqsa}/manufacturing-order/detail`, formData);
    });

    Promise.all(uploads.map(req => req.toPromise()))
      .then(() => {
        this.uploading = false;
        this.dialogRef.close(true);
      })
      .catch(err => {
        this.uploading = false;
        console.error(err);
      });
  }


  uploadFilesd(orderId: number): void {
  if (!this.selectedFiles.length) return;

  this.uploading = true;

  const uploads = this.selectedFiles.map(file => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('manufacturingOrderId', orderId.toString());
    formData.append('uploadBy', this.orderForm.value.createBy);
    formData.append('description', this.orderForm.value.observation || ''); // aquí pones la descripción desde Angular

    console.log('Subiendo archivo:', formData);
    return this.http.post(`${environment.apiUrlqsa}/manufacturing-order/detail`, formData);
  });

  Promise.all(uploads.map(req => req.toPromise()))
    .then(() => {
      this.uploading = false;
      this.dialogRef.close(true);
    })
    .catch(err => {
      this.uploading = false;
      console.error(err);
    });
}



   loadworkorder(): void {
    
        this.http.get<WorkOrder[]>(`${environment.apiUrlqsa}/workordershow`).pipe(
      catchError(() => of([]))
    ).subscribe(products => {
      this.allops = products;
    //  console.log('allops', this.allops);
  
      this.filteredWorkOrdersd$ = this.workOrderSearchTerm.pipe(
        startWith(''), // muestra todo al inicio
        debounceTime(300),
        distinctUntilChanged(),
        map(term => term.trim().toLowerCase()),
        map(searchTerm => {
          return this.allops.filter(product =>
            (product.op?.toLowerCase() || '').includes(searchTerm) ||
            (product.descripcion?.toLowerCase() || '').includes(searchTerm)
          );
        })
      );
    });
  
   }
   
  onWorkOrderSelected(event: MatAutocompleteSelectedEvent): void {
  const selectedOp = event.option.value;
  const selected = this.allops.find(op => op.op === selectedOp);

  if (selected) {
    this.orderForm.patchValue({
      production_order: selected.op,
      ProductionOrderId: selected.numero 
    });
  //  console.log('Orden de producción seleccionada:', selected, this.orderForm.value);
  }
}



      onWorkOrderSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    this.workOrderSearchTerm.next(input.value); // 🔥 Esto emite al observable
  }



       onCustomerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
     this.customerSearchTerm.next(input.value); // 🔥 Esto emite al observable
  }


      
  onCustomerSelected(event: MatAutocompleteSelectedEvent): void {
  const selectedOp = event.option.value;
  const selected = this.allcustomers.find(op => op.codigo === selectedOp);

  if (selected) {
     this.customername = selected.fantasyname;
    this.orderForm.patchValue({
      customerCode: selected.codigo,
      
    });
    console.log('cliente seleccionada:', selected);
  }
}



loadCustomers(): void {
    
        this.http.get<customer[]>(`${environment.apiUrlqsa}/customer`).pipe(
      catchError(() => of([]))
    ).subscribe(products => {
      this.allcustomers = products;
    //  console.log('allcustomers', this.allcustomers);

      this.filteredCustomer$ = this.customerSearchTerm.pipe(
        startWith(''), // muestra todo al inicio
        debounceTime(300),
        distinctUntilChanged(),
        map(term => term.trim().toLowerCase()),
        map(searchTerm => {
          return this.allcustomers.filter(product =>
            (product.codigo?.toLowerCase() || '').includes(searchTerm) ||
            (product.fantasyname?.toLowerCase() || '').includes(searchTerm)
          );
        })
      );
    });
  
   }



   
// Métodos para drag & drop
onDragOver(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  const dropArea = event.currentTarget as HTMLElement;
  dropArea.classList.add('dragover');
}

onDragLeave(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  const dropArea = event.currentTarget as HTMLElement;
  dropArea.classList.remove('dragover');
}

onDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  
  const dropArea = event.currentTarget as HTMLElement;
  dropArea.classList.remove('dragover');

  if (event.dataTransfer && event.dataTransfer.files.length > 0) {
    const fakeEvent = {
      target: { files: event.dataTransfer.files }
    };
    this.onFilesSelected(fakeEvent);
  }
}

removeUploadedFile(index: number) {
  // Si necesitas también eliminarlo del backend:
  // const fileToDelete = this.uploadedFiles[index];
  // this.http.delete(`${environment.apiUrlqsa}/attachments/${fileToDelete.id}`).subscribe(...);
  
  this.uploadedFiles.splice(index, 1);
}


  uploadFilesb(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
     // this.form.patchValue({ file: this.selectedFile });
    }
  }



onFilesUploaded(files: File[], category: string) {
  console.log('Archivos subidos:', files, 'Categoría:', category);
  // Aquí puedes enviar al backend
}



// manufacturing-order-dialog.component.ts

onFilesSelectedb(event: { type: string; files: File[] }) {
  const { type, files } = event;
  const normalizedType = this.normalizeType(type);

  if (!this.selectedFilesByType[normalizedType]) {
    this.selectedFilesByType[normalizedType] = [];
  }

  // Agregar los nuevos archivos a la categoría
  this.selectedFilesByType[normalizedType].push(...files);
  console.log(`Archivos en ${normalizedType}:`, this.selectedFilesByType[normalizedType]);
}

// Normaliza el tipo (primera mayúscula, resto minúscula)
private normalizeType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

// Devuelve un arreglo con todos los archivos y su categoría
get allSelectedFiles(): { type: string; file: File }[] {
  return Object.entries(this.selectedFilesByType).flatMap(([type, files]) =>
    files.map(file => ({ type, file }))
  );
}

// Eliminar archivo de la categoría correcta
removeFile(type: string, index: number) {
  this.selectedFilesByType[type].splice(index, 1);
}


}
