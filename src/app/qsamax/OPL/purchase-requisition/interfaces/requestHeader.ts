import { requestDetail } from "./requestDetail";

export interface requestHeader {
  numero: number;
  estadoId: number;
  estado: string;
  usuario: string;
  fecha: string;
  comentario: string;
  detalles: requestDetail[];
}