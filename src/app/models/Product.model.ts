export interface Product {
    productId: number;
    name: string; // O el campo que contenga el nombre/descripción a mostrar
    description?: string; // Si es diferente del nombre
    // Otros campos relevantes del producto si los necesitas
  }

  export interface WorkOrder {
    op: string;
    numero: string;
    descripcion: string;
  }
  

    export interface customer {
    codigo: string;
    fantasyname: string;
    nombre: string;
    rtn: string;
  }