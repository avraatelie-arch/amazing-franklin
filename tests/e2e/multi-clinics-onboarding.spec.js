// ============================================================================
// SUITE DE TESTES E2E - CADASTRO MULTICLÍNICAS, ATIVAÇÃO E ISOLAMENTO (Playwright)
// Caminho: tests/e2e/multi-clinics-onboarding.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Amazing Franklin - Multi-Clinics Onboarding & Tenant Isolation E2E Tests', () => {

  const localURL = 'http://localhost:3000';

  test('1. Clinician Sign-up, Settings Update and Audit Log Verification', async ({ page }) => {
    await page.goto(localURL);

    // Switch to Nutricionista login role
    await page.click('#btn-role-nutri');

    // Click "Credenciar Consultório" to open registration form
    await page.click('text=Quero Credenciar meu Consultório');
    await expect(page.locator('#view-nutri-registration')).toBeVisible();

    // Fill registration form
    await page.fill('#nutri-reg-name', 'Roberta Santos');
    await page.fill('#nutri-reg-crn', 'CRN-3 99999');
    await page.fill('#nutri-reg-email', 'roberta.santos@nutri.com');
    await page.fill('#nutri-reg-password', 'senhaSegura123');
    await page.fill('#nutri-reg-password-confirm', 'senhaSegura123');
    await page.fill('#nutri-reg-phone', '11999999999');
    await page.fill('#nutri-reg-cep', '01311-200');
    await page.fill('#nutri-reg-city', 'São Paulo');
    await page.selectOption('#nutri-reg-state', 'SP');

    // Listen to window.alert
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Cadastro realizado com sucesso');
      await dialog.accept();
    });

    // Submit registration
    await page.click('#view-nutri-registration button[type="submit"]');

    // Verify redirected back to login
    await expect(page.locator('#view-login')).toBeVisible();

    // Login with the new nutritionist account
    await page.fill('#login-email', 'roberta.santos@nutri.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Verify main app dashboard is visible
    await expect(page.locator('#app-container')).toBeVisible();

    // Verify sidebar displays clinician name
    const sidebarBadge = page.locator('#sidebar-role-badge');
    await expect(sidebarBadge).toHaveText(/DRA. ROBERTA SANTOS/);

    // Open profile editor (Meu Cadastro)
    await page.locator('#menu-nutricionista >> text=Meu Cadastro').click();
    await expect(page.locator('#nutri-profile-modal')).toBeVisible();

    // Verify fields are populated
    await expect(page.locator('#nutri-profile-name')).toHaveValue('Dra. Roberta Santos');
    await expect(page.locator('#nutri-profile-crn')).toHaveValue('CRN-3 99999');

    // Edit settings fields
    await page.fill('#nutri-profile-phone', '(11) 97777-7777');
    await page.fill('#nutri-profile-crn', 'CRN-3 88888');

    // Save profile changes
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Cadastro de Nutricionista atualizado com sucesso');
      await dialog.accept();
    });
    await page.click('#nutri-profile-modal button[type="submit"]');
    await expect(page.locator('#nutri-profile-modal')).not.toHaveClass(/active/);

    // Reopen and check if updated values are persisted in modal
    await page.locator('#menu-nutricionista >> text=Meu Cadastro').click();
    await expect(page.locator('#nutri-profile-phone')).toHaveValue('(11) 97777-7777');
    await expect(page.locator('#nutri-profile-crn')).toHaveValue('CRN-3 88888');
    await page.click('#nutri-profile-modal .btn-close-modal');

    // Log out
    await page.click('#user-profile-avatar');
    await page.click('text=Sair');
    await expect(page.locator('#auth-wrapper')).toBeVisible();

    // Log in as administrator to verify audit logs
    await page.click('#btn-role-admin');
    await page.fill('#login-email', 'admin@plataforma.com');
    await page.fill('#login-password', 'admin123');
    await page.click('#view-login button[type="submit"]');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Verify audit activity logs table contains nutritionist signup event
    const logsTable = page.locator('#admin-activities-list-body');
    await expect(logsTable).toContainText(/Nutricionista Dra. Roberta Santos credenciou seu consultório/);
  });

  test('2. Clinician Registers Patient, Patient First Access Activation & Login', async ({ page }) => {
    await page.goto(localURL);

    // Seed Roberta Santos so we don't depend on Test 1 execution state
    await page.evaluate(() => {
      const nutris = JSON.parse(localStorage.getItem('amazing_franklin_all_nutris') || '[]');
      if (!nutris.some(n => n.email === 'roberta.santos@nutri.com')) {
        nutris.push({
          name: "Dra. Roberta Santos",
          email: "roberta.santos@nutri.com",
          password: "senhaSegura123",
          crn: "CRN-3 99999",
          phone: "11999999999",
          specialty: "Nutrição Clínica",
          address: { cep: "01311-200", city: "São Paulo", state: "SP" },
          status: "trial",
          trialDays: 15
        });
        localStorage.setItem('amazing_franklin_all_nutris', JSON.stringify(nutris));
      }
    });
    await page.reload();

    // Switch to Nutricionista login role
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'roberta.santos@nutri.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Register a new patient
    await page.click('button:has-text("Novo Paciente")');
    await page.fill('#reg-patient-name', 'Lucas Oliveira');
    await page.fill('#reg-patient-email', 'lucas.oliveira@exemplo.com');
    await page.fill('#reg-patient-phone', '11988888888');
    await page.fill('#reg-patient-cep', '01311-200');
    // Wait CEP autofill
    await page.waitForTimeout(1000);
    await page.click('#register-patient-modal button[type="submit"]');

    // Dismiss onboarding success modal if shown
    const onboardingModal = page.locator('#patient-onboarding-success-modal');
    await page.waitForTimeout(500);
    if (await onboardingModal.isVisible()) {
      await page.locator('#patient-onboarding-success-modal button:has-text("Concluir")').click();
      await expect(onboardingModal).toBeHidden();
    }

    // Confirm patient is on the list
    await expect(page.locator('#tab-nutri-patients .patient-table')).toContainText('Lucas Oliveira');

    // Log out
    await page.click('a.nav-item[onclick="handleLogout()"]');
    await expect(page.locator('#view-login')).toBeVisible();

    // Click "Primeiro Acesso? Ativar minha Conta"
    await page.click('text=Primeiro Acesso? Ativar minha Conta');
    await expect(page.locator('#view-patient-activation')).toBeVisible();

    // Step 1: Activation email
    await page.fill('#pat-act-email', 'lucas.oliveira@exemplo.com');
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Código de ativação enviado');
      await dialog.accept();
    });
    await page.click('#pat-act-step1 button[type="submit"]');

    // Step 2: Verification code
    await expect(page.locator('#pat-act-step2')).toBeVisible();
    await page.fill('#pat-act-sms-code', '123456');
    await page.click('#pat-act-step2 button[type="submit"]');

    // Step 3: Password definition and CPF
    await expect(page.locator('#pat-act-step3')).toBeVisible();
    await page.fill('#pat-act-cpf', '12345678901');
    await page.fill('#pat-act-password', 'senhaLucas123');
    await page.fill('#pat-act-password-confirm', 'senhaLucas123');
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Conta ativada com sucesso');
      await dialog.accept();
    });
    await page.click('#pat-act-step3 button[type="submit"]');

    // Attempt login with newly activated patient account
    await page.click('#btn-role-paciente');
    await page.fill('#login-email', 'lucas.oliveira@exemplo.com');
    await page.fill('#login-password', 'senhaLucas123');
    await page.click('#view-login button[type="submit"]');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Verify main app dashboard is visible for the new patient
    await expect(page.locator('#app-container')).toBeVisible();
    const sidebarBadge = page.locator('#sidebar-role-badge');
    await expect(sidebarBadge).toHaveText(/ÁREA DO PACIENTE/);
  });

  test('3. Multi-tenant Data Isolation Between Clinicians', async ({ page }) => {
    await page.goto(localURL);

    // Seed Roberta Santos and her patient Lucas Oliveira so this test is fully self-contained
    await page.evaluate(() => {
      const nutris = JSON.parse(localStorage.getItem('amazing_franklin_all_nutris') || '[]');
      if (!nutris.some(n => n.email === 'roberta.santos@nutri.com')) {
        nutris.push({
          name: "Dra. Roberta Santos",
          email: "roberta.santos@nutri.com",
          password: "senhaSegura123",
          crn: "CRN-3 99999",
          phone: "11999999999",
          specialty: "Nutrição Clínica",
          address: { cep: "01311-200", city: "São Paulo", state: "SP" },
          status: "trial",
          trialDays: 15
        });
        localStorage.setItem('amazing_franklin_all_nutris', JSON.stringify(nutris));
      }

      const patients = JSON.parse(localStorage.getItem('amazing_franklin_patients_list') || '[]');
      if (!patients.some(p => p.email === 'lucas.oliveira@exemplo.com')) {
        patients.push({
          id: 'pat-lucas-123',
          name: "Lucas Oliveira",
          email: "lucas.oliveira@exemplo.com",
          password: "senhaLucas123",
          phone: "11988888888",
          status: 'Ativo',
          lastConsult: 'Nenhuma',
          objective: 'Prevenção e Bem-estar',
          address: { cep: "01311-200", city: "São Paulo", state: "SP" },
          nutriEmail: "roberta.santos@nutri.com",
          history: []
        });
        localStorage.setItem('amazing_franklin_patients_list', JSON.stringify(patients));
      }
    });
    await page.reload();

    // 3.1 Login as legacy nutritionist Tati Cardoso
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Tati should see legacy patient Beatriz Albuquerque but NOT Lucas Oliveira (registered under Roberta)
    await expect(page.locator('.patient-table-container .patient-table')).toContainText('Beatriz Albuquerque');
    await expect(page.locator('.patient-table-container .patient-table')).not.toContainText('Lucas Oliveira');

    // Click "Meu Cadastro" to verify settings matches Tati
    await page.locator('#menu-nutricionista >> text=Meu Cadastro').click();
    await expect(page.locator('#nutri-profile-name')).toHaveValue('Dra. Tati Cardoso');
    await page.click('#nutri-profile-modal .btn-close-modal');

    // Log out
    await page.click('#user-profile-avatar');
    await page.click('text=Sair');

    // 3.2 Login as Roberta Santos
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'roberta.santos@nutri.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Roberta should see Lucas Oliveira but NOT Beatriz Albuquerque
    await expect(page.locator('.patient-table-container .patient-table')).toContainText('Lucas Oliveira');
    await expect(page.locator('.patient-table-container .patient-table')).not.toContainText('Beatriz Albuquerque');

    // Verify consultation dropdown options also isolate patients
    await page.click('text=Novo Atendimento');
    const selectOptions = await page.locator('#consult-patient-select option').allInnerTexts();
    expect(selectOptions).toContain('Lucas Oliveira');
    expect(selectOptions).not.toContain('Beatriz Albuquerque');
  });

});
