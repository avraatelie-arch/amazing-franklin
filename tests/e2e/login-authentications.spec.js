// ============================================================================
// SUITE DE VERIFICAÇÃO DE LOGIN E AUTENTICAÇÕES (Playwright)
// Caminho: tests/e2e/login-authentications.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Amazing Franklin - Login & Authentications E2E Test Suite', () => {

  const tenantTatiURL = 'http://taticardoso.localhost:3000';

  test.beforeEach(async ({ page }) => {
    // Clear state before each test to ensure fresh sessions
    await page.goto(tenantTatiURL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('1. Patient Login Flow (Correct credentials, 2FA, session verification, logout)', async ({ page }) => {
    // Navigate and switch to Patient role
    await page.goto(tenantTatiURL);
    await page.click('#btn-role-paciente');

    // Fill credentials
    await page.fill('#login-email', 'ana.silva@exemplo.com');
    await page.fill('#login-password', 'senha123');

    // Click submit to go to 2FA screen
    await page.click('#view-login button[type="submit"]');
    await expect(page.locator('#view-2fa')).toBeVisible();

    // Verify WhatsApp description is displayed for patient
    await expect(page.locator('#lbl-2fa-desc')).toContainText('WhatsApp');

    // Enter 2FA code (default 123456 is pre-filled, but let's be explicit)
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Verify session login
    await expect(page.locator('#app-container')).toBeVisible();
    await expect(page.locator('#menu-paciente')).toBeVisible();
    await expect(page.locator('#user-profile-name')).toHaveText('Ana Paula Silva');

    // Perform logout
    await page.click('a.nav-item[onclick="handleLogout()"]');

    // Verify user is back at login screen
    await expect(page.locator('#view-login')).toBeVisible();
    await expect(page.locator('#app-container')).toBeHidden();
  });

  test('2. Nutritionist Login Flow (Correct credentials, 2FA, session verification, logout)', async ({ page }) => {
    await page.goto(tenantTatiURL);
    await page.click('#btn-role-nutri');

    // Verify clinical access placeholder pre-filled or explicit
    await page.fill('#login-email', 'tati@cardoso.com');
    await page.fill('#login-password', 'senhaSegura123');

    // Submit to 2FA
    await page.click('#view-login button[type="submit"]');
    await expect(page.locator('#view-2fa')).toBeVisible();

    // Verify token description is displayed for nutritionist
    await expect(page.locator('#lbl-2fa-desc')).toContainText('Token de Segurança');

    // Enter 2FA code
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Verify nutritionist cockpit session
    await expect(page.locator('#app-container')).toBeVisible();
    await expect(page.locator('#menu-nutricionista')).toBeVisible();
    await expect(page.locator('#user-profile-name')).toHaveText('Dra. Tati Cardoso');

    // Perform logout
    await page.click('a.nav-item[onclick="handleLogout()"]');
    await expect(page.locator('#view-login')).toBeVisible();
  });

  test('3. Supplier Login Flows (Active access, and blocked pending/rejected warnings)', async ({ page }) => {
    // Prepare test accounts for pending/rejected suppliers in window context
    await page.goto(tenantTatiURL);
    await page.evaluate(() => {
      const accounts = typeof supplierAccounts !== 'undefined' ? supplierAccounts : (window.supplierAccounts || null);
      if (accounts) {
        accounts.push({
          name: "Farmácia Pendente Ltda",
          email: "pendente@supplier.com",
          password: "123",
          cnpj: "00.000.000/0001-00",
          crf: "CRF-SP 00000",
          phone: "(11) 90000-0000",
          address: { cep: "01311-200", street: "Av. Paulista", number: "1000", city: "São Paulo - SP" },
          status: "pending",
          rating: 5.0,
          reviewsCount: 0
        });
        accounts.push({
          name: "Farmácia Rejeitada Ltda",
          email: "rejeitado@supplier.com",
          password: "123",
          cnpj: "11.111.111/0001-11",
          crf: "CRF-SP 11111",
          phone: "(11) 91111-1111",
          address: { cep: "01311-200", street: "Av. Paulista", number: "1000", city: "São Paulo - SP" },
          status: "rejected",
          rating: 4.0,
          reviewsCount: 0
        });
      }
    });

    // --- Sub-scenario 3.1: Active Supplier Access ---
    await page.click('#btn-role-supplier');
    await page.fill('#login-email', 'farmacia@parceira.com');
    await page.fill('#login-password', '123');

    // Submit to 2FA
    await page.click('#view-login button[type="submit"]');
    await expect(page.locator('#view-2fa')).toBeVisible();

    // Verify supplier-specific 2FA text
    await expect(page.locator('#lbl-2fa-desc')).toContainText('farmácia credenciada');

    // Submit 2FA code
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Verify Supplier portal view is active
    await expect(page.locator('#app-container')).toBeVisible();
    await expect(page.locator('#menu-fornecedor')).toBeVisible();
    await expect(page.locator('#user-profile-name')).toContainText('Farmácia Parceira');

    // Logout
    await page.click('a.nav-item[onclick="handleLogout()"]');
    await expect(page.locator('#view-login')).toBeVisible();

    // --- Sub-scenario 3.2: Blocked Pending Supplier Warning Dialog ---
    await page.click('#btn-role-supplier');
    await page.fill('#login-email', 'pendente@supplier.com');
    await page.fill('#login-password', '123');

    // Handle warning alert dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Seu credenciamento está pendente de homologação administrativa');
      await dialog.accept();
    });

    // Attempt login submit
    await page.click('#view-login button[type="submit"]');

    // Verify 2FA was NOT opened (still on login card)
    await expect(page.locator('#view-2fa')).toBeHidden();
    await expect(page.locator('#view-login')).toBeVisible();

    // --- Sub-scenario 3.3: Blocked Rejected Supplier Warning Dialog ---
    await page.fill('#login-email', 'rejeitado@supplier.com');
    await page.fill('#login-password', '123');

    // Handle warning alert dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Seu credenciamento foi rejeitado pela administração');
      await dialog.accept();
    });

    // Attempt login submit
    await page.click('#view-login button[type="submit"]');

    // Verify 2FA was NOT opened
    await expect(page.locator('#view-2fa')).toBeHidden();
    await expect(page.locator('#view-login')).toBeVisible();
  });

  test('4. Master Admin Direct Login Flow (Master button, admin@plataforma.com pre-fill, Super Admin cockpit, sidebar)', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // Click "Master" button role selector
    await page.click('#btn-role-admin');

    // Verify Master Admin email was automatically pre-filled
    const emailValue = await page.inputValue('#login-email');
    expect(emailValue).toBe('admin@plataforma.com');

    // Fill password and click submit
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');
    await expect(page.locator('#view-2fa')).toBeVisible();

    // Enter 2FA code
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Verify logged in directly to Super Admin cockpit
    await expect(page.locator('#app-container')).toBeVisible();
    await expect(page.locator('#menu-admin')).toBeVisible();
    await expect(page.locator('#tab-admin-dashboard')).toBeVisible();
    await expect(page.locator('#user-profile-name')).toHaveText('Diretoria Master');

    // Logout
    await page.click('a.nav-item[onclick="handleLogout()"]');
    await expect(page.locator('#view-login')).toBeVisible();
  });

  test('5. Usability and boundary errors (empty inputs, incorrect 2FA validation, back navigation, Remember Me persistence)', async ({ page }) => {
    // 5.1 Empty inputs validation
    await page.goto(tenantTatiURL);
    await page.click('#btn-role-paciente');

    // Clear input fields
    await page.fill('#login-email', '');
    await page.fill('#login-password', '');

    // Assert standard HTML5 validation blocks submit (input validity checks)
    const emailValidity = await page.$eval('#login-email', el => el.validity.valueMissing);
    const passValidity = await page.$eval('#login-password', el => el.validity.valueMissing);
    expect(emailValidity).toBe(true);
    expect(passValidity).toBe(true);

    // Try submit and ensure we remain on login view
    await page.click('#view-login button[type="submit"]');
    await expect(page.locator('#view-2fa')).toBeHidden();

    // 5.2 Incorrect 2FA code / missing input validation
    // Log in normally first to access 2FA
    await page.fill('#login-email', 'ana.silva@exemplo.com');
    await page.fill('#login-password', 'senha123');
    await page.click('#view-login button[type="submit"]');
    await expect(page.locator('#view-2fa')).toBeVisible();

    // Clear one of the 2FA digit fields to trigger valueMissing validation
    await page.fill('#d1', '');
    const d1Validity = await page.$eval('#d1', el => el.validity.valueMissing);
    expect(d1Validity).toBe(true);

    // Verify submitting invalid 2FA blocks entry
    await page.click('#view-2fa button[type="submit"]');
    await expect(page.locator('#app-container')).toBeHidden();

    // 5.3 Back buttons navigation
    // Go back to login view from 2FA (reloading acts as going back/resetting form)
    await page.reload();
    await expect(page.locator('#view-login')).toBeVisible();

    // Click "Esqueci minha senha" to go to recovery view
    await page.click('text=Esqueci minha senha');
    await expect(page.locator('#view-forgot')).toBeVisible();

    // Click "Voltar para o Login" back button link
    await page.click('text=Voltar para o Login');
    await expect(page.locator('#view-login')).toBeVisible();
    await expect(page.locator('#view-forgot')).toBeHidden();

    // 5.4 Session persistence via Remember Me
    await page.click('#btn-role-paciente');
    await page.fill('#login-email', 'ana.silva@exemplo.com');
    await page.fill('#login-password', 'senha123');

    // Check "Manter-me conectado" (Remember Me) checkbox
    await page.check('#login-remember-me');

    // Submit to 2FA and complete authentication
    await page.click('#view-login button[type="submit"]');
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Verify successful login
    await expect(page.locator('#app-container')).toBeVisible();

    // Reload the page simulation (simulates closing/reopening tab or refreshing)
    await page.reload();

    // Verify session remains active without requesting login/2FA screen again
    await expect(page.locator('#app-container')).toBeVisible();
    await expect(page.locator('#view-login')).toBeHidden();

    // Clean up: logout to clear stored session
    await page.click('a.nav-item[onclick="handleLogout()"]');
    await expect(page.locator('#view-login')).toBeVisible();
  });

});
