// ============================================================================
// SUITE DE VERIFICAÇÃO DE E-BOOKS E RECEITAS (Playwright)
// Caminho: tests/e2e/ebooks-recipes.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Amazing Franklin - E-books & Recipes Tab E2E Verification Tests', () => {

  const tenantTatiURL = 'http://taticardoso.localhost:3000';

  test('1. Patient navigates to E-books tab, views grids, and downloads material', async ({ page }) => {
    await page.goto(tenantTatiURL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(tenantTatiURL);

    // Login as Patient
    await page.click('#btn-role-paciente');
    await page.fill('#login-email', 'ana.silva@exemplo.com');
    await page.fill('#login-password', '••••••••');
    await page.click('#view-login button[type="submit"]');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // Click "E-books & Receitas" tab in sidebar
    await page.locator('#menu-paciente >> text=E-books & Receitas').click();
    await expect(page.locator('#tab-ebooks')).toBeVisible();

    // Verify presence of Available Grid and Purchased/Free Grid
    await expect(page.locator('#ebooks-available-grid')).toBeVisible();
    await expect(page.locator('#ebooks-purchased-grid')).toBeVisible();

    // Check free items are in the purchased grid (e.g. "Nutrição Sem Complicação", "E-book Detox Corporal", "Bowl Funcional de Quinoa")
    await expect(page.locator('#ebooks-purchased-grid')).toContainText('Nutrição Sem Complicação');
    await expect(page.locator('#ebooks-purchased-grid')).toContainText('E-book Detox Corporal');
    await expect(page.locator('#ebooks-purchased-grid')).toContainText('Bowl Funcional de Quinoa');

    // Check download button is present
    const downloadBtns = page.locator('#ebooks-purchased-grid button');
    await expect(downloadBtns.first()).toContainText('Baixar PDF');
  });

  test('2. Patient purchases an available e-book/protocol and verifies it moves to purchased materials', async ({ page }) => {
    await page.goto(tenantTatiURL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(tenantTatiURL);

    // Login as Patient
    await page.click('#btn-role-paciente');
    await page.fill('#login-email', 'ana.silva@exemplo.com');
    await page.fill('#login-password', '••••••••');
    await page.click('#view-login button[type="submit"]');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // Go to E-books e Receitas
    await page.locator('#menu-paciente >> text=E-books & Receitas').click();
    await expect(page.locator('#tab-ebooks')).toBeVisible();

    // Click "Adquirir Conteúdo" on the first available item
    const buyButton = page.locator('#ebooks-available-grid button:has-text("Adquirir Conteúdo")').first();
    await buyButton.click();

    // Verify checkout modal is displayed
    await expect(page.locator('#checkout-modal')).toBeVisible();

    // Handle alert dialog in Playwright
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Obrigado pela compra!');
      await dialog.accept();
    });

    // Complete checkout
    await page.click('button:has-text("Confirmar e Pagar")');

    // Wait for modal to close (verify it loses active class)
    await expect(page.locator('#checkout-modal')).not.toHaveClass(/active/);

    // Go back to E-books tab
    await page.locator('#menu-paciente >> text=E-books & Receitas').click();

    // The purchased item should now be in #ebooks-purchased-grid
    await expect(page.locator('#ebooks-purchased-grid')).toContainText('Protocolo');
  });

  test('3. Clinician registers a new public product and patient views it in available e-books', async ({ page }) => {
    await page.goto(tenantTatiURL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(tenantTatiURL);

    // 1. Login as Clinician
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

    await expect(page.locator('#app-container')).toBeVisible();

    // Navigate to "Cadastrar Protocolos" (tab-store for nutri)
    await page.locator('#menu-nutricionista >> text=Cadastrar Protocolos').click();
    await expect(page.locator('#tab-store')).toBeVisible();

    // Register a new e-book product
    await page.fill('#new-prod-title', 'Ebook Teste Automatizado E2E');
    await page.fill('#new-prod-price', '49.90');
    await page.selectOption('#new-prod-category', 'ebook');
    await page.check('#new-prod-public');

    // Submit
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Produto cadastrado com sucesso');
      await dialog.accept();
    });
    await page.click('button:has-text("Cadastrar Produto")');

    // Logout
    await page.click('a.nav-item[onclick="handleLogout()"]');

    // 2. Login as Patient
    await page.click('#btn-role-paciente');
    await page.fill('#login-email', 'ana.silva@exemplo.com');
    await page.fill('#login-password', '••••••••');
    await page.click('#view-login button[type="submit"]');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // Go to E-books tab
    await page.locator('#menu-paciente >> text=E-books & Receitas').click();
    await expect(page.locator('#tab-ebooks')).toBeVisible();

    // Verify that the new product is visible in the available grid
    await expect(page.locator('#ebooks-available-grid')).toContainText('Ebook Teste Automatizado E2E');
  });

});
