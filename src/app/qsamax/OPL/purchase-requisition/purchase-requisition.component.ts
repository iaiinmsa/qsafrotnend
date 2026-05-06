import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit  ,ViewChild  } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { requestHeader } from './interfaces/requestHeader';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import * as XLSX from 'xlsx';
import { PurchaseRequisitionService } from './purchase-requisition.service';
import { StorageService } from '../../../authentication/storage.service';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { ConfirmDialogComponent } from './dialogs/confirm-dialog.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-purchase-requisition',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MaterialModule,
    MatTabsModule,
    MatSlideToggleModule,
    FormsModule
  ],
  
  templateUrl: './purchase-requisition.component.html',// Asegúrate de que el nombre coincida exactamente
  styleUrls: ['./purchase-requisition.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' , overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4,0.0,0.2,1)'))
    ])
  ]
})
export class PurchaseRequisitionComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['numero', 'estado', 'usuario', 'fecha', 'comentario', 'acciones'];
  displayedColumnsDetail: string[] = ['articulo', 'descripcion', 'cantidad', 'unidad'];

  dataSource = new MatTableDataSource<requestHeader>();
  selectedRequest: requestHeader | null = null;
  loading = false;
  currentUserEmail: string | null = null; 
  vistaActual: string = 'uso_especifico';
  permisoConfirmado: boolean = false; // ✅ Nueva variable para controlar la UI
  rolesUsuario: string[] = []; // Inicialmente vacío
  verHistorial: boolean = false;




