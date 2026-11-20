import { Injectable } from '@nestjs/common';

@Injectable()
export class IntegrationsService {
  health() {
    return {
      status: 'ok',
      integrations: [],
      message: 'Integrations stub (Telegram, banks, etc. Phase 2)',
    };
  }
}
