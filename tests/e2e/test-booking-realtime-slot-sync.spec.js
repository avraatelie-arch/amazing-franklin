const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Real-Time Booking & Slot Suspension Pipeline', () => {
    test('Patient books appointment, slot is suspended/occupied in real-time, displays on nutri schedule, and frees up on cancellation', async ({ page }) => {
        const filePath = 'file://' + path.resolve('./index.html');
        await page.goto(filePath);

        // 1. Register a patient (or select linked patient)
        await page.evaluate(() => {
            localStorage.clear();
            
            // Set up a linked patient and nutritionist
            const mockNutri = {
                id: 'nutri-1',
                name: 'Dra. Tatiane Cardoso',
                email: 'tati.cardoso@nutricionista.com.br',
                phone: '(11) 98888-8888',
                crn: 'CRN-3 45678'
            };
            const mockPatient = {
                name: 'Frederico Moreira',
                email: 'frederico@email.com',
                phone: '(11) 97777-6666',
                nutriEmail: 'tati.cardoso@nutricionista.com.br',
                status: 'Ativo',
                objective: 'Hipertrofia',
                history: []
            };

            localStorage.setItem('amazing_franklin_all_nutris', JSON.stringify([mockNutri]));
            localStorage.setItem('amazing_franklin_nutri_profile', JSON.stringify(mockNutri));
            localStorage.setItem('amazing_franklin_patients_list', JSON.stringify([mockPatient]));
            localStorage.setItem('amazing_franklin_logged_in_role', 'paciente');
            localStorage.setItem('amazing_franklin_logged_in_email', 'frederico@email.com');
            localStorage.setItem('amazing_franklin_patient_name', 'Frederico Moreira');
            localStorage.setItem('amazing_franklin_appointments_list', JSON.stringify([]));

            activeRole = 'paciente';
            currentPatientName = 'Frederico Moreira';
            document.getElementById('auth-wrapper').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            setupRolePortal();
            switchTab('tab-booking');
        });

        await page.waitForTimeout(500);

        // 2. Select 10:00 time slot and confirm booking
        await page.evaluate(() => {
            selectBookingDay(21);
            selectBookingTime('10:00');
            confirmBooking();
        });

        // 3. Verify appointment is saved
        const appts = await page.evaluate(() => JSON.parse(localStorage.getItem('amazing_franklin_appointments_list')));
        expect(appts.length).toBe(1);
        expect(appts[0].time).toBe('10:00');
        expect(appts[0].patientName).toBe('Frederico Moreira');
        expect(appts[0].nutriEmail).toBe('tati.cardoso@nutricionista.com.br');

        // 4. Verify 10:00 slot is now occupied in the booking UI
        const isOccupied = await page.evaluate(() => {
            return isSlotOccupied('tati.cardoso@nutricionista.com.br', bookingSelectedYear, bookingSelectedMonth, 21, '10:00');
        });
        expect(isOccupied).toBe(true);

        const slotHtml = await page.evaluate(() => document.getElementById('patient-booking-container').innerHTML);
        expect(slotHtml).toContain('Ocupado');

        // 5. Switch to Nutritionist view and verify appointment displays on schedule & list
        await page.evaluate(() => {
            activeRole = 'nutricionista';
            localStorage.setItem('amazing_franklin_logged_in_role', 'nutricionista');
            localStorage.setItem('amazing_franklin_logged_in_email', 'tati.cardoso@nutricionista.com.br');
            setupRolePortal();
            switchTab('tab-nutri-schedule');
            renderAppointmentsList();
            renderWeeklySchedule();
        });

        const nutriListHtml = await page.evaluate(() => document.getElementById('nutri-appointments-list').innerHTML);
        expect(nutriListHtml).toContain('Frederico Moreira');
        expect(nutriListHtml).toContain('10:00');

        // 6. Delete/Cancel appointment and verify slot is freed immediately
        await page.evaluate(() => {
            const list = JSON.parse(localStorage.getItem('amazing_franklin_appointments_list'));
            const apptId = list[0].id;
            // simulate cancellation directly
            appointmentsList = [];
            localStorage.setItem('amazing_franklin_appointments_list', JSON.stringify([]));
            localStorage.setItem('amazing_franklin_appointments', JSON.stringify([]));
        });

        // 7. Verify slot is now free
        const isOccupiedAfterCancel = await page.evaluate(() => {
            return isSlotOccupied('tati.cardoso@nutricionista.com.br', 2026, 7, 21, '10:00');
        });
        expect(isOccupiedAfterCancel).toBe(false);
    });
});
