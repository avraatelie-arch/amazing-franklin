// ============================================================================
// SUITE DE TESTES E2E DO MARKETPLACE & RASTREAMENTO (Playwright)
// Caminho: tests/e2e/marketplace-tracking.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Portal Multi-Tenant - Marketplace & Tracking E2E Tests', () => {

  const tenantTatiURL = 'http://taticardoso.localhost:3000';

  test('1. Seleção de Perfil e Títulos de Login Dinâmicos', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // Default must be Área do Paciente
    const title = page.locator('#login-view-title');
    await expect(title).toHaveText('Área do Paciente');

    // Click Nutricionista
    await page.click('#btn-role-nutri');
    await expect(title).toHaveText('Área da Nutricionista');

    // Click Fornecedor
    await page.click('#btn-role-supplier');
    await expect(title).toHaveText('Área do Fornecedor');

    // Click Paciente back
    await page.click('#btn-role-paciente');
    await expect(title).toHaveText('Área do Paciente');
  });

  test('2. Compra Pública de Protocolos e Autocadastro de Visitante', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // Navigate to public marketplace
    await page.click('text=Explorar Marketplace de Protocolos');
    await expect(page.locator('#view-public-marketplace')).toBeVisible();

    // Verify public products display
    const publicGrid = page.locator('#public-store-grid');
    await expect(publicGrid).toBeVisible();

    // Verify that the Detox product is displayed
    const detoxProduct = publicGrid.locator('text=Protocolo Express Detox');
    await expect(detoxProduct).toBeVisible();

    // Buy Detox product as visitor
    await publicGrid.locator('.product-card:has-text("Protocolo Express Detox") .btn-buy').click();
    await expect(page.locator('#checkout-modal')).toBeVisible();

    // Verify that checkout guest inputs are visible
    await expect(page.locator('#checkout-guest-fields')).toBeVisible();
    await page.fill('#checkout-guest-name', 'Carlos Visitante');
    await page.fill('#checkout-guest-email', 'carlos.visitor@exemplo.com');

    // Complete Checkout
    await page.click('button:has-text("Confirmar e Pagar")');

    // Wait for the checkout/payment to process and alert
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Cadastro realizado com sucesso');
      await dialog.accept();
    });

    // Patient portal should be visible after payment approval
    await expect(page.locator('#app-container')).toBeVisible();
    
    // Header should greet Carlos Visitante
    const profileName = page.locator('#user-profile-name');
    await expect(profileName).toHaveText('Carlos Visitante');

    // Active purchased product should be in the store list and show "Já Adquirido"
    await expect(page.locator('#store-patient-products-grid')).toBeVisible();
    const detoxStatus = page.locator('#store-patient-products-grid .product-card:has-text("Protocolo Express Detox") .btn-buy');
    await expect(detoxStatus).toHaveText('Já Adquirido (Baixar)');
  });

  test('3. Compra, Despacho do Fornecedor com Código de Rastreio e Visão do Paciente', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Log in as Patient (Ana Paula Silva)
    await page.goto(tenantTatiURL);
    await page.click('#btn-role-paciente');
    await page.fill('#login-email', 'ana.silva@exemplo.com');
    await page.fill('#login-password', '••••••••');
    await page.click('button:has-text("Entrar")');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('button:has-text("Verificar Código")');

    // Wait for patient portal
    await expect(page.locator('#app-container')).toBeVisible();

    // Set the patient address in localStorage so quotes can render
    await page.evaluate(() => {
      localStorage.setItem('amazing_franklin_patient_address', JSON.stringify({
        cep: '01311-200',
        street: 'Av. Paulista',
        number: '1000',
        complement: '',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP'
      }));
    });
    // Reload page to apply the address
    await page.reload();

    // Switch to Cotações de Fórmulas tab
    await page.click('text=Cotações de Fórmulas');
    await expect(page.locator('#tab-patient-quotes')).toBeVisible();

    // Buy formula quote from BioVida Manipulação
    await page.click('button:has-text("Comprar e Receber")');
    await expect(page.locator('#checkout-modal')).toBeVisible();

    // Complete payment
    await page.click('button:has-text("Confirmar e Pagar")');

    // Wait for success alert dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Fórmula adquirida com sucesso');
      await dialog.accept();
    });

    // Check delivery status shows Em Preparação
    await expect(page.locator('text=Em Preparação / Envio')).toBeVisible();

    // Log out
    await page.evaluate(() => window.handleLogout && window.handleLogout());
    await expect(page.locator('#view-login')).toBeVisible();

    // 2. Log in as Fornecedor to set a tracking code on the newly paid order
    await page.click('#btn-role-supplier');
    await page.fill('#login-email', 'farmacia@parceira.com');
    await page.fill('#login-password', '••••••••');
    await page.click('button:has-text("Entrar")');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('button:has-text("Verificar Código")');

    // Wait for Portal
    await expect(page.locator('#app-container')).toBeVisible();

    // Go to Received Orders tab
    await page.click('text=Pedidos Recebidos');
    await expect(page.locator('#tab-supplier-orders')).toBeVisible();

    // Find the first paid order and dispatch it
    const orderRow = page.locator('#supplier-orders-list-body tr').first();
    await expect(orderRow).toBeVisible();
    
    // Enter tracking code and click dispatch
    await orderRow.locator('input[placeholder="Cód. Rastreio"]').fill('BR987654321XP');
    
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('despachado com sucesso');
      await dialog.accept();
    });
    
    await orderRow.locator('button:has-text("Despachar")').click();

    // Confirm that the status changed to Enviado
    await expect(orderRow.locator('text=Enviado')).toBeVisible();
    await expect(orderRow).toContainText('BR987654321XP');

    // 3. Log out and log in as Patient (Ana Paula Silva) to check quote/shipping status
    await page.evaluate(() => window.handleLogout && window.handleLogout());
    await expect(page.locator('#view-login')).toBeVisible();

    await page.click('#btn-role-paciente');
    await page.fill('#login-email', 'ana.silva@exemplo.com');
    await page.fill('#login-password', '••••••••');
    await page.click('button:has-text("Entrar")');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('button:has-text("Verificar Código")');

    // Wait for patient portal
    await expect(page.locator('#app-container')).toBeVisible();

    // Switch to Cotações de Fórmulas tab
    await page.click('text=Cotações de Fórmulas');
    await expect(page.locator('#tab-patient-quotes')).toBeVisible();

    // Check if the order is marked as Enviado / Em Trânsito and displays the tracking link
    const prescriptionCard = page.locator('#patient-prescriptions-list .card').first();
    await expect(prescriptionCard).toBeVisible();
    await expect(prescriptionCard.locator('text=Enviado / Em Trânsito').first()).toBeVisible();
    await expect(prescriptionCard.locator('text=BR987654321XP')).toBeVisible();
  });

});
