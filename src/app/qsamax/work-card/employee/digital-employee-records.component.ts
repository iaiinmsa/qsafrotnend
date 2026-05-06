import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WorkCardService } from '../work-card.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-digital-employee-records',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatTableModule, MatIconModule, MatButtonModule, 
    MatTooltipModule, MatTabsModule, ReactiveFormsModule, MatFormFieldModule, 
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './digital-employee-records.component.html',
   styleUrls: ['./digital-employee-records.component.scss'],
  styles: [`
    .records-table { width: 100%; margin-top: 15px; }
    .header-info { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
  `]
})
export class DigitalEmployeeRecordsComponent implements OnInit {
  displayedColumns: string[] = ['nombre_archivo', 'tipo', 'fecha_subida', 'acciones'];
  dataSource: any[] = [];
  isLoading = true;
  uploadForm!: FormGroup;
  categories: any[] = [];


  isDragging = false;
   selectedFiles: File[] = [];
    selectedFile: File | null = null;
    uploadedFiles: any[] = [];


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private workCardService: WorkCardService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadRecords();
    this.loadCategories();
  }

  initForm(): void {
    this.uploadForm = this.fb.group({
      employeeId: [this.data.codigo, Validators.required],
      category: ['', Validators.required],
      documentName: ['', Validators.required],
      sharepointUrl: ['PENDIENTE_ARCHIVO'], 
      entryType: ['FILE'],
      issueDate: [null],
      expiryDate: [null],
      reviewStatus: ['PENDIENTE'],
      remarks: [''],
      uploadedBy: ['SISTEMA_RRHH']
    });
  }

  loadRecords(): void {
    this.isLoading = true;
    console.log('Cargando expedientes para código:', this.data);
    this.workCardService.getEmployeeRecords(this.data.codigo).subscribe({
      next: (res) => {
        console.log('Documentos recibidos del servidor:', res);
        this.dataSource = Array.isArray(res) ? res : [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando expedientes:', err);
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    this.workCardService.getCategoriesRecords().subscribe({
      next: (res) => {
        this.categories = res;
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
      }
    });
  }

  verDocumento(url: string): void {
    window.open(url, '_blank');
  }




  onSubmit(): void {
  // 1. Validaciones iniciales
  if (this.uploadForm.invalid || this.selectedFiles.length === 0) {
    console.warn('Formulario inválido o sin archivo');
    return;
  }

  this.isLoading = true;
  const fileToUpload = this.selectedFiles[0];

  // 2. Preparar datos para SharePoint
  const fechaIngreso = new Date(this.data.fechaingreso);
  const yearIngreso = isNaN(fechaIngreso.getTime()) 
                      ? new Date().getFullYear().toString() 
                      : fechaIngreso.getFullYear().toString();

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('year', yearIngreso);
  formData.append('codigo', this.data.codigo);
  formData.append('categoria', this.uploadForm.get('category')?.value);

  // 3. PRIMER PASO: Subir a SharePoint
  this.workCardService.uploadToSharePoint(formData).subscribe({
    next: (response) => {
      console.log('1. SharePoint OK:', response);

      // 4. SEGUNDO PASO: Preparar el payload para SQL con la URL REAL
      const payload = {
        ...this.uploadForm.value,
        // Usamos la URL que nos devolvió SharePoint (webUrl o la propiedad que devuelva tu API)
        sharepointUrl: response.webUrl || response.url || 'URL_NO_RECUPERADA',
        issueDate: this.uploadForm.value.issueDate ? this.uploadForm.value.issueDate.toISOString() : null,
        expiryDate: this.uploadForm.value.expiryDate ? this.uploadForm.value.expiryDate.toISOString() : null
      };

      // 5. TERCER PASO: Guardar en Base de Datos SQL
      this.workCardService.saveEmployeeRecord(payload).subscribe({
        next: () => {
          console.log('2. SQL OK: Registro completo');
          this.loadRecords(); // Recargar tabla
          this.resetFormAfterSuccess();
          this.isLoading = false;
        },
        error: (sqlErr) => {
          console.error('Error al guardar en SQL:', sqlErr);
          this.isLoading = false;
          // Aquí podrías avisar que el archivo se subió pero el registro falló
        }
      });
    },
    error: (spErr) => {
      console.error('Error al subir a SharePoint:', spErr);
      this.isLoading = false;
    }
  });
}


// Función auxiliar para limpiar
private resetFormAfterSuccess() {
  this.selectedFiles = [];
  this.uploadForm.get('documentName')?.reset();
  this.uploadForm.get('category')?.reset();
  this.uploadForm.get('remarks')?.reset();
  this.uploadForm.get('issueDate')?.reset();
  this.uploadForm.get('expiryDate')?.reset();
}

// Manejar cuando el archivo entra al área


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



// Función para descargar/ver el archivo
// En digital-employee-records.component.ts

descargarArchivo(url: string, nombreDocumento: string) {
  this.isLoading = true;

  // Llamamos a tu proxy: http://localhost:3001/credentials/download-file?url=...
  this.workCardService.downloadFileFromProxy(url).subscribe({
    next: (blob: Blob) => {
      // 1. Convertimos los 7078 bytes en una URL local
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // 2. Extraemos la extensión original (png)
      const extension = url.split('.').pop()?.split('?')[0] || 'png';
      
      // 3. Forzamos el nombre que RRHH verá en su PC
      link.setAttribute('download', `${nombreDocumento}.${extension}`);
      
      // 4. Ejecutamos la descarga "invisible"
      document.body.appendChild(link);
      link.click();
      
      // 5. Limpieza total
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      this.isLoading = false;
      console.log('✅ Archivo entregado con éxito al usuario');
    },
    error: (err) => {
      this.isLoading = false;
      console.error('❌ Error al procesar el flujo de bits:', err);
      alert('El servidor entregó el archivo pero el navegador bloqueó la descarga.');
    }
  });
}

// Asegúrate de que loadRecords asigne bien la data

abrirEnSharePoint(url: string) {
  if (url && url !== 'PENDIENTE_ARCHIVO') {
    // Abrimos la URL guardada: https://iargohn.sharepoint.com/...
    window.open(url, '_blank');
  } else {
    // Si por alguna razón la URL está vacía
    console.error('La URL no es válida');
  }
}


}
