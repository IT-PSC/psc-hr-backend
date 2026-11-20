import { Injectable } from '@nestjs/common';

@Injectable()
export class RecruitmentService {
  list() {
    return { items: [], status: 'ok', message: 'Recruitment list stub' };
  }
}
