export declare class DepartmentDto {
    id: string;
    code: string;
    name: string;
    nameKm?: string | null;
}
export declare class PositionDto {
    id: string;
    code: string;
    name: string;
    nameKm?: string | null;
    departmentId?: string | null;
}
