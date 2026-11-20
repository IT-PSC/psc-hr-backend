import type { JwtPayload } from '../../common/roles/types';
import { DecisionDto } from './dto/approval.dto';
import { ApprovalsService } from './approvals.service';
export declare class ApprovalsController {
    private readonly approvals;
    constructor(approvals: ApprovalsService);
    list(): {
        items: import("./approvals.service").ApprovalItem[];
    };
    submit(user: JwtPayload, body: {
        type: string;
        summary?: string;
    }): import("./approvals.service").ApprovalItem;
    approve(id: string, dto: DecisionDto): import("./approvals.service").ApprovalItem;
    reject(id: string, dto: DecisionDto): import("./approvals.service").ApprovalItem;
    returnForEdit(id: string, dto: DecisionDto): import("./approvals.service").ApprovalItem;
}
