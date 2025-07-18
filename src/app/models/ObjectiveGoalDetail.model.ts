export interface ObjectiveGoalDetail {
    idObjgoal: number;
    idObjective: number;
    currentGoal: string; // O number si es apropiado y lo conviertes
    usercreate: string;
    createdate: string; // O Date si lo conviertes
    month: number;
    years: number;
    
    // El campo 'objective' del JSON original es el padre, no es necesario repetirlo aquí
    // si solo muestras los detalles de la meta específica.
  }