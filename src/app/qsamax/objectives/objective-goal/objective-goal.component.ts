import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';



import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { animate, state, style, transition, trigger } from '@angular/animations'; // Para animación de expansión
import { Objective } from '../../../models/objective.model';
import { ObjectiveGoalDetail } from '../../../models/ObjectiveGoalDetail.model';
import { environment } from '../../../../environments/environment';
import { AddObjectiveDialogComponent } from '../add-objective-dialog.component';
import { AddObjectiveGoalDetailDialogComponent } from './add-objective-goal-detail-dialog.component';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { StorageService } from '../../../authentication/storage.service';

@Component({
  selector: 'app-objective-goal',
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
    MatDatepickerModule, // <--- AÑADIDO
    MatNativeDateModule  // <--- AÑADIDO
  ],
  templateUrl: './objective-goal.component.html',
  styleUrls: ['./objective-goal.component.scss'],
  animations: [ // Animación para expandir/colapsar la fila de detalle
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ObjectiveGoalComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'description', 'goalBase', 'goalAverage', 'active', 'departmentId', 'usercreate', 'createdate', 'acciones'];
  dataSource = new MatTableDataSource<Objective>();
  departmentId: string | null = null;
  userRoles: string[] = [];

  // Para la tabla de detalles
  selectedObjectiveForDetail: Objective | null = null;
  detailDataSource = new MatTableDataSource<ObjectiveGoalDetail>();
  displayedColumnsDetail: string[] = ['idObjgoal', 'currentGoal', 'month', 'years', 'usercreate', 'createdate', 'accionesDetail'];
  isLoadingDetail = false;

  constructor(
    private http: HttpClient,
    public dialog: MatDialog,
    private storageService: StorageService ,// Inyecta StorageService
   
  ) {}

  ngOnInit(): void {
    this.departmentId = this.storageService.getDepartmentId(); // Usar StorageService
    this.userRoles = this.storageService.getUserRoles(); // Usar StorageService

    if (this.departmentId) {
      console.log('ObjectiveGoalComponent: departmentId cargado vía StorageService:', this.departmentId);
      this.loadObjectiveGoals(); // O tu método de carga de datos
    } else {
      console.error('ObjectiveGoalComponent: departmentId no encontrado vía StorageService.');
    }
    console.log('ObjectiveGoalComponent: User roles cargados vía StorageService:', this.userRoles);
 
  }


  openAddDetailDialog(objectiveId: number): void {
    if (!objectiveId) {
      console.error("ID de objetivo no proporcionado para agregar detalle.");
      return;
    }

    const dialogRef = this.dialog.open(AddObjectiveGoalDetailDialogComponent, {
      width: '500px', // Ajusta según necesites
      data: { idObjective: objectiveId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // 'result' contiene el objeto ObjectiveGoalDetail (sin idObjgoal)
        this.http.post<ObjectiveGoalDetail>(`${environment.apiUrlqsa}/objectives/goal`, result)
          .subscribe({
            next: (savedDetail) => {
              console.log('Detalle de meta guardado:', savedDetail);
              // Si el objetivo para el que se agregó el detalle es el actualmente seleccionado, recargar sus detalles
              if (this.selectedObjectiveForDetail && this.selectedObjectiveForDetail.id === objectiveId) {
                this.loadObjectiveGoalDetails(objectiveId);
              }
            },
            error: (err: HttpErrorResponse) => {
              console.error('Error al guardar el detalle de la meta:', err);
              // Aquí podrías mostrar un mensaje de error al usuario
            }
          });
      }
    });
  }

  

  loadObjectiveGoals(): void {
    if (!this.departmentId) return;
    // ... (código existente para loadObjectiveGoals)
// ...existing code...
    this.http.get<Objective[]>(`${environment.apiUrlqsa}/objectives/by-department/${this.departmentId}`).subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err: HttpErrorResponse) => {
        console.error(`Error al cargar los objetivos para el departamento ${this.departmentId}:`, err);
      }
    });
