/** A minimal iCalendar (RFC 5545) writer for events made on the device. */
export interface CalEvent {
  uid: string;
  start: Date;
  end: Date;
  title: string;
  description: string;
  /** Whole days, for periods such as a retrograde. */
  allDay?: boolean;
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const day = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
/** Lines longer than 75 characters continue on the next line after a space. */
const fold = (line: string) => line.match(/.{1,73}/gu)!.join('\r\n ');

export function toIcs(events: CalEvent[], name: string, now = new Date()): string {
  const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Within//Moon calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(name)}`];
  for (const e of events) {
    out.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${utc(now)}`,
      e.allDay ? `DTSTART;VALUE=DATE:${day(e.start)}` : `DTSTART:${utc(e.start)}`,
      e.allDay ? `DTEND;VALUE=DATE:${day(e.end)}` : `DTEND:${utc(e.end)}`,
      fold(`SUMMARY:${esc(e.title)}`),
      fold(`DESCRIPTION:${esc(e.description)}`),
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  out.push('END:VCALENDAR');
  return out.join('\r\n') + '\r\n';
}

/** Saves the calendar as a file; phones offer to add it to the calendar app. */
export function downloadIcs(ics: string, filename: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
