import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


import { UploadedFile } from '../../../models/UploadedFile';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  @Input() uploadUrl?: string;
  @Input() responseIdField: string = 'id';
  @Output() filesUploaded = new EventEmitter<any[]>();
  //@Input() uploadUrl: string = `${environment.apiUrlqsa}/attachments/upload`;
  @Input() allowMultiple: boolean = true;
  @Input() fieldName: string = 'file';
  
  //@Output() filesUploaded = new EventEmitter<UploadedFile[]>();
  @Output() fileRemoved = new EventEmitter<number>();
  
  selectedFiles: File[] = [];
  uploadedFiles: UploadedFile[] = [];
  isUploading: boolean = false;
  
  constructor(private http: HttpClient) {}
  
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
      const newFiles = Array.from(event.dataTransfer.files);
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
    }
  }

  onFilesSelected(event: any) {
    if (event.target && event.target.files) {
      const newFiles = Array.from(event.target.files) as File[];
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
    }
  }
  
  removeSelectedFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }
  
  clearSelectedFiles() {
    this.selectedFiles = [];
  }
  
  uploadSingleFile(file: File) {
    if (!this.uploadUrl) {
      console.error('Error: URL de carga no definida');
      return;
    }

    this.isUploading = true;
    
    const formData = new FormData();
    formData.append(this.fieldName, file);
    
    this.http.post(this.uploadUrl, formData).subscribe({
      next: (res: any) => {
        const uploadedFile: UploadedFile = {
          id: res.nonConformityAttachmentId,
          fileName: res.fileName,
          filePath: res.filePath
        };
        
        this.uploadedFiles.push(uploadedFile);
        this.filesUploaded.emit([uploadedFile]);
        
        this.selectedFiles = this.selectedFiles.filter(f => f !== file);
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Error al subir archivo:', err);
        this.isUploading = false;
      },
    });
  }
  
  uploadFiles() {
    if (!this.selectedFiles.length) return;
    if (!this.uploadUrl) {
      console.error('Error: URL de carga no definida');
      return;
    }
    
    this.isUploading = true;
    const url = this.uploadUrl; // Ahora TypeScript sabe que es string
  
    
    const uploadObservables = this.selectedFiles.map(file => {
      const formData = new FormData();
      formData.append(this.fieldName, file);
      return this.http.post(url, formData);
    });
    
    forkJoin(uploadObservables).subscribe({
      next: (responses: any[]) => {
        const uploadedFiles: UploadedFile[] = [];
        
        responses.forEach(res => {
          const uploadedFile: UploadedFile = {
            id: res.nonConformityAttachmentId,
            fileName: res.fileName,
            filePath: res.filePath
          };
          
          this.uploadedFiles.push(uploadedFile);
          uploadedFiles.push(uploadedFile);
        });
        
        this.filesUploaded.emit(uploadedFiles);
        this.selectedFiles = [];
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Error en subida:', err);
        this.isUploading = false;
      },
    });
  }
  
  removeUploadedFile(index: number) {
    const fileId = this.uploadedFiles[index].id;
    this.uploadedFiles.splice(index, 1);
    this.fileRemoved.emit(fileId);
  }
  
  openFileSelector() {
    this.fileInput.nativeElement.click();
  }
}