import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
 
import { PurchaseRequisitionService } from '../../purchase-requisition.service';
import {
  EficienciaHelperService,
  SolicitudEficiencia,
} from '../dashboardtiempos/eficiencia-helper.service';
 
/** Definición de cada fase del proceso */
interface FaseGantt {
  nombre: string;
  campo: keyof SolicitudEficiencia;
  color: string;
}
 
@Component({
  selector: 'app-dashboard-gantt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-gantt.component.html',
  styleUrls: ['./dashboard-gantt.component.scss'],
})
export class DashboardGanttComponent implements OnInit {
 
  // ─── Configuración de fases (orden visual de izquierda a derecha) ─────────
  readonly fases: FaseGantt[] = [
    { nombre: 'Revisión Jefe',       campo: 'HORAS_REVISION_JEFE',     color: '#008FFB' },
    { nombre: 'Revisión Uso',        campo: 'Horas_Para_Revision',     color: '#00C49A' },
    { nombre: 'Autorización',        campo: 'Horas_Para_Autorizacion', color: '#FF4560' },
    { nombre: 'Aprobación Final',    campo: 'Horas_Para_Aprobacion',   color: '#FEB019' },
  ];
 
  // ─── Estado ───────────────────────────────────────────────────────────────
  public cargando = true;
  public readonly isBrowser: boolean;
 
  private _listaSolicitudes: SolicitudEficiencia[] = [];
  public listadoFiltrado:    SolicitudEficiencia[] = [];
 
  public departamentos:      string[] = [];
  public filtroDepartamento  = '';
  public ordenamiento        = 'total_desc';
 
  /** Máximo de horas totales del dataset completo (para escalar las barras). */
  private maxTotal = 1;
 
  constructor(
    private purchaseRequisitionService: PurchaseRequisitionService,
    private eficienciaHelper: EficienciaHelperService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
 
  // ─── Ciclo de vida ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.purchaseRequisitionService
      .obtenerTiemposEficiencia()
      .subscribe((datos: SolicitudEficiencia[]) => {
        this._listaSolicitudes = datos;
        this.maxTotal = Math.max(...datos.map(d => this.totalHoras(d)), 1);
        this.departamentos = [...new Set(datos.map(d => d.Proceso ?? d.Departamento ?? ''))].sort();
        this.aplicarFiltros();
        this.cargando = false;
      });
  }
 
  // ─── Filtros y ordenamiento ───────────────────────────────────────────────
  aplicarFiltros(): void {
    let lista = this.filtroDepartamento
      ? this._listaSolicitudes.filter(d =>
          (d.Proceso ?? d.Departamento) === this.filtroDepartamento)
      : [...this._listaSolicitudes];
 
    switch (this.ordenamiento) {
      case 'total_desc': lista.sort((a, b) => this.totalHoras(b) - this.totalHoras(a)); break;
      case 'total_asc':  lista.sort((a, b) => this.totalHoras(a) - this.totalHoras(b)); break;
      case 'req':        lista.sort((a, b) => a.ID_Documento - b.ID_Documento);         break;
    }
 
    this.listadoFiltrado = lista;
  }
 
  // ─── KPIs ─────────────────────────────────────────────────────────────────
  /** Promedio de horas totales sobre el listado filtrado actual. */
  get promedioTotal(): string {
    const lista = this.listadoFiltrado;
    if (!lista.length) return '0';
    const suma = lista.reduce((acc, r) => acc + this.totalHoras(r), 0);
    return (suma / lista.length).toFixed(1);
  }
 
  /** Cantidad de solicitudes que superan las 48 h. */
  get solicitudesCriticas(): number {
    return this.listadoFiltrado.filter(r => this.totalHoras(r) > 48).length;
  }
 
  /** Solicitud con más horas totales en el listado filtrado. */
  get solicitudMasLenta(): SolicitudEficiencia | null {
    if (!this.listadoFiltrado.length) return null;
    return this.listadoFiltrado.reduce((a, b) =>
      this.totalHoras(b) > this.totalHoras(a) ? b : a
    );
  }
 
