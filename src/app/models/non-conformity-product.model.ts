export interface NonConformityProduct {
    nonConformingProductId: number; // Clave primaria o identificador principal
    productionOrderId: string; // Clave primaria o identificador principal
    idproject: string;
    manufacturingDate: string; // o Date
    createdBy: string;
    creationDate: string; // o Date
    idProduct: number;
    departmentId: number;
    intendedRecipient: string;
    rejectedQuantity: number;
    planningComment: string;
    idCauseNonConformity: number;
    iddisposition: number;
    doComment: string;
    dispositionCost: number;
    estimatedClosingDate: string; // o Date
    doObservation: string;
    approvedProject: boolean;
    approvedProjectUser: string;
    approvedFinancialManagement: boolean;
    approvedFinancialManagementUser: string;
    approvedGeneralManagement: boolean;
    approvedGeneralManagementUser: string;
    realClosingDate: string; // o Date
    checkObservation: string;
    idNonConformityAttachmentId: number;
  
    // Campos adicionales que podrías necesitar de relaciones (ej. nombre del producto)
    productName?: string;
    causeNonConformityName?: string;
    dispositionName?: string;
  }
  
  // Podrías tener un modelo para el detalle si es diferente o más extenso
  export interface NonConformityProductDetail extends NonConformityProduct {
    // Campos adicionales específicos para la vista de detalle
    attachments?: any[]; // Ejemplo
  }