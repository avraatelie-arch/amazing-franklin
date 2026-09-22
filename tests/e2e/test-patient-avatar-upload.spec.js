const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Patient Avatar Upload & Autonomous Visual Identity E2E Tests', () => {
    test('1. Patient can upload avatar in profile modal, which reflects in sidebar, nutritionist table, clinical profile, and chat', async ({ page }) => {
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
                photo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
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
                avatar: "",
                address: {
                    cep: "01310-100",
                    street: "Av. Paulista",
                    number: "1000",
                    complement: "Apto 101",
                    neighborhood: "Bela Vista",
                    city: "São Paulo",
                    state: "SP"
                },
                history: []
            };

            localStorage.setItem('amazing_franklin_all_nutris', JSON.stringify([nutri]));
            localStorage.setItem('amazing_franklin_nutri_profile', JSON.stringify(nutri));
            localStorage.setItem('amazing_franklin_patients_list', JSON.stringify([patient]));
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

        // 2. Initial state: patient avatar in sidebar header is initials "MC"
        const profileAvatar = page.locator('#user-profile-avatar');
        await expect(profileAvatar).toBeVisible();
        await expect(profileAvatar).toHaveText('MC');

        // 3. Open patient profile / registration edit modal
        await page.evaluate(() => {
            openPatientProfileRegistrationModal();
        });
        await page.waitForTimeout(300);

        const modal = page.locator('#patient-profile-registration-modal');
        await expect(modal).toHaveClass(/active/);

        // 4. Simulate patient avatar upload with Base64 data URL
        const testAvatarBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSFUAAAhgAQBV9p2KAAAAAElFTkSuQmCC";

        await page.evaluate((b64) => {
            tempPatientAvatarData = b64;
            const preview = document.getElementById('pat-reg-avatar-preview-box');
            if (preview) {
                preview.innerHTML = `<img src="${b64}" alt="Foto Paciente" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            }
        }, testAvatarBase64);

        // Verify preview box displays image
        await expect(page.locator('#pat-reg-avatar-preview-box img')).toBeVisible();

        // 5. Submit form and save
        await page.evaluate(() => {
            document.getElementById('pat-reg-name').value = 'Mariana Costa';
            document.getElementById('pat-reg-cpf').value = '123.456.789-00';
            document.getElementById('pat-reg-phone').value = '(11) 98888-0000';
            document.getElementById('pat-reg-cep').value = '01310-100';
            document.getElementById('pat-reg-street').value = 'Av. Paulista';
            document.getElementById('pat-reg-number').value = '1000';
            document.getElementById('pat-reg-neighborhood').value = 'Bela Vista';
            document.getElementById('pat-reg-city').value = 'São Paulo';
            document.getElementById('pat-reg-state').value = 'SP';
            savePatientProfileRegistration();
        });
        await page.waitForTimeout(300);

        // 6. Verify modal is closed and sidebar avatar now shows <img>
        await expect(modal).not.toHaveClass(/active/);
        await expect(page.locator('#user-profile-avatar img')).toBeVisible();
        const avatarSrc = await page.locator('#user-profile-avatar img').getAttribute('src');
        expect(avatarSrc).toBe(testAvatarBase64);

        // 7. Verify localStorage persistence
        const storedAvatar = await page.evaluate(() => localStorage.getItem('amazing_franklin_patient_avatar'));
        expect(storedAvatar).toBe(testAvatarBase64);

        // 8. Switch to Nutritionist Portal
        await page.evaluate(() => {
            activeRole = 'nutricionista';
            localStorage.setItem('amazing_franklin_logged_in_role', 'nutricionista');
            localStorage.setItem('amazing_franklin_logged_in_email', 'tati.cardoso@nutricionista.com.br');
            setupRolePortal();
            switchTab('tab-nutri-patients');
        });
        await page.waitForTimeout(400);

        // 9. Verify Patient table renders Mariana's avatar image
        const tableAvatarImg = page.locator('.patient-table-avatar-img');
        await expect(tableAvatarImg).toBeVisible();
        const tableImgSrc = await tableAvatarImg.getAttribute('src');
        expect(tableImgSrc).toBe(testAvatarBase64);

        // 10. Open Mariana's clinical record and verify avatar is displayed
        await page.evaluate(() => {
            openPatientProfileModal('Mariana Costa');
        });
        await page.waitForTimeout(300);

        const recordAvatar = page.locator('#profile-patient-avatar img');
        await expect(recordAvatar).toBeVisible();
        expect(await recordAvatar.getAttribute('src')).toBe(testAvatarBase64);

        // Close clinical record modal
        await page.evaluate(() => {
            closePatientProfileModal();
        });

        // 11. Nutritionist navigates to Chat tab and verifies patient avatar in inbox item and header
        await page.evaluate(() => {
            switchTab('tab-chat');
        });
        await page.waitForTimeout(400);

        const chatSidebarAvatar = page.locator('.nutri-chat-patient-avatar img');
        await expect(chatSidebarAvatar).toBeVisible();
        expect(await chatSidebarAvatar.getAttribute('src')).toBe(testAvatarBase64);

        const chatHeaderAvatar = page.locator('.nutri-chat-main-pane .user-avatar img');
        await expect(chatHeaderAvatar).toBeVisible();
        expect(await chatHeaderAvatar.getAttribute('src')).toBe(testAvatarBase64);
    });
});