// ...existing code...
  }

  toggleObjectiveDetail(objective: Objective): void {
    if (this.selectedObjectiveForDetail === objective) {
      this.selectedObjectiveForDetail = null; // Colapsar si ya está seleccionado
      this.detailDataSource.data = []; // Limpiar datos de detalle
    } else {
      this.selectedObjectiveForDetail = objective;
      this.loadObjectiveGoalDetails(objective.id);
    }
  }

  loadObjectiveGoalDetails(objectiveId: number): void {
    this.isLoadingDetail = true;
    this.detailDataSource.data = []; // Limpiar datos anteriores
    this.http.get<ObjectiveGoalDetail[]>(`${environment.apiUrlqsa}/objectives/${objectiveId}/goals`).subscribe({
      next: (data) => {
        this.detailDataSource.data = data;
        this.isLoadingDetail = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error(`Error al cargar los detalles de las metas para el objetivo ${objectiveId}:`, err);
        this.isLoadingDetail = false;
        // Opcionalmente, mostrar un mensaje al usuario
      }
    });
  }

  addObjectiveGoal(): void {
    // ... (código existente para addObjectiveGoal)
// ...existing code...
    if (!this.departmentId) {
        alert("No se pudo determinar el departamento. Asegúrese de que esté configurado.");
        return;
    }
    const dialogRef = this.dialog.open(AddObjectiveDialogComponent, {
      width: '600px',
      data: { departmentId: parseInt(this.departmentId, 10) } 
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.post<Objective>(`${environment.apiUrlqsa}/objectives`, result)
          .subscribe({
            next: (savedObjective) => {
              console.log('Objetivo (meta) guardado:', savedObjective);
              this.loadObjectiveGoals(); 
            },
            error: (err: HttpErrorResponse) => {
              console.error('Error al guardar el objetivo (meta):', err);
            }
          });
      }
    });
// ...existing code...
  }

  editObjectiveGoal(objective: Objective): void {
    // ... (código existente para editObjectiveGoal)
// ...existing code...
    if (!this.departmentId) return;
    const dialogRef = this.dialog.open(AddObjectiveDialogComponent, {
      width: '600px',
      data: { objective: { ...objective }, isEditMode: true, departmentId: parseInt(this.departmentId, 10) }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.http.put<Objective>(`${environment.apiUrlqsa}/objectives/${objective.id}`, result)
          .subscribe({
            next: (updatedObjective) => {
              console.log('Objetivo (meta) actualizado:', updatedObjective);
              this.loadObjectiveGoals();
            },
            error: (err: HttpErrorResponse) => {
              console.error('Error al actualizar el objetivo (meta):', err);
            }
          });
      }
    });
// ...existing code...
  }

  deleteObjectiveGoal(objective: Objective): void {
    // ... (código existente para deleteObjectiveGoal)
// ...existing code...
    if (confirm(`¿Estás seguro de que deseas eliminar el objetivo "${objective.name}"?`)) {
      this.http.delete(`${environment.apiUrlqsa}/objectives/${objective.id}`)
        .subscribe({
          next: () => {
            console.log(`Objetivo "${objective.name}" eliminado con éxito.`);
            this.loadObjectiveGoals();
            if (this.selectedObjectiveForDetail && this.selectedObjectiveForDetail.id === objective.id) {
              this.selectedObjectiveForDetail = null; // Limpiar detalle si el objetivo eliminado era el seleccionado
              this.detailDataSource.data = [];
            }
          },
          error: (err: HttpErrorResponse) => {
            console.error(`Error al eliminar el objetivo "${objective.name}":`, err);
          }
        });
    }
// ...existing code...
  }


  deleteObjectiveGoalDetail(detail: ObjectiveGoalDetail, objectiveId: number): void {
    // Confirmación antes de eliminar
    if (confirm(`¿Está seguro de que desea eliminar la meta con ID ${detail.idObjgoal} del objetivo "${this.selectedObjectiveForDetail?.name}"?`)) {
      this.http.delete(`${environment.apiUrlqsa}/objectives/goal/${detail.idObjgoal}`)
        .subscribe({
          next: () => {
            console.log(`Meta con ID ${detail.idObjgoal} eliminada con éxito.`);
            // Recargar los detalles del objetivo padre para reflejar la eliminación
            this.loadObjectiveGoalDetails(objectiveId);
          },
          error: (err: HttpErrorResponse) => {
            console.error(`Error al eliminar la meta con ID ${detail.idObjgoal}:`, err);
            // Aquí podrías mostrar un mensaje de error al usuario (ej. con MatSnackBar)
          }
        });
    }
  }
  

  applyFilter(event: Event): void {
    // ... (código existente para applyFilter)
// ...existing code...
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
// ...existing code...
  }
}