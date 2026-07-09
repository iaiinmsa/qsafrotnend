import { Injectable } from '@angular/core';
 
/**
 * Interfaz que representa cada solicitud/requerimiento devuelto por la API.
 */
export interface SolicitudEficiencia {
  ID_Documento: number;
  Proceso: string;
  Departamento?: string;
  Solicitante?: string;
  HORAS_REVISION_JEFE?: number;
  Horas_Para_Revision?: number;
  Horas_Para_Autorizacion?: number;
  Horas_Para_Aprobacion?: number;
  Tiempo_Total_Horas?: number;
}
 
/**
 * Estructura interna para acumular sumas por departamento en una sola pasada.
 */
interface AcumuladoDepto {
  sumaJefe: number;
  sumaRevision: number;
  sumaAutorizacion: number;
  sumaAprobacion: number;
  cantidad: number;
}
 
/**
 * Resultado del procesamiento: opciones listas para ApexCharts.
 */
export interface ChartResult {
  series: { name: string; data: number[] }[];
  departamentos: string[];
}
 
/**
 * Fila lista para exportar a Excel.
 */
export interface FilaExcel {
  'No. Requisición': number;
  'Departamento': string;
  'Solicitante': string;
  'Horas Revisión Jefe': number;
  'Horas Revisión Uso': number;
  'Horas Autorización': number;
  'Horas Aprobación Final': number;
  'Total de Horas': number;
}
 
@Injectable({ providedIn: 'root' })
export class EficienciaHelperService {
 
  /**
   * Procesa el array de solicitudes en UNA SOLA pasada (O(n)) usando un Map,
   * evitando los cuatro filter+reduce anidados anteriores (O(n * d)).
   *
   * @param datos  Array crudo recibido desde la API.
   * @returns      Objeto con series y categorías listo para ApexCharts.
   */
  buildChartData(datos: SolicitudEficiencia[]): ChartResult {
    // 1. Acumular en una sola iteración
    const mapa = new Map<string, AcumuladoDepto>();
 
    for (const d of datos) {
      const depto = d.Proceso ?? d.Departamento ?? 'Sin departamento';
 
      if (!mapa.has(depto)) {
        mapa.set(depto, {
          sumaJefe: 0,
          sumaRevision: 0,
          sumaAutorizacion: 0,
          sumaAprobacion: 0,
          cantidad: 0,
        });
      }
 
      const acc = mapa.get(depto)!;
      acc.sumaJefe         += d.HORAS_REVISION_JEFE     ?? 0;
      acc.sumaRevision     += d.Horas_Para_Revision     ?? 0;
      acc.sumaAutorizacion += d.Horas_Para_Autorizacion ?? 0;
      acc.sumaAprobacion   += d.Horas_Para_Aprobacion   ?? 0;
      acc.cantidad++;
    }
 
    // 2. Convertir el Map a arreglos paralelos para ApexCharts
    const departamentos: string[] = [];
    const dataJefe:         number[] = [];
    const dataRevision:     number[] = [];
    const dataAutorizacion: number[] = [];
    const dataAprobacion:   number[] = [];
 
    for (const [depto, acc] of mapa) {
      const n = acc.cantidad || 1; // Evitar división por cero
      departamentos.push(depto);
      dataJefe.push(         this.redondear(acc.sumaJefe         / n));
      dataRevision.push(     this.redondear(acc.sumaRevision     / n));
      dataAutorizacion.push( this.redondear(acc.sumaAutorizacion / n));
      dataAprobacion.push(   this.redondear(acc.sumaAprobacion   / n));
    }
 
    return {
      departamentos,
      series: [
        { name: '1. Revisión Jefe',             data: dataJefe },
        { name: '2. Revisión Uso',              data: dataRevision },
        { name: '3. Autorización (Compras)',    data: dataAutorizacion },
        { name: '4. Aprobación Final',          data: dataAprobacion },
      ],
    };
  }
 
  /**
   * Construye las opciones completas de ApexCharts a partir del resultado
   * del procesamiento. Separado de buildChartData para poder testearlo solo.
   */
  buildChartOptions(result: ChartResult): any {
    return {
      series: result.series,
      chart: {
        type: 'bar',
        height: 400,
        stacked: true,
        toolbar: { show: true },
        animations: {
          enabled: true,
          speed: 600,
          easing: 'easeinout',
        },
      },
      colors: ['#008FFB', '#00E396', '#FF4560', '#FEB019'],
      plotOptions: {
        bar: { horizontal: false, borderRadius: 3 },
      },
      xaxis: {
        categories: result.departamentos,
        title: { text: 'Departamentos' },
      },
      yaxis: {
        title: { text: 'Horas Promedio' },
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: { formatter: (val: number) => `${val} h` },
      },
      legend: { position: 'top' },
      fill: { opacity: 1 },
    };
  }
 
  /**
   * Mapea el array de solicitudes a filas planas listas para XLSX.
   * Centralizar aquí evita duplicar la lógica si se exporta desde otro lugar.
   */
  buildExcelData(datos: SolicitudEficiencia[]): FilaExcel[] {
    return datos.map(req => ({
      'No. Requisición':      req.ID_Documento,
      'Departamento':         req.Proceso ?? req.Departamento ?? 'Sin departamento',
      'Solicitante':          req.Solicitante ?? 'Sin Nombre',
      'Horas Revisión Jefe':  req.HORAS_REVISION_JEFE     ?? 0,
      'Horas Revisión Uso':   req.Horas_Para_Revision     ?? 0,
      'Horas Autorización':   req.Horas_Para_Autorizacion ?? 0,
      'Horas Aprobación Final': req.Horas_Para_Aprobacion ?? 0,
      'Total de Horas':       req.Tiempo_Total_Horas      ?? 0,
    }));
  }
 
  /** Redondea a 1 decimal (evita flotantes como 2.3000000004) */
  private redondear(n: number): number {
    return Math.round(n * 10) / 10;
  }
}