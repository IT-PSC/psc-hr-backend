import { OnboardingService } from './onboarding.service';
export declare class OnboardingController {
    private readonly onboarding;
    constructor(onboarding: OnboardingService);
    list(): {
        items: never[];
        status: string;
        message: string;
    };
}
