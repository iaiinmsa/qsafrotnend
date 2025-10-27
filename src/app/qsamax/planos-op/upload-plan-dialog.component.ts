// upload-plan-dialog.component.ts

import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core'; // Opcional, pero recomendable
import { catchError, debounceTime, distinctUntilChanged, forkJoin, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';
import { WorkOrder } from '../../models/Product.model';
import { MatIconModule } from '@angular/material/icon';
import { StorageService } from '../../authentication/storage.service';


@Component({
  selector: 'app-upload-plan-dialog',
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
    MatIconModule 
  ],
  templateUrl: './upload-plan-dialog.component.html',
    styleUrls: ['./upload-plan-dialog.component.scss']
})
export class UploadPlanDialogComponent {
  form: FormGroup;
  selectedFile: File | null = null;
  planTypes: any[] = [];
 workOrderSearchTerm = new Subject<string>();
  
 filteredWorkOrdersd$!: Observable<WorkOrder[]>;
 ops$: Observable<WorkOrder[]> = of([]);
   private allops: WorkOrder[] = [];
   currentUserEmail: string | null = null; 
 

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UploadPlanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
     private storageService: StorageService ,
       private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      user_name: ['', Validators.required],
      production_order: ['', Validators.required],
      project_name: ['', Validators.required],
      plan_type: ['', Validators.required],
      plan_review: ['', Validators.required],
      file: [null, Validators.required],
    });
  }


  ngOnInit(): void {
  
    this.currentUserEmail = this.storageService.getCurrentUserEmail()

      this.form.patchValue({
    user_name: this.currentUserEmail
  });
   
  this.loadPlanTypes();
  this.workOrderSearchTerm.next('');
  this.loadworkorder();
}


  loadPlanTypes(): void {
  this.http.get<any[]>(`${environment.apiUrlqsa}/plan-type`).subscribe({
    next: (data) => {
      this.planTypes = data;
    },
    error: (err) => {
      console.error('Error cargando tipos de plano:', err);
    }
  });



     

   
}

    loadworkorder(): void {
  
      this.http.get<WorkOrder[]>(`${environment.apiUrlqsa}/workordershow`).pipe(
    catchError(() => of([]))
  ).subscribe(products => {
    this.allops = products;
    console.log('allops', this.allops);

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



  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.form.patchValue({ file: this.selectedFile });
    }

    
  }


  onFilesSelected(event: any) {
  if (event.target && event.target.files) {
    const newFiles = Array.from(event.target.files) as File[];
    this.selectedFiles = [...this.selectedFiles, ...newFiles];

    console.log('Archivos seleccionados:', this.selectedFiles);

    // ✅ Si quieres que el primer archivo se use como "archivo principal" en el formulario:
    if (this.selectedFiles.length) {
      this.selectedFile = this.selectedFiles[0];
      this.form.patchValue({ file: this.selectedFile });
        this.selectedFile = this.selectedFiles[0];
  this.form.get('file')?.setValue(this.selectedFile);
  this.form.get('file')?.markAsTouched();
  this.form.get('file')?.updateValueAndValidity();
    }
  }
}


  submit() {
    if (this.form.valid && this.selectedFile) {
      this.dialogRef.close({
        ...this.form.value,
        file: this.selectedFile,
      });
    }
  }

  cancel() {
    this.dialogRef.close(null);
  }



      onWorkOrderSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    this.workOrderSearchTerm.next(input.value); // 🔥 Esto emite al observable
  }




onWorkOrderSelected(event: MatSelectChange): void {
  
  const selectedOp = event.value;
  const selected = this.allops.find(op => op.op === selectedOp);
  
  if (selected) {
    this.form.patchValue({ project_name: selected.descripcion || '' });
    this.form.get('project_name')?.setValue(selected.descripcion || '');
     console.log('Seteando descripción:', selected.descripcion);
     this.cdr.detectChanges(); 
  }
  console.log('Orden de producción seleccionada:', this.form);

  
}


  selectedFiles: File[] = [];
  uploadedFiles: any[] = [];


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



onDropb(event: DragEvent) {
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


onFilesSelectedb(event: any) {
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



// 1. En uploadSingleFile
uploadSingleFile(file: File) {
 
}


clearSelectedFiles() {
  this.selectedFiles = [];
}


  uploadFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.form.patchValue({ file: this.selectedFile });
    }
  }


// 2. En uploadFiles
uploadFilesa() {
  if (!this.selectedFiles.length) return;
  
  const uploadObservables = this.selectedFiles.map(file => {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${environment.apiUrlqsa}/attachments/upload`, formData);
  });
  
 
      
}


// Opcional: eliminar un archivo ya subido
removeUploadedFile(index: number) {
  // Si necesitas también eliminarlo del backend:
  // const fileToDelete = this.uploadedFiles[index];
  // this.http.delete(`${environment.apiUrlqsa}/attachments/${fileToDelete.id}`).subscribe(...);
  
  this.uploadedFiles.splice(index, 1);
}


}
