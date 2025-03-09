import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

export function initializeCalendar(el, options) {
    return new Calendar(el, {
        plugins: [dayGridPlugin],
        ...options
    });
}