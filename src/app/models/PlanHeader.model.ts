
export interface PlanDetail {
  idplanDetail: number;
  plan_header_id: number;
  file_path: string;
  plan_type: PlanType;
  uploaded_by: string;
  file_name: string;
  upload_at: string; // o Date si luego lo parseas
  plan_review: string;
}


export interface PlanHeader {
  idPlan: number;
  user_name: string;
  production_order: string;
  project_name: string;
  created_at: string; // o Date si lo parseas
  plan_details: PlanDetail[];
}


export interface PlanType {
  idplanttype: number;
  nomenclature: string;
  name: string;
  descripcion: string;
}