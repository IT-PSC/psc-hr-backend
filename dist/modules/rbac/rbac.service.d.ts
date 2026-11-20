import type { AppRole } from '../../common/roles/types';
export declare class RbacService {
    listRoles(): {
        role: AppRole;
        permissionCount: number;
    }[];
    permissionsForRole(role: string): import("../../common/roles/types").Permission[];
    matrix(): Record<AppRole, import("../../common/roles/types").Permission[]>;
}
