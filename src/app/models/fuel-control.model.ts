export interface TypeCar {
    id: number;
    description: string;
}

export interface Car {
    id: number;
    name: string;
    typeCar: TypeCar;
    // se pueden agregar las otras propiedades si se necesitan
}

export interface TransportOperator {
    id: number;
    name: string;
    codeopen: number;
}


