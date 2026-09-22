const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Multichannel Booking Confirmations, Home Card Visibility & Anti-No-Show Loop E2E Tests', () => {
    test('1. Booked appointment displays on Patient Home, triggers bidirectional chat messages, and syncs confirmation via Deep Link / WhatsApp / E-mail', async ({ page }) => {
        const fileUrl = 'file://' + path.resolve(__dirname, '../../index.html');
        await page.goto(fileUrl);

        // 1. Setup baseline with 1 Nutritionist (Dra. Tati) and 1 Patient (Mariana Costa)
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('amazing_franklin_state_version', '2026_08_25_ZEROED_FRESH_V2');
            localStorage.setItem('amazing_franklin_fresh_mode', 'true');

            const nutri = {
                name: "Dra. Tati Cardoso",
                email: "tati.cardoso@nutricionista.com.br",
                phone: "(11) 98765-4321",
                crn: "CRN-3 48291/SP",
                specialty: "Nutrição Clínica & Funcional",
                password: "123"
            };

            const patient = {
                name: "Mariana Costa",
                email: "mariana.costa@email.com",
                phone: "11988880000",
                cpf: "12345678900",
                status: "Ativo (Consultório)",
                objective: "Hipertrofia",
                createdAt: "20 de Setembro de 2026",
                lastConsult: "-",
                nutriEmail: "tati.cardoso@nutricionista.com.br",
                password: "123",
                history: []
            };

            localStorage.setItem('amazing_franklin_all_nutris', JSON.stringify([nutri]));
            localStorage.setItem('amazing_franklin_nutri_profile', JSON.stringify(nutri));
            localStorage.setItem('amazing_franklin_patients_list', JSON.stringify([patient]));
            localStorage.setItem('amazing_franklin_appointments_list', JSON.stringify([]));
            localStorage.setItem('amazing_franklin_patient_chats', JSON.stringify({}));
            localStorage.setItem('amazing_franklin_logged_in_role', 'paciente');
            localStorage.setItem('amazing_franklin_logged_in_email', 'mariana.costa@email.com');
            localStorage.setItem('amazing_franklin_patient_name', 'Mariana Costa');

            activeRole = 'paciente';
            currentPatientName = 'Mariana Costa';
            document.getElementById('auth-wrapper').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            setupRolePortal();
            switchTab('tab-home');
        });

        await page.waitForTimeout(400);

        // 2. Initial state on Home: Sem agendamento
        const kpiNextDate = page.locator('#kpi-val-next-date');
        await expect(kpiNextDate).toHaveText('Sem agendamento');

        // 3. Patient navigates to Agendamentos (tab-booking)
        await page.evaluate(() => {
            switchTab('tab-booking');
        });
        await page.waitForTimeout(400);

        // 4. Select a day & time slot, and confirm booking
        await page.evaluate(() => {
            bookingSelectedDay = 25;
            bookingSelectedMonth = 8; // Setembro (0-indexed)
            bookingSelectedYear = 2026;
            confirmBooking('14:30', 'Online');
        });
        await page.waitForTimeout(400);

        // Verify instant modal dispatch is visible
        const instantModal = page.locator('#modal-instant-booking-dispatch');
        await expect(instantModal).toBeVisible();
        await expect(instantModal).toContainText('Consulta Agendada com Sucesso');

        // Close instant modal
        await page.evaluate(() => {
            const modal = document.getElementById('modal-instant-booking-dispatch');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
        });

        // 5. Navigate back to Home tab and verify consultation is displayed on Patient Home
        await page.evaluate(() => {
            switchTab('tab-home');
        });
        await page.waitForTimeout(400);

        const nextConsultCard = page.locator('#patient-telemed-card');
        await expect(nextConsultCard).toBeVisible();
        await expect(kpiNextDate).toContainText('25 de Setembro');
        await expect(page.locator('#kpi-val-next-time')).toContainText('14:30');
        await expect(page.locator('#kpi-val-next-time')).toContainText('Confirmar Presença');

        // 6. Verify automated bidirectional chat messages
        const chats = await page.evaluate(() => {
            const key = getChatStorageKey('tati.cardoso@nutricionista.com.br', 'mariana.costa@email.com');
            const stored = JSON.parse(localStorage.getItem('amazing_franklin_patient_chats') || '{}');
            return stored[key] || [];
        });

        expect(chats.length).toBeGreaterThanOrEqual(2);
        expect(chats[0].text).toContain('Novo Agendamento Realizado');
        expect(chats[1].text).toContain('Agendamento Confirmado');

        // 7. Extract the appointment ID
        const apptList = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('amazing_franklin_appointments_list') || '[]');
        });
        expect(apptList.length).toBe(1);
        const apptId = apptList[0].id;
        expect(apptList[0].presenceConfirmed).toBe(false);

        // 8. Simulate Multichannel Deep Link return confirmation (e.g. from WhatsApp/E-mail link click)
        await page.evaluate((id) => {
            window.location.hash = `#confirm-appt=${id}`;
            handleAppointmentDeepLinkConfirmation();
        }, apptId);
        await page.waitForTimeout(400);

        // 9. Verify appointment is now confirmed by patient
        const updatedApptList = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('amazing_franklin_appointments_list') || '[]');
        });
        expect(updatedApptList[0].presenceConfirmed).toBe(true);
        expect(updatedApptList[0].status).toBe('Confirmado pelo Paciente');

        // 10. Verify green presence badge is rendered on Home
        await page.evaluate(() => {
            loadPatientDashboard();
        });
        await page.waitForTimeout(300);

        const confirmedBadge = page.locator('.badge-presence-confirmed');
        await expect(confirmedBadge).toBeVisible();
        await expect(confirmedBadge).toContainText('Confirmada');

        // 11. Switch to Nutritionist Portal and verify schedule shows confirmed appointment
        await page.evaluate(() => {
            activeRole = 'nutricionista';
            localStorage.setItem('amazing_franklin_logged_in_role', 'nutricionista');
            localStorage.setItem('amazing_franklin_logged_in_email', 'tati.cardoso@nutricionista.com.br');
            setupRolePortal();
            switchTab('tab-nutri-schedule');
        });
        await page.waitForTimeout(400);

        // Verify nutritionist chat received presence confirmation notification
        const nutriChats = await page.evaluate(() => {
            const key = getChatStorageKey('tati.cardoso@nutricionista.com.br', 'mariana.costa@email.com');
            const stored = JSON.parse(localStorage.getItem('amazing_franklin_patient_chats') || '{}');
            return stored[key] || [];
        });
        const confirmMsg = nutriChats.find(m => m.text && m.text.includes('Presença Confirmada'));
        expect(confirmMsg).toBeDefined();
    });
});
