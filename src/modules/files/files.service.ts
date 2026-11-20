import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  list() {
    return { items: [], status: 'ok', message: 'Files storage stub (Phase 2)' };
  }
}
