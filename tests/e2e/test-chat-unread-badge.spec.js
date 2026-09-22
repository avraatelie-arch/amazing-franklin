const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Sidebar Chat Unread Notification Badge (Balãozinho) E2E Tests', () => {
    test('1. Unread badge displays on Nutritionist sidebar when Patient sends a message, clears upon reading, and alerts Patient when Nutritionist replies', async ({ page }) => {
        const fileUrl = 'file://' + path.resolve(__dirname, '../../index.html');
        await page.goto(fileUrl);

        // 1. Setup fresh baseline with 1 Nutritionist (Dra. Tati) and 1 Patient (Mariana)
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

        // 2. Patient menu badge should initially be hidden
        const patientBadge = page.locator('#badge-patient-chat');
        await expect(patientBadge).toBeHidden();

        // 3. Patient navigates to chat and sends a new message
        await page.evaluate(() => {
            switchTab('tab-chat');
        });
        await page.waitForTimeout(300);

        const patientInput = page.locator('#message-input-text');
        await expect(patientInput).toBeVisible();
        await patientInput.fill('Dra. Tati, estou com dúvida sobre o plano pré-treino!');
        await page.locator('#chat-tab-dynamic-container .btn-send').click();

        // Verify sent message in thread
        await expect(page.locator('.message.sent')).toContainText('Dra. Tati, estou com dúvida sobre o plano pré-treino!');

        // 4. Switch to Nutritionist portal (on a different tab, e.g. patient list)
        await page.evaluate(() => {
            activeRole = 'nutricionista';
            localStorage.setItem('amazing_franklin_logged_in_role', 'nutricionista');
            localStorage.setItem('amazing_franklin_logged_in_email', 'tati.cardoso@nutricionista.com.br');
            setupRolePortal();
            switchTab('tab-nutri-patients');
        });
        await page.waitForTimeout(400);

        // 5. Verify the Nutritionist sidebar displays the unread badge with '1'
        const nutriBadge = page.locator('#badge-nutri-chat');
        await expect(nutriBadge).toBeVisible();
        await expect(nutriBadge).toHaveText('1');

        // 6. Nutritionist clicks on "Responder Dúvidas" (tab-chat)
        await page.locator('#menu-nutricionista a[onclick*="tab-chat"]').click();
        await page.waitForTimeout(400);

        // 7. Verify the badge disappears upon viewing the chat
        await expect(nutriBadge).toBeHidden();

        // 8. Nutritionist sends a reply to Mariana
        const nutriInput = page.locator('#message-input-text');
        await expect(nutriInput).toBeVisible();
        await nutriInput.fill('Olá Mariana! No pré-treino você pode consumir aveia com banana e canela.');
        await page.locator('#chat-tab-dynamic-container .btn-send').click();

        await expect(page.locator('.message.sent')).toContainText('No pré-treino você pode consumir aveia com banana');

        // 9. Switch back to Patient portal on Home tab
        await page.evaluate(() => {
            activeRole = 'paciente';
            localStorage.setItem('amazing_franklin_logged_in_role', 'paciente');
            localStorage.setItem('amazing_franklin_logged_in_email', 'mariana.costa@email.com');
            currentPatientName = 'Mariana Costa';
            setupRolePortal();
            switchTab('tab-home');
        });
        await page.waitForTimeout(400);

        // 10. Verify Patient sidebar displays unread badge with '1'
        await expect(patientBadge).toBeVisible();
        await expect(patientBadge).toHaveText('1');

        // 11. Patient clicks "Suporte & Dúvidas" (tab-chat)
        await page.locator('#menu-paciente a[onclick*="tab-chat"]').click();
        await page.waitForTimeout(400);

        // 12. Verify Patient badge is cleared and reply is visible
        await expect(patientBadge).toBeHidden();
        await expect(page.locator('.message.received')).toContainText('No pré-treino você pode consumir aveia com banana');
    });
});
