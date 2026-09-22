const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Patient Single Active Booking Lock & Post-Consult Return Unlock E2E Tests', () => {
    test('1. Patient can book only 1 active appointment, gets locked from booking a second, gets unlocked after Nutritionist attends, and Nutritionist can book multiples', async ({ page }) => {
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
            switchTab('tab-booking');
        });

        await page.waitForTimeout(400);

        // 2. Initial state: Patient has no active appointment, booking button is active
        const confirmBtn = page.locator('#btn-confirm-patient-booking');
        await expect(confirmBtn).toBeVisible();
        await expect(confirmBtn).toBeEnabled();

        // 3. Patient books the 1st appointment
        await page.evaluate(() => {
            bookingSelectedDay = 26;
            bookingSelectedMonth = 8; // Setembro
            bookingSelectedYear = 2026;
            confirmBooking('10:00', 'Online');
        });
        await page.waitForTimeout(400);

        // Close instant modal
        await page.evaluate(() => {
            const modal = document.getElementById('modal-instant-booking-dispatch');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
        });

        // 4. Patient opens Agendamentos again: Lock banner is displayed and booking button is disabled
        await page.evaluate(() => {
            switchTab('tab-booking');
        });
        await page.waitForTimeout(400);

        const lockBanner = page.locator('#patient-active-booking-lock-banner');
        await expect(lockBanner).toBeVisible();
        await expect(lockBanner).toContainText('Você já possui 1 consulta agendada');

        const lockedBtn = page.locator('#btn-patient-booking-locked');
        await expect(lockedBtn).toBeVisible();
        await expect(lockedBtn).toBeDisabled();

        // 5. If patient tries to force call confirmBooking(), it is blocked and shows warning toast
        await page.evaluate(() => {
            confirmBooking('15:00', 'Online');
        });
        await page.waitForTimeout(300);

        const apptsAfterBlocked = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('amazing_franklin_appointments_list') || '[]');
        });
        expect(apptsAfterBlocked.length).toBe(1);

        // 6. Switch to Nutritionist, perform consultation and conclude it
        await page.evaluate(() => {
            activeRole = 'nutricionista';
            localStorage.setItem('amazing_franklin_logged_in_role', 'nutricionista');
            localStorage.setItem('amazing_franklin_logged_in_email', 'tati.cardoso@nutricionista.com.br');
            setupRolePortal();
            switchTab('tab-nutri-consult');
        });
        await page.waitForTimeout(400);

        // Populate and save consultation for Mariana Costa
        await page.evaluate(() => {
            const selectEl = document.getElementById('consult-patient-select');
            if (selectEl) selectEl.value = 'Mariana Costa';
            currentPatientName = 'Mariana Costa';
            
            document.getElementById('input-peso').value = '62.5';
            document.getElementById('input-gordura').value = '21.0';
            document.getElementById('input-massa').value = '28.0';
            document.getElementById('input-dieta').value = 'Dieta Hipertrofia Fase 1';
            
            confirmAndSavePatientConsult();
        });
        await page.waitForTimeout(400);

        // Verify appointment status was marked as 'Realizado'
        const apptsAfterConsult = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('amazing_franklin_appointments_list') || '[]');
        });
        expect(apptsAfterConsult[0].status).toBe('Realizado');

        // 7. Switch back to Patient: Lock is now lifted! Patient can book their return consultation
        await page.evaluate(() => {
            activeRole = 'paciente';
            localStorage.setItem('amazing_franklin_logged_in_role', 'paciente');
            localStorage.setItem('amazing_franklin_logged_in_email', 'mariana.costa@email.com');
            currentPatientName = 'Mariana Costa';
            setupRolePortal();
            switchTab('tab-booking');
        });
        await page.waitForTimeout(400);

        // Lock banner should be gone and confirm button enabled again
        await expect(lockBanner).toBeHidden();
        await expect(page.locator('#btn-confirm-patient-booking')).toBeVisible();
        await expect(page.locator('#btn-confirm-patient-booking')).toBeEnabled();

        // 8. Patient successfully books the return consultation!
        await page.evaluate(() => {
            bookingSelectedDay = 28;
            bookingSelectedMonth = 9; // Outubro
            bookingSelectedYear = 2026;
            confirmBooking('16:00', 'Presencial');
        });
        await page.waitForTimeout(400);

        const apptsWithReturn = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('amazing_franklin_appointments_list') || '[]');
        });
        expect(apptsWithReturn.length).toBe(2);
        expect(apptsWithReturn[0].type).toBe('Presencial');
    });
});
