"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHNOM_PENH_TZ = void 0;
exports.nowPhnomPenh = nowPhnomPenh;
exports.todayYmdPhnomPenh = todayYmdPhnomPenh;
exports.formatTimePhnomPenh = formatTimePhnomPenh;
const TZ = 'Asia/Phnom_Penh';
exports.PHNOM_PENH_TZ = TZ;
function nowPhnomPenh() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}
function todayYmdPhnomPenh(d = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(d);
}
function formatTimePhnomPenh(d = new Date()) {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(d);
}
//# sourceMappingURL=phnom-penh.js.map