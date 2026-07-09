import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import * as XLSX from 'xlsx';
 
import { PurchaseRequisitionService } from '../../purchase-requisition.service';
import {
  EficienciaHelperService,
  SolicitudEficiencia,
} from './eficiencia-helper.service';
 
@Component({
  selector: 'app-dashboard-tiempos',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './dashboard-tiempos.component.html',
  styleUrls: ['./dashboard-tiempos.component.scss'],
})
export class DashboardTiemposComponent implements OnInit {
 
  // ─── Estado de la vista ───────────────────────────────────────────────────
  public chartOptions: any       = null;
  public cargando                = true;
  public listaSolicitudes: SolicitudEficiencia[] = [];
  public readonly isBrowser: boolean;
 
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
        this.listaSolicitudes = datos;
        this.inicializarGrafico(datos);
      });
  }
 
  // ─── Inicialización del gráfico ───────────────────────────────────────────
  /**
   * Delega todo el cálculo al servicio y solo asigna el resultado.
   * El componente no sabe nada del algoritmo de promedios.
   */
  private inicializarGrafico(datos: SolicitudEficiencia[]): void {
    const result       = this.eficienciaHelper.buildChartData(datos);
    this.chartOptions  = this.eficienciaHelper.buildChartOptions(result);
    this.cargando      = false;
  }
 
  // ─── KPIs (getters computados, sin estado extra) ──────────────────────────
  /** Promedio global de horas totales por solicitud. */
  get promedioTotalHoras(): string {
    const lista = this.listaSolicitudes;
    if (!lista.length) return '0';
    const suma = lista.reduce((acc, r) => acc + (r.Tiempo_Total_Horas ?? 0), 0);
    return (suma / lista.length).toFixed(1);
  }
 
  /** Solicitudes que superan las 48 h (cuello de botella crítico). */
  get solicitudesCriticas(): number {
    return this.listaSolicitudes.filter(r => (r.Tiempo_Total_Horas ?? 0) > 48).length;
  }
 
  /** Departamento con mayor promedio total de horas. */
  get departamentoMasLento(): string {
    if (!this.listaSolicitudes.length) return '—';
 
    const totalesPorDepto = new Map<string, { suma: number; cant: number }>();
 
    for (const r of this.listaSolicitudes) {
      const depto = r.Proceso ?? r.Departamento ?? 'Sin departamento';
      const entry = totalesPorDepto.get(depto) ?? { suma: 0, cant: 0 };
      entry.suma += r.Tiempo_Total_Horas ?? 0;
      entry.cant++;
      totalesPorDepto.set(depto, entry);
    }
 
    let maxPromedio = 0;
    let deptoMax    = '—';
 
    for (const [depto, { suma, cant }] of totalesPorDepto) {
      const prom = suma / cant;
      if (prom > maxPromedio) { maxPromedio = prom; deptoMax = depto; }
    }
 
    return deptoMax;
  }
 
  // ─── Color semafórico ─────────────────────────────────────────────────────
  /** Devuelve la clase CSS según el umbral de horas. */
  colorBadge(horas: number): string {
    if (horas > 24) return 'badge-danger';
    if (horas > 8)  return 'badge-warning';
    return 'badge-ok';
  }
 
  // ─── Exportación ─────────────────────────────────────────────────────────
  exportarAExcel(): void {
    const filas    = this.eficienciaHelper.buildExcelData(this.listaSolicitudes);
    const ws       = XLSX.utils.json_to_sheet(filas);
    const wb: XLSX.WorkBook = {
      Sheets: { Tiempos: ws },
      SheetNames: ['Tiempos'],
    };
    XLSX.writeFile(wb, 'Reporte_Eficiencia_Compras.xlsx');
  }
}