@ViewChild(MatPaginator) paginator!: MatPaginator;


  // ✅ Helper para buscar roles ignorando mayúsculas, minúsculas y espacios extra
  private tieneRol(nombreRol: string): boolean {
    return this.rolesUsuario.some(r => r.trim().toLowerCase() === nombreRol.toLowerCase());
  }

  get tienePermisoJefe(): boolean { 
    return this.tieneRol('SoliJefe'); 
  }

  get tienePermisoAutorizar(): boolean { 
    return this.tieneRol('Soliauto'); 
  }

  get tienePermisoAprobar(): boolean { 
    return this.tieneRol('Soliapro'); 
  }
  
  get tienePermisoUsoEspecifico(): boolean { 
    return this.tieneRol('Soliuso'); 
  }

  // ✅ Nueva validación: ¿Tiene al menos uno de los roles de esta pantalla?
  get tieneAccesoModulo(): boolean {
    return this.tienePermisoUsoEspecifico || this.tienePermisoJefe || this.tienePermisoAutorizar || this.tienePermisoAprobar;
  }

  constructor(
    private http: HttpClient,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private requisitionService: PurchaseRequisitionService,
    private storageService: StorageService,
  ) {}

 

  ngOnInit(): void {
    this.currentUserEmail = this.storageService.getEmail();
    this.rolesUsuario = this.storageService.getUserRoles() || [];

    // ✅ Log detallado para ver qué está pasando realmente
    console.log('--- Verificación de Permisos ---');
    console.log('Email:', this.currentUserEmail);
    console.log('Roles en arreglo:', JSON.stringify(this.rolesUsuario));
    console.log('¿Tiene algún rol de este módulo?:', this.tieneAccesoModulo);

    if (!this.currentUserEmail || !this.tieneAccesoModulo) {
      console.warn('Acceso denegado: El usuario no tiene los roles específicos de esta pantalla.');
      this.permisoConfirmado = false; // Bloqueamos la vista
      return; 
    }

    this.permisoConfirmado = true; // ✅ Acceso validado correctamente

    // ✅ IMPORTANTE: Inicializar vistaActual según el primer permiso que encuentre
    // Si no hacemos esto, siempre intentará cargar 'uso_especifico' por defecto
    if (this.tienePermisoUsoEspecifico) this.vistaActual = 'uso_especifico';
    else if (this.tienePermisoJefe) this.vistaActual = 'pendientes_revisar_jefe';
    else if (this.tienePermisoAutorizar) this.vistaActual = 'pendientes_autorizar';
    else if (this.tienePermisoAprobar) this.vistaActual = 'pendientes_aprobar';

    this.cargarDatos();
  }

 


  onTabChange(event: MatTabChangeEvent): void {
    switch (event.tab.textLabel) {
      case 'Uso Específico':
        this.vistaActual = 'uso_especifico';
        break;
      case 'Revisión (Jefe)':
        this.vistaActual = 'pendientes_revisar_jefe';
        break;
      case 'Por Autorizar':
        this.vistaActual = 'pendientes_autorizar';
        break;
      case 'Por Aprobar':
        this.vistaActual = 'pendientes_aprobar';
        break;
    }
    
    this.cargarDatos(); 
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  // 3. EL METODO ADAPTADO PARA CONSUMIR TU ENDPOINT
  cargarDatos(): void {
    this.loading = true;

    // Construimos los parámetros de la URL de forma segura
const vistaActual =  this.vistaActual; // 'uso_especifico';
    const emailSesion = this.currentUserEmail ?? ''; 
    const empleadoID = 'RFG';

    // Hacemos la petición GET (Asegúrate de que la ruta coincida con tu backend, ej: apiUrl + '/bandeja')
    this.requisitionService.getBandejaTareas(vistaActual, emailSesion, empleadoID).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        console.log('Datos recibidos:', data);

        // Asignar paginator con un pequeño delay
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
        });

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar la bandeja:', err);
        this.snackBar.open('Error al cargar los datos', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  // Utilidad para el buscador general
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // Expandir / Contraer fila
  toggleDetail(row: requestHeader): void {
    this.selectedRequest = this.selectedRequest === row ? null : row;
  }

  /**
   * Lógica para aprobar o detener una solicitud
   */
  confirmarAccion(row: requestHeader, accion: 'aprobar' | 'detener'): void {
    const isAprobar = accion === 'aprobar';

   // 1. Abrir el Modal Moderno (MatDialog)
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      disableClose: true, // Evita que se cierre al hacer clic afuera
      data: {
        title: isAprobar ? 'Aprobar Solicitud' : 'Detener/Rechazar Solicitud',
        message: isAprobar 
          ? `¿Está seguro que desea APROBAR la solicitud #${row.numero}?`
          : `¿Está seguro que desea DETENER o RECHAZAR la solicitud #${row.numero}?`,
        requiresComment: !isAprobar, // Pide comentario obligatorio si es rechazo
        isDestructive: !isAprobar    // Si es rechazo, el botón será rojo (warn)
      }
    });

   
    // 2. Esperar a que el usuario interactúe con el modal
    dialogRef.afterClosed().subscribe(result => {
      
      // Si result es undefined, significa que presionó "Cancelar"
      if (!result || !result.confirmed) {
        return; 
      }

      let nuevoEstado = 0;
      let comentario = result.comentario || '';

    if (isAprobar) {
      // Mapeo de estados destino según la vista actual
      switch(this.vistaActual) {
          case 'uso_especifico': nuevoEstado = 7; break; 
          case 'pendientes_revisar_jefe': nuevoEstado = 6; break; 
          case 'pendientes_autorizar': nuevoEstado = 8; break; 
          case 'pendientes_aprobar': nuevoEstado = 9; break; 
        }
      
    } else {
    
      switch(this.vistaActual) {
          case 'uso_especifico': nuevoEstado = 10; break;          // Backend guardará en RequestComment
          case 'pendientes_revisar_jefe': nuevoEstado = 11; break; // Backend guardará en ReviewComment
          case 'pendientes_autorizar': nuevoEstado = 12; break;    // Backend guardará en AuthComment
          case 'pendientes_aprobar': nuevoEstado = 13; break;      // Backend guardará en ApprovalComment
        }
    }

    this.loading = true;
    this.requisitionService.cambiarEstado(row.numero.toString(), this.currentUserEmail || '', nuevoEstado, comentario).subscribe({
      next: () => {
        this.snackBar.open(`Solicitud ${accion === 'aprobar' ? 'aprobada' : 'detenida'} con éxito`, 'Cerrar', { duration: 3000 });
        this.cargarDatos(); // Recargar la tabla para reflejar los cambios
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Error al procesar el cambio de estado', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  });
}


  // Adaptación de la exportación a Excel
  exportToExcel(): void {
    const dataToExport = this.dataSource.data.map(req => ({
      '# Solicitud': req.numero,
      'Estado': req.estado,
      'Solicitante': req.usuario,
      'Fecha': new Date(req.fecha).toLocaleDateString(),
      'Comentario': req.comentario
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bandeja');
    XLSX.writeFile(workbook, 'bandeja-tareas.xlsx');
  }

  

  
}