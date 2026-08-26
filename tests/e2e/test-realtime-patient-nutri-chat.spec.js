const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Real-Time Bidirectional Patient-Nutritionist Chat Hub', () => {
    test('Patient sends real message to assigned Nutritionist, Nutritionist replies in Multi-Patient Hub, Patient receives real reply', async ({ page }) => {
        const fileUrl = 'file://' + path.resolve(__dirname, '../../index.html');
        await page.goto(fileUrl);

        // 1. Setup fresh baseline with 1 Nutritionist (Dra. Tatiane) and 1 Patient (Alexandre) linked to Dra. Tatiane
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
                name: "Alexandre",
                email: "alexandre@gmail.com",
                phone: "11966550005",
                status: "Ativo (Consultório)",
                objective: "Gestacional",
                createdAt: "26 de Agosto de 2026",
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
            localStorage.setItem('amazing_franklin_logged_in_email', 'alexandre@gmail.com');
            localStorage.setItem('amazing_franklin_patient_name', 'Alexandre');

            activeRole = 'paciente';
            currentPatientName = 'Alexandre';
            document.getElementById('auth-wrapper').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            setupRolePortal();
            switchTab('tab-chat');
        });

        await page.waitForTimeout(500);

        // Verify patient chat header displays assigned nutritionist
        const chatHeader = page.locator('#chat-tab-dynamic-container .chat-header-info h3');
        await expect(chatHeader).toContainText('Dra. Tati Cardoso');

        // Patient types message and sends
        const patientInput = page.locator('#message-input-text');
        await expect(patientInput).toBeVisible();
        await patientInput.fill('Olá Dra. Tati, estou com dúvida sobre a suplementação gestacional');
        await page.locator('#chat-tab-dynamic-container .btn-send').click();

        // Verify patient message appears as sent
        const sentMessage = page.locator('.message.sent');
        await expect(sentMessage).toContainText('Olá Dra. Tati, estou com dúvida sobre a suplementação gestacional');

        // Wait 1.5 seconds to assert NO automatic bot response appears
        await page.waitForTimeout(1500);
        const receivedMessagesBeforeNutriReply = await page.locator('.message.received').count();
        expect(receivedMessagesBeforeNutriReply).toBe(0);

        // 4. Switch to Nutritionist Portal
        await page.evaluate(() => {
            activeRole = 'nutricionista';
            setLoginRole('nutricionista');
            localStorage.setItem('amazing_franklin_logged_in_role', 'nutricionista');
            localStorage.setItem('amazing_franklin_logged_in_email', 'tati.cardoso@nutricionista.com.br');
            document.getElementById('auth-wrapper').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            setupRolePortal();
            switchTab('tab-chat');
        });

        await page.waitForTimeout(500);

        // Verify Nutritionist Chat Hub is displayed with patient Alexandre in the list
        const patientItemInSidebar = page.locator('.nutri-chat-patient-item');
        await expect(patientItemInSidebar).toContainText('Alexandre');

        // Click on Alexandre to open chat thread
        await patientItemInSidebar.first().click();

        // Verify patient message is visible to Nutritionist
        const msgFromPatient = page.locator('.nutri-chat-main-pane .message.received');
        await expect(msgFromPatient).toContainText('Olá Dra. Tati, estou com dúvida sobre a suplementação gestacional');

        // Nutritionist types real reply and sends
        const nutriInput = page.locator('.nutri-chat-main-pane #message-input-text');
        await expect(nutriInput).toBeVisible();
        await nutriInput.fill('Olá Alexandre! Para a fase gestacional, o aporte de folato e ferro deve ser tomado após o almoço.');
        await page.locator('.nutri-chat-main-pane .btn-send').click();

        // Verify reply is rendered in nutritionist pane
        const nutriSentMsg = page.locator('.nutri-chat-main-pane .message.sent');
        await expect(nutriSentMsg).toContainText('Para a fase gestacional, o aporte de folato e ferro deve ser tomado após o almoço.');

        // 5. Switch back to Patient Alexandre portal to verify receipt
        await page.evaluate(() => {
            activeRole = 'paciente';
            setLoginRole('paciente');
            localStorage.setItem('amazing_franklin_logged_in_role', 'paciente');
            localStorage.setItem('amazing_franklin_logged_in_email', 'alexandre@gmail.com');
            localStorage.setItem('amazing_franklin_patient_name', 'Alexandre');
            document.getElementById('auth-wrapper').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            setupRolePortal();
            switchTab('tab-chat');
        });

        await page.waitForTimeout(500);

        // Verify patient sees nutritionist reply
        const receivedReplyByPatient = page.locator('.message.received');
        await expect(receivedReplyByPatient).toContainText('Para a fase gestacional, o aporte de folato e ferro deve ser tomado após o almoço.');
    });
});
