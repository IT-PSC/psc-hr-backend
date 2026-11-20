import { RbacService } from './rbac.service';
export declare class RbacController {
    private readonly rbac;
    constructor(rbac: RbacService);
    listRoles(): {
        role: import("../../common/roles/types").AppRole;
        permissionCount: number;
    }[];
    permissions(role: string): import("../../common/roles/types").Permission[];
    matrix(): Record<import("../../common/roles/types").AppRole, import("../../common/roles/types").Permission[]>;
}
