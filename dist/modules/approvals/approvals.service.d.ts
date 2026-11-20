export interface ApprovalItem {
    id: string;
    type: string;
    status: 'pending' | 'approved' | 'rejected' | 'returned';
    requesterId?: string;
    summary?: string;
    note?: string;
    createdAt: string;
}
export declare class ApprovalsService {
    private readonly items;
    list(): {
        items: ApprovalItem[];
    };
    submit(input: {
        type: string;
        requesterId?: string;
        summary?: string;
    }): ApprovalItem;
    private decide;
    approve(id: string, note?: string): ApprovalItem;
    reject(id: string, note?: string): ApprovalItem;
    returnForEdit(id: string, note?: string): ApprovalItem;
}
