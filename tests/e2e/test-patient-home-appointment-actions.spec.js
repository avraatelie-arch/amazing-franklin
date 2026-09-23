const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('EP-18 Story 1: Visualização de Consulta, Ações de Reagendamento e Cancelamento na Home do Paciente', () => {
    const fileUrl = 'file://' + path.resolve(__dirname, '../../index.html');

    test('1. Consulta agendada aparece com destaque na Home do Paciente com botões de Reagendar e Cancelar', async ({ page }) => {
        await page.goto(fileUrl);

        // 1. Setup Patient with an active appointment
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
                specialty: "Nutrição Clínica & Funcional"
            };

            const patient = {
                name: "Carlos Oliveira",
                email: "carlos.oliveira@teste.com",
                phone: "11988880000",
                cpf: "12345678900",
                status: "Novo Paciente",
                objective: "Prevenção & Bem-estar",
                nutriEmail: "tati.cardoso@nutricionista.com.br"
            };

            const appt = {
                id: 'appt-test-home-1',
                patientName: 'Carlos Oliveira',
                patientEmail: 'carlos.oliveira@teste.com',
                nutriEmail: 'tati.cardoso@nutricionista.com.br',
                nutriName: 'Dra. Tati Cardoso',
                date: '28 de Outubro de 2026',
                dateShort: '28/10/2026',
                time: '14:00',
                type: 'Online',
                status: 'Agendado (Pendente Confirmação)',
                presenceConfirmed: false
            };

            localStorage.setItem('amazing_franklin_all_nutris', JSON.stringify([nutri]));
            localStorage.setItem('amazing_franklin_nutri_profile', JSON.stringify(nutri));
            localStorage.setItem('amazing_franklin_patients_list', JSON.stringify([patient]));
            localStorage.setItem('amazing_franklin_appointments_list', JSON.stringify([appt]));
            localStorage.setItem('amazing_franklin_logged_in_role', 'paciente');
            localStorage.setItem('amazing_franklin_logged_in_email', 'carlos.oliveira@teste.com');
            localStorage.setItem('amazing_franklin_patient_name', 'Carlos Oliveira');

            activeRole = 'paciente';
            currentPatientName = 'Carlos Oliveira';
            document.getElementById('auth-wrapper').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            setupRolePortal();
        });

        await page.waitForTimeout(300);

        // 2. Valida que o banner da Home está visível e contém os dados corretos
        const banner = page.locator('#patient-home-next-appointment-banner');
        await expect(banner).toBeVisible();
        await expect(banner).toContainText('Sua Próxima Consulta Agendada');
        await expect(banner).toContainText('28 de Outubro');
        await expect(banner).toContainText('14:00');
        await expect(banner).toContainText('Telemedicina');

        // Valida botões no banner
        await expect(banner.locator('button:has-text("Entrar na Teleconsulta")')).toBeVisible();
        await expect(banner.locator('button:has-text("Reagendar")')).toBeVisible();
        await expect(banner.locator('button:has-text("Cancelar")')).toBeVisible();

        // 3. Valida que o card KPI 4 (#patient-telemed-card) também exibe as ações
        const kpiCard = page.locator('#patient-telemed-card');
        await expect(kpiCard).toBeVisible();
        await expect(kpiCard.locator('#kpi-val-next-date')).toContainText('28 de Outubro');
        await expect(kpiCard.locator('button:has-text("Reagendar")')).toBeVisible();
        await expect(kpiCard.locator('button:has-text("✕")')).toBeVisible();
    });

    test('2. Cancelar consulta na Home remove o banner e libera o agendamento', async ({ page }) => {
        await page.goto(fileUrl);

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
                specialty: "Nutrição Clínica & Funcional"
            };

            const patient = {
                name: "Carlos Oliveira",
                email: "carlos.oliveira@teste.com",
                status: "Novo Paciente",
                objective: "Prevenção & Bem-estar",
                nutriEmail: "tati.cardoso@nutricionista.com.br"
            };

            const appt = {
                id: 'appt-to-cancel-1',
                patientName: 'Carlos Oliveira',
                patientEmail: 'carlos.oliveira@teste.com',
                nutriEmail: 'tati.cardoso@nutricionista.com.br',
                nutriName: 'Dra. Tati Cardoso',
                date: '28 de Outubro de 2026',
                time: '15:00',
                type: 'Online',
                status: 'Agendado'
            };

            localStorage.setItem('amazing_franklin_all_nutris', JSON.stringify([nutri]));
            localStorage.setItem('amazing_franklin_nutri_profile', JSON.stringify(nutri));
            localStorage.setItem('amazing_franklin_patients_list', JSON.stringify([patient]));
            localStorage.setItem('amazing_franklin_appointments_list', JSON.stringify([appt]));
            localStorage.setItem('amazing_franklin_logged_in_role', 'paciente');
            localStorage.setItem('amazing_franklin_logged_in_email', 'carlos.oliveira@teste.com');
            localStorage.setItem('amazing_franklin_patient_name', 'Carlos Oliveira');

            activeRole = 'paciente';
            currentPatientName = 'Carlos Oliveira';
            document.getElementById('auth-wrapper').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            setupRolePortal();
        });

        await page.waitForTimeout(300);

        // Auto-confirma o dialog de cancelamento
        page.on('dialog', dialog => dialog.accept());

        // Clica no botão de cancelar no banner
        await page.click('#patient-home-next-appointment-banner button:has-text("Cancelar")');

        await page.waitForTimeout(300);

        // Valida que o banner da Home foi ocultado
        const banner = page.locator('#patient-home-next-appointment-banner');
        await expect(banner).toBeHidden();

        // Valida que o KPI 4 mostra "Sem agendamento"
        const kpiNextDate = page.locator('#kpi-val-next-date');
        await expect(kpiNextDate).toHaveText('Sem agendamento');
    });
});
