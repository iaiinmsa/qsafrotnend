export interface AccruedVacationRecord {
  codigo: string;
  nombre: string;
  fecha_ingreso: string;
  fecha_ultimo_aniversario: string;
  fecha_calculo: string;
  antiguedad_anios: number;
  dias_pendientes: number;
  dias_proporcionales: number;
  dias_derecho_anual: number;
  dias_por_ley: number;
  dias_por_contratocolectivo: number;
  dias_transcurridos_360: string;
  salario_nominal: number;
  salario_diario: number;
  pasivo_total_vacaciones: number;
  mensaje_actualizacion: string;
}