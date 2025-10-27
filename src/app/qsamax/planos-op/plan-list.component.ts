// src/app/components/plan-list/plan-list.component.ts

import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { PlanHeader } from '../../models/PlanHeader.model';
import { StorageService } from '../../authentication/storage.service';
import { environment } from '../../../environments/environment';

import { animate, state, style, transition, trigger } from '@angular/animations'; 
import { UploadPlanDialogComponent } from './upload-plan-dialog.component';
import { planAddDetailDialogComponent } from './plan-adddetaildialog.component.';


@Component({
  selector: 'app-plan-list',
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
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './plan-list.component.html',
  styleUrls: ['./plan-list.component.scss'],
    animations: [ // Animación para expandir/colapsar la fila de detalle
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class PlanListComponent implements OnInit {
  displayedColumns: string[] = ['idPlan', 'production_order', 'project_name', 'created_at', 'acciones'];
  dataSource = new MatTableDataSource<PlanHeader>();
  loading = false;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    public dialog: MatDialog,
    private storageService: StorageService
  ) {}


  displayedColumnsDetail: string[] = [
  'file_name',
  'plan_type',
  'plan_review',
  'uploaded_by',
  'upload_at',
 'file_path',
 'descargar'
];

selectedPlan: PlanHeader | null = null;

toggleDetail(plan: PlanHeader): void {
  this.selectedPlan = this.selectedPlan === plan ? null : plan;
}



  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading = true;
    this.http.get<PlanHeader[]>(`${environment.apiUrlqsa}/plan-header`).subscribe({
      next: (data) => {
        console.log('Planes cargados:', data);
        this.dataSource.data = data;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = 'Error al cargar los planes';
        this.loading = false;
        console.error(err);
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }


  downloadFile(path: string): void {
  const fileName = encodeURIComponent(path.split('\\').pop() || '');
  const url = `${environment.apiUrlqsa}/download?file=${fileName}`;
  window.open(url, '_blank');
}

  // Aquí puedes agregar métodos openDialog(), editPlan(), deletePlan() si lo deseas
  
  openUploadPlanDialog(): void {
  const dialogRef = this.dialog.open(UploadPlanDialogComponent, {
    width: '600px',
  });


  

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.uploadPlan(result);
    }
  });
}

uploadPlan(formData: any): void {
  const data = new FormData();
  data.append('file', formData.file);
  data.append('user_name', formData.user_name);
  data.append('production_order', formData.production_order);
  data.append('project_name', formData.project_name);
  data.append('plan_type', formData.plan_type);
  data.append('plan_review', formData.plan_review);

  this.http.post(`${environment.apiUrlqsa}/planos/subir`, data).subscribe({
    next: (res) => {
      console.log('Plano subido:', res);
      this.loadPlans(); // refrescar la lista si quieres
    },
    error: (err) => {
      console.error('Error subiendo plano:', err);
    }
  });
}



openAddDetailDialog(idPlan: number) {
  const dialogRef = this.dialog.open(planAddDetailDialogComponent, {
    width: '500px',
    data: { planId: idPlan }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Si se subió un detalle, actualizamos la lista
      this.loadPlans(); // reemplaza con tu método para recargar los datos
    }
  });

}

}
