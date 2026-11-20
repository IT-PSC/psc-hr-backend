import type { JwtPayload } from '../../common/roles/types';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    me(user: JwtPayload): Promise<{
        id: string;
        email: string;
        employeeId: string | null;
        roles: import("../../common/roles/types").AppRole[];
        firstName: string | null;
        lastName: string | null;
        active: boolean;
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        employeeId: string | null;
        roles: import("../../common/roles/types").AppRole[];
        firstName: string | null;
        lastName: string | null;
        active: boolean;
    }[]>;
}
