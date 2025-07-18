// filepath: c:\Users\INMSA ARGO\Proyectos\qsamaxfro\qsamaxfro\qsafrotnend\src\app\authentication\auth.interfaces.ts
export interface RoleDetail {
    id: number;
    name: string;
    description?: string;
}

export interface UserRole {
    id: number;
    // name: string; // Esta propiedad 'name' en UserRole parece redundante si el nombre real está en RoleDetail
    user_id?: number; // Hacer opcional si no siempre viene o no se usa
    role_id?: number; // Hacer opcional si no siempre viene o no se usa
    role: RoleDetail;
}

export interface Department {
    id: number; 
    name: string;
     
    }

export interface User {
    id: number;
    name: string;
    email: string;
    useremail: string;
    lastname: string;
    active: boolean;
    departmentId: number;
    photo: string | null;
    user_roles: UserRole[];
    department: Department;
}



export interface LoginResponse {
    success: boolean;
    user?: User;
    message?: string;
}