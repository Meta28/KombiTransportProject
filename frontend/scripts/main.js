cat << 'EOF' > frontend/scripts/main.js
import { initCalendar } from '../components/calendar.js';
import { initForm } from '../components/form.js';

const calendarInstance = initCalendar();
const formInstance = initForm();

if (typeof google !== 'undefined' && google.maps && google.maps.places) {
    formInstance.initAutocomplete();
} else {
    console.log('Places API nije dostupan, autocompletiranje onemogućeno.');
}
EOF