  /**
   * Fase que más acumula tiempo en el dataset completo.
   * Cuenta cuántas solicitudes tienen esa fase como la más larga.
   */
  get cuelloPrincipal(): string {
    if (!this._listaSolicitudes.length) return '—';
 
    const conteo: Record<string, number> = {};
 
    for (const req of this._listaSolicitudes) {
      const valores = this.fases.map(f => ({ nombre: f.nombre, horas: (req[f.campo] as number) ?? 0 }));
      const peor    = valores.reduce((a, b) => b.horas > a.horas ? b : a);
      conteo[peor.nombre] = (conteo[peor.nombre] ?? 0) + 1;
    }
 
    return Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  }
 
  // ─── Helpers de la barra Gantt ────────────────────────────────────────────
  /** Horas totales de una solicitud sumando todas las fases. */
  totalHoras(req: SolicitudEficiencia | null): number {
    if (!req) return 0;
    return this.fases.reduce((acc, f) => acc + ((req[f.campo] as number) ?? 0), 0);
  }
 
  /**
   * Porcentaje de ancho que ocupa un segmento dentro de la barra,
   * escalado contra el máximo del dataset completo para poder comparar filas.
   */
  porcentajeSeg(req: SolicitudEficiencia, campo: keyof SolicitudEficiencia): number {
  return Math.round((this.horasFase(req, campo) / this.maxTotal) * 100 * 10) / 10;
}

  horasFase(req: SolicitudEficiencia, campo: keyof SolicitudEficiencia): number {
  return Number(req[campo] ?? 0);
}

 
  /** Texto del tooltip al pasar el mouse por la barra completa. */
  tooltipGantt(req: SolicitudEficiencia): string {
    return this.fases
      .map(f => `${f.nombre}: ${(req[f.campo] as number) ?? 0} h`)
      .join(' | ') + ` | Total: ${this.totalHoras(req)} h`;
  }
 
  // ─── Semáforo ─────────────────────────────────────────────────────────────
  badgeClass(horas: number): string {
    if (horas > 48) return 'badge-red';
    if (horas > 24) return 'badge-yellow';
    return 'badge-green';
  }
 
  badgeTexto(horas: number): string {
    if (horas > 48) return 'Crítico';
    if (horas > 24) return 'Lento';
    return 'Normal';
  }
 
  // ─── Exportación ─────────────────────────────────────────────────────────
  exportarAExcel(): void {
    const filas = this.listadoFiltrado.map(req => ({
      'No. Requisición':      req.ID_Documento,
      'Departamento':         req.Proceso ?? req.Departamento ?? '—',
      'Solicitante':          req.Solicitante ?? 'Sin Nombre',
      'Horas Revisión Jefe':  req.HORAS_REVISION_JEFE     ?? 0,
      'Horas Revisión Uso':   req.Horas_Para_Revision     ?? 0,
      'Horas Autorización':   req.Horas_Para_Autorizacion ?? 0,
      'Horas Aprobación Final': req.Horas_Para_Aprobacion ?? 0,
      'Total Horas':          this.totalHoras(req),
      'Estado':               this.badgeTexto(this.totalHoras(req)),
    }));
 
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb: XLSX.WorkBook = { Sheets: { Gantt: ws }, SheetNames: ['Gantt'] };
    XLSX.writeFile(wb, 'Gantt_Tiempos_Compras.xlsx');
  }



  rowClass(horas: number): string {
  if (horas > 48) return 'row-critico';
  if (horas > 24) return 'row-lento';
  return 'row-normal';
}
 
/**
 * Convierte "Ritchie Funes" → "RF" | "Suyapa Fiallos" → "SF"
 * Evita que el avatar muestre solo la primera letra.
 */
getInitials(nombre: string | undefined): string {
  if (!nombre) return 'SN';
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p.charAt(0).toUpperCase())
    .join('');
}


}