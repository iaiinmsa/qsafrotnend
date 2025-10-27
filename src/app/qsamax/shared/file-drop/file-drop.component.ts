// file-drop.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-file-drop',
    standalone: true,
    imports: [
    CommonModule,
    MatIconModule,   // <-- Agregar aquí
    MatButtonModule,
    // otros módulos que uses
  ],
  templateUrl: './file-drop.component.html',
  styleUrls: ['./file-drop.component.scss']
})
export class FileDropComponent {
  @Input() title: string = 'Archivos';
  @Input() type: string = 'default'; // nueva propiedad
 // @Output() filesSelected = new EventEmitter<File[]>();
 @Output() filesUploaded = new EventEmitter<{ type: string, files: File[] }>();
@Output() filesSelected = new EventEmitter<{ type: string, files: File[] }>();

  selectedFiles: File[] = [];
  uploadedFiles: any[] = [];

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
    }
  }

  handleFiles(fileList: FileList) {
    const files = Array.from(fileList);
    this.selectedFiles.push(...files);
  //  this.filesSelected.emit(this.selectedFiles);
  this.filesSelected.emit({ type: this.type, files: this.selectedFiles });
  }

  removeSelectedFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.filesSelected.emit({ type: this.type, files: this.selectedFiles });

    
  }

  clearSelectedFiles() {
    this.selectedFiles = [];
  }

  uploadAll() {
    // simula subida
       this.uploadedFiles.push(...this.selectedFiles);
    this.filesUploaded.emit({ type: this.type, files: [...this.uploadedFiles] });
    this.selectedFiles = [];
  }
}
