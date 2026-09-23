const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('EP-17 Story 1: Calendário Dinâmico em Tempo Real, Bloqueio de Datas Passadas & Histórico', () => {
    const fileUrl = 'file://' + path.resolve(__dirname, '../../index.html');

    test('1. Agenda da nutricionista deve abrir na semana atual dinâmica e não no passado (Julho)', async ({ page }) => {
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

            localStorage.setItem('amazing_franklin_all_nutris', JSON.stringify([nutri]));
            localStorage.setItem('amazing_franklin_nutri_profile', JSON.stringify(nutri));
            localStorage.setItem('amazing_franklin_logged_in_role', 'nutricionista');
            localStorage.setItem('amazing_franklin_logged_in_email', 'tati.cardoso@nutricionista.com.br');

            activeRole = 'nutricionista';
            document.getElementById('auth-wrapper').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            setupRolePortal();
        });

        await page.waitForTimeout(300);

        // Clica no menu da nutricionista para abrir a Agenda Semanal
        await page.locator('#menu-nutricionista >> text=Agenda Semanal').click();
        await expect(page.locator('#tab-nutri-schedule')).toBeVisible();

        // Verifica que o display da semana contém o ano atual
        const weekDisplayText = await page.locator('#schedule-week-display').innerText();
        const currentYear = new Date().getFullYear();
        expect(weekDisplayText).toContain(String(currentYear));

        // Verifica que existe um cabeçalho de dia marcado como 'today'
        const todayHeader = page.locator('.schedule-day-header.today');
        await expect(todayHeader).toBeVisible();

        // Se houver colunas de dias passados nesta semana, elas devem conter a classe 'past-day' e não ter botão '+ Agendar'
        const pastDays = page.locator('.schedule-day-column.past-day');
        const countPast = await pastDays.count();
        if (countPast > 0) {
            for (let i = 0; i < countPast; i++) {
                const freeSlotBtn = pastDays.nth(i).locator('.free-slot-btn');
                await expect(freeSlotBtn).toHaveCount(0);
            }
        }
    });

    test('2. Calendário do paciente deve bloquear datas passadas e iniciar no mês corrente', async ({ page }) => {
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
                phone: "11988880000",
                cpf: "12345678900",
                status: "Ativo (Consultório)",
                objective: "Hipertrofia",
                nutriEmail: "tati.cardoso@nutricionista.com.br"
            };

            localStorage.setItem('amazing_franklin_all_nutris', JSON.stringify([nutri]));
            localStorage.setItem('amazing_franklin_nutri_profile', JSON.stringify(nutri));
            localStorage.setItem('amazing_franklin_patients_list', JSON.stringify([patient]));
            localStorage.setItem('amazing_franklin_appointments_list', JSON.stringify([]));
            localStorage.setItem('amazing_franklin_logged_in_role', 'paciente');
            localStorage.setItem('amazing_franklin_logged_in_email', 'carlos.oliveira@teste.com');
            localStorage.setItem('amazing_franklin_patient_name', 'Carlos Oliveira');

            activeRole = 'paciente';
            currentPatientName = 'Carlos Oliveira';
            document.getElementById('auth-wrapper').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            setupRolePortal();
            switchTab('tab-booking');
        });

        await page.waitForTimeout(300);
        await expect(page.locator('#tab-booking')).toBeVisible();

        const today = new Date();
        const currentDay = today.getDate();

        // Verifica que dias passados do mês atual estão com a classe disabled / past
        if (currentDay > 1) {
            const pastDayElement = page.locator('.calendar-day.disabled.past').first();
            await expect(pastDayElement).toBeVisible();

            // Tentar selecionar um dia no passado
            await pastDayElement.click({ force: true });
            
            // O dia selecionado ativo deve continuar sendo >= currentDay
            const activeDay = await page.locator('.calendar-day.active').innerText();
            expect(parseInt(activeDay, 10)).toBeGreaterThanOrEqual(currentDay);
        }

        // Selecionar o dia de hoje ou futuro e verificar que funciona
        const validDay = page.locator(`.calendar-day:not(.disabled):has-text("${currentDay}")`).first();
        await validDay.click();
        await expect(validDay).toHaveClass(/active/);
    });

    test('3. Preservação de histórico de consultas anteriores na agenda da nutricionista', async ({ page }) => {
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

            const pastAppt = {
                id: 'appt-past-history-1',
                patientName: 'Ana Paula Santos',
                patientEmail: 'ana.paula@teste.com',
                nutriEmail: 'tati.cardoso@nutricionista.com.br',
                date: '01 de Janeiro de 2026',
                time: '10:00',
                duration: 60,
                type: 'Online',
                status: 'Realizado'
            };

            localStorage.setItem('amazing_franklin_all_nutris', JSON.stringify([nutri]));
            localStorage.setItem('amazing_franklin_nutri_profile', JSON.stringify(nutri));
            localStorage.setItem('amazing_franklin_appointments_list', JSON.stringify([pastAppt]));
            localStorage.setItem('amazing_franklin_appointments', JSON.stringify([pastAppt]));
            localStorage.setItem('amazing_franklin_logged_in_role', 'nutricionista');
            localStorage.setItem('amazing_franklin_logged_in_email', 'tati.cardoso@nutricionista.com.br');

            activeRole = 'nutricionista';
            document.getElementById('auth-wrapper').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            setupRolePortal();
        });

        await page.waitForTimeout(300);

        // A consulta passada permanece no armazenamento e acessível no prontuário/histórico
        const stored = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('amazing_franklin_appointments_list'));
        });
        expect(stored.length).toBe(1);
        expect(stored[0].status).toBe('Realizado');

        // Abrir Agenda Semanal
        await page.locator('#menu-nutricionista >> text=Agenda Semanal').click();
        await expect(page.locator('#tab-nutri-schedule')).toBeVisible();
    });
});
