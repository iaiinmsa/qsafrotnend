import { Component } from '@angular/core';
import { SqlConsultService } from './sql-consult.service';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-sql-viewer',
  standalone: true,
    imports: [
  FormsModule,
  HttpClientModule,
  MatFormFieldModule,
  MatInputModule,
  MatTableModule,
  MatButtonModule,
  CommonModule 
],

  templateUrl: './sql-viewer.component.html',
  styleUrls: ['./sql-viewer.component.scss']
  
})
export class SqlViewerComponent {
  question = '';
  table = 'workorder';
  result: any[] = [];
  columns: string[] = [];
  sql: string = '';
  error: string | null = null;

  constructor(private sqlService: SqlConsultService) {}

  enviarConsulta() {
    console.log('esta procesando la pregunta'); 
    this.sqlService.consultar({ question: this.question, table: this.table }).subscribe({
      next: (res) => {
        console.log('respuesta', res);   
        this.result = res.result || [];
        this.columns = this.result.length ? Object.keys(this.result[0]) : [];
        this.sql = res.sql;
        this.error = null;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error desconocido';
      }
    });
  }
}
