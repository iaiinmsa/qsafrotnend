import { Component, OnInit, Inject, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { catchError, map, startWith, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';

import { NonConformityProduct } from '../../../models/non-conformity-product.model';
import { MatIconModule } from '@angular/material/icon'; // Para el icono de búsqueda
import { Product, WorkOrder } from '../../../models/Product.model';
import { CauseNonConformity } from '../../../models/CauseNonConformity.model';
import { Disposition } from '../../../models/Disposition.model';
import { StorageService } from '../../../authentication/storage.service';
import { DepartmentManagerResponse } from '../../../models/DepartmentManagerResponse';

import { FileUploadModule  } from '@iplab/ngx-file-upload';
import { forkJoin } from 'rxjs';

//import { FileUploadUiModule } from '@iplab/ngx-file-upload/ui';

//import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { FileUploadComponent } from '../../shared/file-upload/file-upload.component';



@Component({
  selector: 'app-add-non-conformity-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // Para el input de filtro si no es parte del formGroup principal
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    DatePipe,
    FileUploadModule,
    FileUploadComponent
      
  ],
  templateUrl: './add-non-conformity-product-dialog.component.html',
  styleUrls: ['./add-non-conformity-product-dialog.component.scss']
})
export class AddNonConformityProductDialogComponent implements OnInit, OnDestroy {
  addForm: FormGroup;
  currentUserEmail: string | null = null; // Para almacenar el email del usuario
  environment = environment;


  filteredWorkOrdersd$!: Observable<WorkOrder[]>;
  ops$: Observable<WorkOrder[]> = of([]);


  filteredWorkOrders$!: Observable<WorkOrder[]>;
  products$: Observable<Product[]> = of([]);
  filteredProducts$: Observable<Product[]> = of([]);
  causes$: Observable<CauseNonConformity[]> = of([]);
  dispositions$: Observable<Disposition[]> = of([]);
  departmentName: string | null = null; // Nueva propiedad para el nombre del departamento
  uploadedFiles: any[] = [];
  attachmentIds: number[] = [];
  searchText: string = '';
  filteredWorkOrders: any[] = [];
  allWorkOrders: any[] = [];

   searchWorkOrderTerm = new Subject<string>();
  productSearchTerm = new Subject<string>();
  private allProducts: Product[] = [];
  private allops: WorkOrder[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<AddNonConformityProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { departmentId: string | number }, // Recibe departmentId
    private fb: FormBuilder,
    private http: HttpClient,
    private storageService: StorageService // Inyectar StorageService

    
  ) {

    let departmentIdAsNumber: number | null = null;
    if (typeof this.data.departmentId === 'string') {
      const parsedId = parseInt(this.data.departmentId, 10);
      if (!isNaN(parsedId)) {
        departmentIdAsNumber = parsedId;
      } else {
        console.error('Error: departmentId recibido como string no pudo ser convertido a número:', this.data.departmentId);
        // Decide cómo manejar este caso: ¿usar null? ¿lanzar un error? ¿valor por defecto?
        // Por ahora, lo dejaremos como null si la conversión falla,
        // asumiendo que tu backend podría aceptar null o tienes validación.
      }
    } else if (typeof this.data.departmentId === 'number') {
      departmentIdAsNumber = this.data.departmentId;
    } else {
        console.warn('Warning: departmentId no es ni string ni número:', this.data.departmentId);
        // departmentIdAsNumber permanecerá null
    }

    this.addForm = this.fb.group({
      productionOrderId: ['', Validators.required],
      idproject: [''],
      manufacturingDate: [null, Validators.required],
      // createdBy: [''], // Podría ser autocompletado o manejado por el backend
      idProduct: [null, Validators.required],
      departmentId: [ departmentIdAsNumber, Validators.required], // Asignar desde data
      intendedRecipient: [''],
      rejectedQuantity: [0, [Validators.required, Validators.min(0)]],
      planningComment: [''],
      idCauseNonConformity: [null, Validators.required],
      iddisposition: [null, Validators.required],
      doComment: [''],
      dispositionCost: [0, Validators.min(0)],
      estimatedClosingDate: [null],
      doObservation: [''] 
      
      // Otros campos según tu modelo NonConformityProduct para creación
    });
  }

  workOrderSearchTerm = new Subject<string>();


  ngOnInit(): void {
    this.loadInitialData();
    //this.loadop(); // Cargar las órdenes de trabajo filtradas
    this.setupProductFilter();
    this.setupWorkorderFilter();
    this.departmentName = this.storageService.getDepartmentName();
    this.currentUserEmail = this.storageService.getCurrentUserEmail(); // Obtener el email del usuario
 
    
    console.log('filteredWorkOrders', this.filteredWorkOrders$);

    this.filteredWorkOrders$ = this.workOrderSearchTerm.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.searchWorkOrders(term))
    );
  
    console.log('filteredWorkOrders', this.filteredWorkOrders$);
    // Inicializa con lista completa
    this.workOrderSearchTerm.next('');

  }



  onWorkOrderSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.workOrderSearchTerm.next(input.value); // 🔥 Esto emite al observable
  }
  
  searchWorkOrders(term: string): Observable<any[]> {
    console.log('Buscando órdenes de trabajo con término:', term); // 👈 verifica esto
    return this.http.get<any[]>(`${environment.apiUrlqsa}/workordershow`).pipe(
      map(data => {
        console.log('Data desde API:', data); // 👈 verifica esto
        return data.filter(order =>
          (order.op ?? '').toLowerCase().includes(term.toLowerCase()) ||
          (order.descripcion ?? '').toLowerCase().includes(term.toLowerCase())
        );
      }),
      catchError(err => {
        console.error('Error en API:', err);
        return of([]);
      })
    );
  }

  


  loadInitialData(): void {

    this.ops$ = this.http.get<WorkOrder[]>(`${environment.apiUrlqsa}/workordershow`).pipe(
      catchError(() => of([])), // Manejo de error
      map(products => {
        this.allops = products;
        return products;
      })
    );
    this.filteredWorkOrdersd$ = this.ops$; // Inicialmente muestra todos
 console.log('ops$', this.ops$);

    this.products$ = this.http.get<Product[]>(`${environment.apiUrlqsa}/products`).pipe(
      catchError(() => of([])), // Manejo de error
      map(products => {
        this.allProducts = products;
        return products;
      })
    );
    this.filteredProducts$ = this.products$; // Inicialmente muestra todos

    this.causes$ = this.http.get<CauseNonConformity[]>(`${environment.apiUrlqsa}/non-conformity/causes`).pipe(
      catchError(() => of([]))
    );
    this.dispositions$ = this.http.get<Disposition[]>(`${environment.apiUrlqsa}/dispositions`).pipe(
      catchError(() => of([]))
    );


      // Cargar Destinatario Previsto (Gerente del Departamento)
      if (this.data.departmentId) {
       
this.http.get<DepartmentManagerResponse>(`${environment.apiUrl}/users/gerente/departamento/${this.data.departmentId}`)
.pipe(
  takeUntil(this.destroy$),
  catchError(err => {
    console.error('Error al cargar el gerente del departamento:', err);
    return of([]); // Return an empty array on error
  })
)
.subscribe(responseArray => { // responseArray is ManagerInfo[]
  if (responseArray && responseArray.length > 0) {
    // Assuming you want the first one, or one marked as 'gerenteTitular'
    const manager = responseArray.find(m => m.gerenteTitular) || responseArray[0];
    if (manager) {
      const managerName = `${manager.useremail }`.trim();
      if (managerName) {
        this.addForm.patchValue({ intendedRecipient: managerName });
      }
    }
  } else {
    console.warn('No se pudo obtener el gerente del departamento o la respuesta estaba vacía.');
  }
});
      }
      
  }

  setupProductFilter(): void {
    this.productSearchTerm.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
      map(term => term.trim().toLowerCase())
    ).subscribe(filterValue => {
      if (!filterValue) {
        this.filteredProducts$ = of(this.allProducts);
      } else {
        this.filteredProducts$ = of(
          this.allProducts.filter(product =>
            (product.name?.toLowerCase() || '').includes(filterValue) ||
            (product.description?.toLowerCase() || '').includes(filterValue)
          )
        );
      }
    });
  }

  setupWorkorderFilter(): void {
    this.searchWorkOrderTerm.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
      map(term => term.trim().toLowerCase())
    ).subscribe(filterValue => {
      if (!filterValue) {
        this.filteredWorkOrdersd$ = of(this.allops);
      } else {
        this.filteredWorkOrdersd$ = of(
          this.allops.filter(product =>
            (product.op?.toLowerCase() || '').includes(filterValue) ||
            (product.descripcion?.toLowerCase() || '').includes(filterValue)
          )
        );
      }
    });
  }



  onWorkorderSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    this.searchWorkOrderTerm.next(searchValue);
  }

  onProductSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    this.productSearchTerm.next(searchValue);
  }

  onSave(): void {
    if (this.addForm.valid) {
      let formValue = this.addForm.value;
      // Ajustar fechas a formato ISO si es necesario antes de enviar
      if (formValue.manufacturingDate) {
        formValue.manufacturingDate = new Date(formValue.manufacturingDate).toISOString();
      }
      if (formValue.estimatedClosingDate) {
        formValue.estimatedClosingDate = new Date(formValue.estimatedClosingDate).toISOString();
      }

      formValue = {
        ...formValue, // Copiar todos los valores existentes del formulario
        createdBy: this.currentUserEmail, // Añadir el email del usuario actual
        creationDate: new Date().toISOString(), // Añadir la fecha y hora actual en formato ISO
        nonConformityAttachmentIds: this.attachmentIds 
      };

      this.dialogRef.close(formValue);
    } else {
      this.addForm.markAllAsTouched(); // Muestra errores de validación
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  selectedFiles: File[] = [];


  uploadFilesa() {
    console.log('Archivo subiendose:');
    if (!this.selectedFiles.length) return;

    this.selectedFiles.forEach(file => {
      const formData = new FormData();
      formData.append('myFile', file);
  
      this.http.post(`${environment.apiUrlqsa}/attachments/upload`, formData).subscribe({
        next: (res: any) => {
          // Guarda la info del archivo subido (ejemplo: nombre y ruta)
          this.uploadedFiles.push({
            id: res.nonConformityAttachmentId,
            fileName: res.fileName,
            filePath: res.filePath
          });
          console.log('Archivo subido exitosamente:', res);
        },
        error: (err) => console.error('Error al subir archivo:', err),
      });
    });
  
    // Limpia el arreglo si quieres evitar subidas duplicadas
    this.selectedFiles = [];
  }

  
  onUpload(event: any) {
    console.log('Archivo subido en upload:');
    const fileData = event.file; // según la librería file-upload
    const formData = new FormData();
    formData.append('myFile', fileData);
    console.log('Archivo subido en upload:');

    this.http.post(`${environment.apiUrlqsa}/attachments/upload`, formData).subscribe({
      next: (res: any) => {
        console.log('Archivo subido exitosamente:', res);
        // Guarda la info del archivo subido (ej. nombre) para mostrarlo
        this.uploadedFiles.push({ name: fileData.name, url: res?.url });
      },
      error: (err) => console.error(err),
    });
  }

  onRemove(event: any) {
    // Opcional: hacer delete en tu backend
    this.uploadedFiles = this.uploadedFiles.filter(f => f.name !== event.file.name);
  }

  onFileSelected(event: any): void {
    // Se asume que el componente envía el archivo en event.detail.file
    const file = event.detail?.file;
    console.log('Archivo seleccionado:', file);
  }

  onUploadStart(event: any): void {
    console.log('La subida ha iniciado.');
  }

  onUploadProgress(event: any): void {
    // Se asume que el progreso está en event.detail.progress (porcentaje)
    const progress = event.detail?.progress;
    console.log(`Progreso de subida: ${progress}%`);
  }

  onUploadSuccess(event: any): void {
    console.log('La imagen se ha subido exitosamente.');
  }

  onUploadError(event: any): void {
    const error = event.detail?.error;
    console.error('Ocurrió un error durante la subida:', error);
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  @ViewChild('fileInput') fileInput!: ElementRef;

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
    this.selectedFiles = Array.from(event.dataTransfer.files);
    console.log('Archivos seleccionados por drag & drop:', this.selectedFiles);
    
    // Opcional: disparar el evento change del input file para mantener consistencia
    const changeEvent = {
      target: {
        files: event.dataTransfer.files
      }
    };
    this.onFilesSelected(changeEvent);
  }
}



// También puedes agregar un método para activar el input file cuando se hace clic en el área
openFileSelector() {
  this.fileInput.nativeElement.click();
}

onFilesSelected(event: any) {
  if (event.target && event.target.files) {
    // Añade nuevos archivos a los ya seleccionados (en lugar de reemplazarlos)
    const newFiles = Array.from(event.target.files) as File[];
    this.selectedFiles = [...this.selectedFiles, ...newFiles];
    console.log('Archivos seleccionados:', this.selectedFiles);
  }
}

// Eliminar un archivo seleccionado según su índice
removeSelectedFile(index: number) {
  this.selectedFiles.splice(index, 1);
}

// Limpiar toda la selección
clearSelectedFiles() {
  this.selectedFiles = [];
}

// 1. En uploadSingleFile
uploadSingleFile(file: File) {
  const formData = new FormData();
  formData.append('file', file); // Cambiar 'myFile' a 'file'
  
  this.http.post(`${environment.apiUrlqsa}/attachments/upload`, formData).subscribe({
    next: (res: any) => {
      // ...resto del código sin cambios
            // Guarda el ID del archivo en el arreglo
            this.attachmentIds.push(res.nonConformityAttachmentId);
      
            this.uploadedFiles.push({
              id: res.nonConformityAttachmentId,
              fileName: res.fileName,
              filePath: res.filePath
            });

                  // Eliminar el archivo de seleccionados
      this.selectedFiles = this.selectedFiles.filter(f => f !== file);
      console.log('IDs guardados:', this.attachmentIds);

    },
    error: (err) => console.error('Error al subir archivo:', err),
  });
}

// 2. En uploadFiles
uploadFiles() {
  if (!this.selectedFiles.length) return;
  
  const uploadObservables = this.selectedFiles.map(file => {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${environment.apiUrlqsa}/attachments/upload`, formData);
  });
  
  forkJoin(uploadObservables).subscribe({
    next: (responses: any[]) => {
      responses.forEach(res => {
        // Guarda cada ID en el arreglo
        this.attachmentIds.push(res.nonConformityAttachmentId);
        
        this.uploadedFiles.push({
          id: res.nonConformityAttachmentId,
          fileName: res.fileName,
          filePath: res.filePath
        });
      });
      
      console.log('IDs de todos los archivos:', this.attachmentIds);
      this.selectedFiles = [];
    },
    error: (err) => console.error('Error en subida:', err),
  });
}



// Opcional: eliminar un archivo ya subido
removeUploadedFile(index: number) {
  // Si necesitas también eliminarlo del backend:
  // const fileToDelete = this.uploadedFiles[index];
  // this.http.delete(`${environment.apiUrlqsa}/attachments/${fileToDelete.id}`).subscribe(...);
  
  this.uploadedFiles.splice(index, 1);
}


// Método para manejar archivos subidos
onFilesUploaded(files: any[]) {
  // Guardar los IDs de los archivos
  files.forEach(file => {
    this.attachmentIds.push(file.id);
  });
  console.log('Archivos subidos:', files);
  console.log('IDs guardados:', this.attachmentIds);
}

// Método para manejar archivos eliminados
onFileRemoved(fileId: number) {
  // Eliminar el ID del arreglo
  this.attachmentIds = this.attachmentIds.filter(id => id !== fileId);
  console.log('Archivo eliminado ID:', fileId);
  console.log('IDs restantes:', this.attachmentIds);
}

}
