import { BadRequestException, Injectable } from '@nestjs/common';

/**
 * In-memory attendance stub (Phase 1).
 * Keyed by employeeId + local date in Asia/Phnom_Penh.
 * Replace with Prisma Attendance model in a later phase.
 */
export interface AttendanceRecord {
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  timezone: 'Asia/Phnom_Penh';
}

@Injectable()
export class TimeService {
  private readonly store = new Map<string, AttendanceRecord>();

  private todayKey(employeeId: string): { key: string; date: string } {
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Phnom_Penh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    return { key: `${employeeId}:${date}`, date };
  }

  private nowIsoPhnomPenh(): string {
    return new Date().toISOString();
  }

  today(employeeId: string): AttendanceRecord {
    const { key, date } = this.todayKey(employeeId);
    const existing = this.store.get(key);
    if (existing) return existing;
    return {
      employeeId,
      date,
      checkIn: null,
      checkOut: null,
      timezone: 'Asia/Phnom_Penh',
    };
  }

  checkIn(employeeId: string): AttendanceRecord {
    const { key, date } = this.todayKey(employeeId);
    const existing = this.store.get(key);
    if (existing?.checkIn) {
      throw new BadRequestException('Already checked in today');
    }
    const record: AttendanceRecord = {
      employeeId,
      date,
      checkIn: this.nowIsoPhnomPenh(),
      checkOut: null,
      timezone: 'Asia/Phnom_Penh',
    };
    this.store.set(key, record);
    return record;
  }

  checkOut(employeeId: string): AttendanceRecord {
    const { key, date } = this.todayKey(employeeId);
    const existing = this.store.get(key);
    if (!existing?.checkIn) {
      throw new BadRequestException('Must check in before check out');
    }
    if (existing.checkOut) {
      throw new BadRequestException('Already checked out today');
    }
    const record: AttendanceRecord = {
      ...existing,
      date,
      checkOut: this.nowIsoPhnomPenh(),
    };
    this.store.set(key, record);
    return record;
  }
}
