/**
 * Represents the structure of the nested 'department' object within a manager's details.
 */

  /**
   * Represents the structure of a single manager object as returned by the API.
   */
  export interface ManagerInfo {
    id: number;
    name: string;
    useremail: string;
    lastname: string;
    active: boolean;
    departmentId: number;
    photo: string;
    gerenteTitular: boolean;

  }
  
  /**
   * Represents the overall response from the API endpoint, which is an array of manager objects.
   */
  export type DepartmentManagerResponse = ManagerInfo[];