import { Injectable } from '@nestjs/common';

@Injectable()
export class OnboardingService {
  list() {
    return { items: [], status: 'ok', message: 'Onboarding list stub' };
  }
}
