import type { JwtPayload } from '../../common/roles/types';
import { TimeService } from './time.service';
export declare class TimeController {
    private readonly time;
    constructor(time: TimeService);
    private employeeId;
    today(user: JwtPayload): import("./time.service").AttendanceRecord;
    checkIn(user: JwtPayload): import("./time.service").AttendanceRecord;
    checkOut(user: JwtPayload): import("./time.service").AttendanceRecord;
}
