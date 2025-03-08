export function initializeCalendar(calendarEl, onEventClick, onDateClick) {
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: '/api/orders',
        eventDataTransform: function(eventData) {
            return {
                title: eventData.customerName,
                start: eventData.deliveryDate,
                id: eventData.id
            };
        },
        eventClick: onEventClick,
        dateClick: onDateClick
    });
    return calendar;
}