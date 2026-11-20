import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  list() {
    return { items: [], status: 'ok', message: 'Notifications list stub' };
  }
}
