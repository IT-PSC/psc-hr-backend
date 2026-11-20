import { RecruitmentService } from './recruitment.service';
export declare class RecruitmentController {
    private readonly recruitment;
    constructor(recruitment: RecruitmentService);
    list(): {
        items: never[];
        status: string;
        message: string;
    };
}
