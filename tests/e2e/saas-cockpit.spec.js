// ============================================================================
// SUITE DE VERIFICAÇÃO DO PAINEL DO DONO SAAS (Playwright)
// Caminho: tests/e2e/saas-cockpit.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Amazing Franklin - SaaS Owner Cockpit E2E Tests', () => {

  const localPortalURL = 'http://localhost:3000';

  async function loginAs(page, email) {
    if (!page.url().includes('localhost')) {
      await page.goto(localPortalURL);
    }
    const isLoginVisible = await page.locator('#view-login').isVisible();
    if (!isLoginVisible) {
      await page.goto(localPortalURL);
      await expect(page.locator('#view-login')).toBeVisible();
    }

    // Click Nutricionista access role button
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', email);
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // Enter 2FA code
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();
  }

  test('1. Verify Admin Cockpit Consolidated Metrics, SVGs and Audit Logs', async ({ page }) => {
    // Log in as SaaS Owner (Tati Cardoso)
    await loginAs(page, 'tati.cardoso@nutricionista.com.br');

    // Click profile wrapper to open dropdown menu
    await page.locator('.user-profile').click();

    // Verify "Painel do Dono (SaaS)" button is visible
    const adminBtn = page.locator('#profile-menu-admin-btn');
    await expect(adminBtn).toBeVisible();

    // Click admin panel button
    await adminBtn.click();

    // Check if admin dashboard tab is active and visible
    await expect(page.locator('#tab-admin-dashboard')).toBeVisible();

    // Verify consolidated metrics elements
    await expect(page.locator('#admin-sub-revenue')).toContainText('R$');
    await expect(page.locator('#admin-sales-volume')).toContainText('R$');
    await expect(page.locator('#admin-comm-revenue')).toContainText('R$');
    
    // Verify directory counts
    await expect(page.locator('#admin-total-nutris')).not.toBeEmpty();
    await expect(page.locator('#admin-total-suppliers')).not.toBeEmpty();

    // Verify interactive SVGs elements are rendered using exact stroke attribute values
    await expect(page.locator('circle[stroke="var(--primary-olive)"]').first()).toBeVisible(); // Patients circle
    await expect(page.locator('circle[stroke="var(--bronze-gold)"]').first()).toBeVisible(); // Nutris circle
    
    // Verify activity logs table is rendered
    await expect(page.locator('#admin-activities-list-body tr')).not.toHaveCount(0);
  });

  test('2. Modify SaaS Parameters & Commission Rate and Check Checkout Logic', async ({ page }) => {
    await loginAs(page, 'tati.cardoso@nutricionista.com.br');
    await page.locator('.user-profile').click();
    await page.locator('#profile-menu-admin-btn').click();

    // Edit parameter inputs
    await page.fill('#admin-setting-saas-price', '249.90');
    await page.fill('#admin-setting-saas-trial-days', '30');
    
    // Update range input slider value and dispatch events via evaluate to ensure reliability
    await page.evaluate(() => {
        const slider = document.getElementById('admin-setting-commission-rate');
        if (slider) {
            slider.value = 15;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
            slider.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    // Verify dynamic text indicator updates
    await expect(page.locator('#commission-rate-val')).toHaveText('15%');

    // Handle Alert dialog automatically
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('comerciais salvos');
      await dialog.accept();
    });
    
    // Click submit button for parameter forms
    await page.click('button:has-text("Salvar Parâmetros Comerciais")');

    // Verify localStorage updates
    const savedCommRate = await page.evaluate(() => localStorage.getItem('amazing_franklin_commission_rate'));
    expect(savedCommRate).toBe('15');
  });

  test('3. Nutritionist Directory Licensing Suspension and Lock Screen Overlay', async ({ page }) => {
    // 1. Log in as SaaS Owner to suspend Marina
    await loginAs(page, 'tati.cardoso@nutricionista.com.br');
    await page.locator('.user-profile').click();
    await page.locator('#profile-menu-admin-btn').click();

    // Verify Marina is in the list
    await expect(page.locator('td:has-text("marina@nutri.com")')).toBeVisible();

    // Setup handler for active update confirmation dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('atualizada');
      await dialog.accept();
    });
    
    // Click "Suspender" button next to Marina's row
    const marinaRow = page.locator('tr:has-text("marina@nutri.com")');
    await marinaRow.locator('button:has-text("Suspender")').click();

    // Log out
    await page.click('a.nav-item[onclick="handleLogout()"]');
    await expect(page.locator('#view-login')).toBeVisible();

    // 2. Log in as suspended Marina
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'marina@nutri.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Expect lock screen overlay is visible
    const lockOverlay = page.locator('#saas-suspended-overlay');
    await expect(lockOverlay).toBeVisible();
    await expect(lockOverlay.locator('p')).toContainText('suspensa temporariamente');

    // Click "Voltar para o Login" to log out
    await lockOverlay.locator('a:has-text("Voltar para o Login")').click();
    await expect(page.locator('#view-login')).toBeVisible();

    // 3. Log back as Owner to reactivate Marina
    await loginAs(page, 'tati.cardoso@nutricionista.com.br');
    await page.locator('.user-profile').click();
    await page.locator('#profile-menu-admin-btn').click();

    // Setup reactivate alert confirm handler
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    // Click "Ativar Acesso" next to Marina's row
    const reactivateRow = page.locator('tr:has-text("marina@nutri.com")');
    await reactivateRow.locator('button:has-text("Ativar Acesso")').click();
  });

  test('4. Bulk Email Campaigns Sending & Audit Logs History Tracking', async ({ page }) => {
    await loginAs(page, 'tati.cardoso@nutricionista.com.br');
    await page.locator('.user-profile').click();
    await page.locator('#profile-menu-admin-btn').click();

    // Fill in Bulk Campaign Form
    await page.selectOption('#admin-campaign-target', 'nutricionistas');
    await page.fill('#admin-campaign-subject', 'E2E Testing Campaign Subject');
    await page.fill('#admin-campaign-body', 'E2E testing body contents to check if campaigns are recorded in platform manuals history log.');

    // Handle campaign sent alert dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Disparo Concluído');
      await dialog.accept();
    });
    await page.click('button:has-text("Disparar E-mails em Massa")');

    // Verify campaign is listed in the history table
    await expect(page.locator('#admin-campaigns-history-body tr:has-text("E2E Testing Campaign Subject")')).toBeVisible();
  });

  test('5. Direct Super Admin Login via Master Role Selector and SaaS Health Metrics', async ({ page }) => {
    await page.goto(localPortalURL);

    // Click "Master" (Admin) role button
    await page.click('#btn-role-admin');
    await page.fill('#login-email', 'admin@plataforma.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // Enter 2FA code
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Verify it loads directly into the admin dashboard tab and sidebar is configured
    await expect(page.locator('#app-container')).toBeVisible();
    await expect(page.locator('#menu-admin')).toBeVisible();
    await expect(page.locator('#tab-admin-dashboard')).toBeVisible();

    // Verify the new SaaS growth metrics are rendered
    await expect(page.locator('#mrr-val')).toContainText('R$');
    await expect(page.locator('#arr-val')).toContainText('R$');
    await expect(page.locator('#ltv-val')).toContainText('R$');
    await expect(page.locator('#admin-tickets-backlog')).toContainText('chamado');
  });

});
