export interface AttendanceRecord {
    employeeId: string;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    timezone: 'Asia/Phnom_Penh';
}
export declare class TimeService {
    private readonly store;
    private todayKey;
    private nowIsoPhnomPenh;
    today(employeeId: string): AttendanceRecord;
    checkIn(employeeId: string): AttendanceRecord;
    checkOut(employeeId: string): AttendanceRecord;
}
