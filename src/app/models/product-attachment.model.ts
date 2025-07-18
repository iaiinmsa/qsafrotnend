export interface ProductAttachment {
    ProductAttachmentsid: number;
    nonConformingProductId: number;
    nonConformityAttachmentId: number;
    nonConformingProduct: {
      nonConformingProductId: number;
      productionOrderId: string | null;
    };
    nonConformityAttachment: {
      nonConformityAttachmentId: number;
      fileName: string | null;
    };
  }
  