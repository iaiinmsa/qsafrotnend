
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource ,MatTableModule } from '@angular/material/table';
import { environment } from '../../../environments/environment' ;
import { Objective } from '../../models/objective.model';
import { CommonModule, isPlatformBrowser } from '@angular/common'; // Para el pipe 'date' y otras directivas comunes
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AddObjectiveDialogComponent } from './add-objective-dialog.component';
import { StorageService } from '../../authentication/storage.service';
import { takeUntil } from 'rxjs';




@Component({
  selector: 'app-objectives',
  standalone: true, // Asegúrate de que sea standalone
  imports: [
    CommonModule, // Para el pipe 'date' y directivas como *ngIf, *ngFor
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule, // Necesario para el input dentro de mat-form-field
    MatIconModule,
    MatTableModule,
    MatButtonModule, // Para los botones de acción
    MatTooltipModule // Para los tooltips en los botones
  ],
  templateUrl: './objectives.component.html',
  styleUrls: ['./objectives.component.scss']
})
export class ObjectivesComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'description', 'goalBase', 'goalAverage', 'active', 'departmentId', 'usercreate', 'createdate', 'acciones'];
  dataSource = new MatTableDataSource<Objective>();
  departmentId: string | null = null;
  userRoles: string[] = []; // Para almacenar roles si los necesitas aquí
  isLoading = false; // Para mostrar un indicador de carga

  constructor(private http: HttpClient,
    public dialog: MatDialog,
    private storageService: StorageService // Inyecta StorageService

 
  ) {}

  ngOnInit(): void {
    this.departmentId = this.storageService.getDepartmentId(); // Usar StorageService
    this.userRoles = this.storageService.getUserRoles(); // Usar StorageService para roles también

    console.log('ObjectivesComponent: antes departmentId cargado vía StorageService:', this.departmentId);
    console.log('ObjectivesComponent: antes User roles cargados vía StorageService:', this.userRoles);

    if (this.departmentId) {
      console.log('ObjectivesComponent: departmentId cargado vía StorageService:', this.departmentId);
      this.loadObjective();
    } else {
      console.error('ObjectivesComponent: departmentId no encontrado vía StorageService.');
      // Decide qué hacer si no hay departmentId. ¿Mostrar un mensaje? ¿No cargar datos?
    }
    console.log('ObjectivesComponent: User roles cargados vía StorageService:', this.userRoles);
    
  }






  loadObjective(): void {
    if (!this.departmentId) {
      console.warn('ObjectivesComponent: Intento de cargar objetivos sin departmentId.');
      return;
    }
    this.http.get<Objective[]>(`${environment.apiUrlqsa}/objectives/by-department/${this.departmentId}`).subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err: HttpErrorResponse) => {
        console.error(`Error al cargar los objetivos para el departamento ${this.departmentId}:`, err);
      }
    });
  }


  addObjective(): void {
    const dialogRef = this.dialog.open(AddObjectiveDialogComponent, {
      width: '600px', // Ajusta el ancho según necesites
      // data: { /* puedes pasar datos iniciales al diálogo si es necesario */ }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // El usuario guardó el formulario, 'result' contiene los datos del nuevo objetivo
        // Aquí harías la llamada POST para guardar el nuevo objetivo en tu backend
        // Asumimos que 'usercreate' y 'createdate' se manejan en el backend o se pueden añadir aquí
        const newObjective: Omit<Objective, 'id' | 'usercreate' | 'createdate'> = result;

        this.http.post<Objective>(`${environment.apiUrlqsa}/objectives`, newObjective)
          .subscribe({
            next: (savedObjective) => {
              console.log('Objetivo guardado:', savedObjective);
              this.loadObjective(); // Refrescar la tabla
            },
            error: (err: HttpErrorResponse) => {
              console.error('Error al guardar el objetivo:', err);
              // Aquí podrías mostrar un mensaje de error al usuario
            }
          });
      }
    });
  }


  
  editObjective(objective: Objective): void {
    console.log('Editar objetivo:', objective);
    // Implementa la lógica para editar el objetivo
  }

  deleteObjective(objective: Objective): void {
        // Confirmación antes de eliminar
        if (confirm(`¿Estás seguro de que deseas eliminar el objetivo "${objective.name}"?`)) {
          this.http.delete(`${environment.apiUrlqsa}/objectives/${objective.id}`)
            .subscribe({
              next: () => {
                console.log(`Objetivo "${objective.name}" eliminado con éxito.`);
                this.loadObjective(); // Recargar la lista de objetivos
              },
              error: (err: HttpErrorResponse) => {
                console.error(`Error al eliminar el objetivo "${objective.name}":`, err);
                // Aquí podrías mostrar un mensaje de error al usuario (por ejemplo, con un snackbar)
              }
            });
        }
    // Implementa la lógica para eliminar el objetivo
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}