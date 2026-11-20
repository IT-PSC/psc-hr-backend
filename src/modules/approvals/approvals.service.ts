import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface ApprovalItem {
  id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  requesterId?: string;
  summary?: string;
  note?: string;
  createdAt: string;
}

@Injectable()
export class ApprovalsService {
  private readonly items: ApprovalItem[] = [];

  list() {
    return { items: this.items };
  }

  submit(input: {
    type: string;
    requesterId?: string;
    summary?: string;
  }) {
    const item: ApprovalItem = {
      id: randomUUID(),
      type: input.type,
      status: 'pending',
      requesterId: input.requesterId,
      summary: input.summary,
      createdAt: new Date().toISOString(),
    };
    this.items.unshift(item);
    return item;
  }

  private decide(
    id: string,
    status: ApprovalItem['status'],
    note?: string,
  ) {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new NotFoundException('Approval not found');
    item.status = status;
    item.note = note;
    return item;
  }

  approve(id: string, note?: string) {
    return this.decide(id, 'approved', note);
  }

  reject(id: string, note?: string) {
    return this.decide(id, 'rejected', note);
  }

  returnForEdit(id: string, note?: string) {
    return this.decide(id, 'returned', note);
  }
}
