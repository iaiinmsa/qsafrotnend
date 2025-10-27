import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
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



@Component({
  selector: 'app-manufacturing-order-uploadattachment',
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
  ],
   templateUrl: './manufacturing-order-uploadattachment.component.html',
  styleUrls: ['./manufacturing-order-uploadattachment.component.scss']
})
export class ManufacturingOrderUploadAttachmentComponent  {
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


 selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<ManufacturingOrderUploadAttachmentComponent>,
    private storageService: StorageService ,
    @Inject(MAT_DIALOG_DATA) public data: any

  ) {

    console.log('Data recibida en el diálogo:', data.order);
     this.currentUserEmail = this.storageService.getCurrentUserEmail();
   

     this.orderForm = this.fb.group({
    productionOrder: [data.order.productionOrder],
    ProductionOrderId: [data.order.idManufacturingOrder],
    observation: [''] ,
     createBy: this.currentUserEmail
  });
         

  }


    ngOnInit(): void {
  

  

// console.log( 'Usuario actual email:', this.currentUserEmail );
      this.orderForm.patchValue({
    createBy: this.currentUserEmail
  });


 console.log('Formulario inicial:', this.orderForm.value);

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



    if (this.orderForm.invalid) return;
this.uploadFiles(this.orderForm.value.ProductionOrderId);

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




  uploadFiles(orderId: number): void {
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



}
