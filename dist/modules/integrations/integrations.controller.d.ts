import { IntegrationsService } from './integrations.service';
export declare class IntegrationsController {
    private readonly integrations;
    constructor(integrations: IntegrationsService);
    health(): {
        status: string;
        integrations: never[];
        message: string;
    };
}
