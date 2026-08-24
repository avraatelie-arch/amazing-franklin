// ============================================================================
// SUITE DE TESTES E2E: FARMÁCIA PARCEIRA, PROPOSTAS, WHATSAPP & CHECKOUT PIX
// Arquivo: tests/e2e/supplier-quotes-pix.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('EP-08 Story 1: Farmácia Parceira - Propostas em Aberto, Cobrança Multi-Canal e PIX', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('1. Envio de Proposta pela Farmácia e Exibição em "Propostas Enviadas / Aguardando Fechamento"', async ({ page }) => {
    // 1. Log in as Fornecedor
    await page.click('#btn-role-supplier');
    await page.fill('#login-email', 'biovida@exemplo.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // 2. Navegar para Cotações
    await page.click('a[onclick*="tab-supplier-quotes"]');
    await expect(page.locator('#tab-supplier-quotes')).toBeVisible();

    // 3. Responder a uma cotação pendente
    const priceInput = page.locator('input[id^="quote-price-"]').first();
    if (await priceInput.isVisible()) {
      await priceInput.fill('85.00');
      await page.locator('input[id^="quote-shipping-"]').first().fill('12.00');
      await page.locator('input[id^="quote-days-"]').first().fill('3');
      await page.locator('#supplier-pending-quotes-list form button[type="submit"]').first().click();
    }

    // 4. Verificar que a proposta aparece na seção de "Propostas Enviadas / Aguardando Fechamento"
    const openProposalsSection = page.locator('#supplier-submitted-proposals-list');
    await expect(openProposalsSection).toBeVisible();
    await expect(openProposalsSection.locator('.quote-proposal-card').first()).toBeVisible();
    await expect(openProposalsSection).toContainText('Aguardando Fechamento do Paciente');
    await expect(openProposalsSection).toContainText('R$ 97,00');
  });

  test('2. Ações de Cobrança e Follow-up: WhatsApp e Reenvio de E-mail', async ({ page }) => {
    // 1. Log in as Fornecedor
    await page.click('#btn-role-supplier');
    await page.fill('#login-email', 'biovida@exemplo.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // Navegar para Cotações
    await page.click('a[onclick*="tab-supplier-quotes"]');
    await expect(page.locator('#tab-supplier-quotes')).toBeVisible();

    // Garantir que existe uma proposta enviada
    const priceInput = page.locator('input[id^="quote-price-"]').first();
    if (await priceInput.isVisible()) {
      await priceInput.fill('90.00');
      await page.locator('input[id^="quote-shipping-"]').first().fill('15.00');
      await page.locator('input[id^="quote-days-"]').first().fill('4');
      await page.locator('#supplier-pending-quotes-list form button[type="submit"]').first().click();
    }

    // Clicar em "Cobrar no WhatsApp"
    const whatsappBtn = page.locator('.btn-whatsapp-followup').first();
    await expect(whatsappBtn).toBeVisible();
    await whatsappBtn.click();
    await expect(page.locator('#app-global-toast')).toContainText('WhatsApp');

    // Clicar em "Reenviar E-mail"
    const emailBtn = page.locator('.btn-email-followup').first();
    await expect(emailBtn).toBeVisible();
    await emailBtn.click();
    await expect(page.locator('#app-global-toast')).toContainText('E-mail institucional');
  });

  test('3. Checkout do Paciente com PIX Dinâmico, QR Code e Split de Comissões', async ({ page }) => {
    // 1. Log in as Paciente
    await page.click('#btn-role-paciente');
    await page.fill('#login-email', 'ana.silva@exemplo.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // Configurar endereço do paciente no localStorage e recarregar
    await page.evaluate(() => {
      localStorage.setItem('amazing_franklin_patient_address', JSON.stringify({
        cep: '01311-200',
        street: 'Av. Paulista',
        number: '1000',
        complement: 'Apto 42',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP'
      }));
    });
    await page.reload();

    // 2. Acessar Cotações de Fórmulas
    await page.click('text=Cotações de Fórmulas');
    await expect(page.locator('#tab-patient-quotes')).toBeVisible();

    // 3. Clicar em Comprar e Receber
    const buyBtn = page.locator('button:has-text("Comprar e Receber")').first();
    await expect(buyBtn).toBeVisible();
    await buyBtn.click();

    // 4. Verificar Checkout Modal e selecionar PIX
    await expect(page.locator('#checkout-modal')).toBeVisible();
    await page.selectOption('#checkout-modal select', 'pix');

    // 5. Verificar exibição do container de PIX Dinâmico
    const pixContainer = page.locator('#pix-instruction');
    await expect(pixContainer).toBeVisible();
    await expect(pixContainer.locator('.pix-qrcode-box')).toBeVisible();
    await expect(pixContainer.locator('#pix-countdown-timer')).toBeVisible();
    await expect(pixContainer.locator('#pix-code-input')).toBeVisible();

    // 6. Testar botão Copiar Chave PIX
    await page.click('.btn-copy-pix');
    await expect(page.locator('#app-global-toast')).toContainText('Chave PIX');

    // 7. Confirmar e Pagar via PIX
    await page.click('#submit-btn-text');

    // 8. Verificar fechamento do pedido e status Pago
    await expect(page.locator('#checkout-modal')).toBeHidden();
    await expect(page.locator('#patient-prescriptions-list')).toContainText('Pedido Confirmado & Pago');
  });

});
