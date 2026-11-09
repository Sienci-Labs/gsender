export const formatSize = (b: number) =>
    b < 1024
        ? `${b} B`
        : b < 1048576
          ? `${(b / 1024).toFixed(0)} KB`
          : `${(b / 1048576).toFixed(1)} MB`;

export const formatHMS = (s: number) => {
    if (!s) return '—';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

/** Always hh:mm:ss, including 00:00:00. */
export const formatClock = (s: number) => {
    const total = Math.max(0, Math.floor(s || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const sec = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Today" / "Yesterday" / "Oct 3" */
export const formatDay = (ts: number, now = Date.now()) => {
    if (!ts) return '—';
    const day = startOfDay(new Date(ts));
    const today = startOfDay(new Date(now));
    if (day === today) return 'Today';
    if (day === today - 86400000) return 'Yesterday';
    const d = new Date(ts);
    return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

/** "Today 10:42" / "Yesterday 09:05" / "Oct 3 14:20" */
export const formatDayTime = (ts: number | null, now = Date.now()) => {
    if (!ts) return '—';
    const d = new Date(ts);
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${formatDay(ts, now)} ${hm}`;
};
