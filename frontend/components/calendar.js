export function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    let selectedDate = null;

    if (typeof FullCalendar === 'undefined') {
        console.error('FullCalendar nije učitan. Provjerite datoteke u public/lib folderu.');
        document.getElementById('result').innerHTML = 'Greška: Kalendar nije učitan.';
        return;
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        select: function(info) {
            selectedDate = info.startStr;
            alert('Odabrali ste datum: ' + selectedDate);
        }
    });
    calendar.render();

    return { getSelectedDate: () => selectedDate };
}