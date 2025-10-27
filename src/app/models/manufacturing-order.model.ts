export interface ManufacturingOrderDetail {
  idmanufacturingOrderDetail: number;
  manufacturingOrderId: number;
  filePath: string;
  uploadBy: string;
  fileName: string;
  description?: string;
}

export interface ManufacturingOrder {
  idManufacturingOrder: number;
  productionOrder: string;
  assignedTo: string;
  requestedBy: string;
  createDate: string;
  customerCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  projectScope: string;
  location: string;
  metalWeight: number;
  unitofMeasure: string;
  grandTotal: number;
  currency: string;
  paymentFactor: number;
  payTerm: string;
  deliveryTime: string;
  productionOrderLabel: string;
  ProductionOrderId: number;
  observation: string;
  createAt: string;
  createBy: string;
  details: ManufacturingOrderDetail[];
}
