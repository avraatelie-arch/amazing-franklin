// ============================================================================
// SUITE DE VERIFICAÇÃO DE NOVAS FUNCIONALIDADES (Playwright)
// Caminho: tests/e2e/new-features.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Amazing Franklin - New Features E2E Verification Tests', () => {

  const tenantTatiURL = 'http://taticardoso.localhost:3000';

  test('1. CEP Lookup Auto-Fill and Border Indicators Validation', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // Switch to Nutricionista login
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

    // Click "Meu Cadastro" in sidebar to open profile modal (scoped to menu-nutricionista)
    await page.locator('#menu-nutricionista >> text=Meu Cadastro').click();
    await expect(page.locator('#nutri-profile-modal')).toBeVisible();

    // Verify CEP input validation styling
    const cepInput = page.locator('#nutri-profile-cep');
    await cepInput.fill('01311-200');
    await cepInput.evaluate(el => window.handleNutriCepLookup ? window.handleNutriCepLookup(el.value) : null);
    // Borda verde (var(--primary-olive)) should be applied on valid CEP
    await expect(cepInput).toHaveCSS('border-color', /rgb\(96,\s*115,\s*97\)/);

    // Verify street is populated
    await expect(page.locator('#nutri-profile-street')).toHaveValue('Avenida Paulista');

    // Test invalid CEP
    await cepInput.fill('99999-999');
    await cepInput.evaluate(el => window.handleNutriCepLookup ? window.handleNutriCepLookup(el.value) : null);
    // Borda terracotta (var(--terracotta)) should be applied on invalid CEP
    await expect(cepInput).toHaveCSS('border-color', /rgb\(159,\s*109,\s*66\)/);
  });

  test('2. Evolution Program Templates Loading and Saving', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // Switch to Nutricionista login
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

    // Navigate to Consulta tab
    await page.click('text=Novo Atendimento');
    await expect(page.locator('#tab-nutri-consult')).toBeVisible();

    // Select Metabolismo template
    await page.selectOption('#consult-template-select', 'metabolismo');

    // Check if fields are populated using toHaveValue for textareas
    await expect(page.locator('#evolution-fase-atual')).toHaveValue(/Otimização mitocondrial/);
    await expect(page.locator('#evolution-objetivo')).toHaveValue(/Reduzir gordura visceral/);
  });

  test('3. Chatbot MEL AI Support Assistant Widget', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // Login as Patient first to test chatbot in portal
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

    // Open Chatbot MEL panel
    const botBtn = page.locator('.ai-chatbot-btn');
    await expect(botBtn).toBeVisible();
    await botBtn.click();

    const panel = page.locator('#ai-chatbot-panel');
    await expect(panel).toBeVisible();

    // Click quick option CEP
    await page.click('button:has-text("CEP Automático")');
    await page.waitForTimeout(1200);

    // Verify response mentions ViaCEP and Patient context
    const chatbotBody = page.locator('#ai-chatbot-body');
    await expect(chatbotBody).toContainText('ViaCEP');
    await expect(chatbotBody).toContainText('Formulário de Endereço de Entrega');

    // Query for e-books/recipes as Patient
    await page.fill('#ai-chatbot-input-field', 'Como funcionam os e-books?');
    await page.press('#ai-chatbot-input-field', 'Enter');
    await page.waitForTimeout(1200);
    await expect(chatbotBody).toContainText('Você como paciente não pode vender e-books. O que você pode fazer é apenas comprar. Vá até a aba de E-books e Protocolos e adquira por lá.');

    // Query for e-books/recipes as Patient with typo/synonym 'ebbok'
    await page.fill('#ai-chatbot-input-field', 'como vender ebbok?');
    await page.press('#ai-chatbot-input-field', 'Enter');
    await page.waitForTimeout(1200);
    await expect(chatbotBody).toContainText('Você como paciente não pode vender e-books. O que você pode fazer é apenas comprar. Vá até a aba de E-books e Protocolos e adquira por lá.');

    // Query for e-books/recipes as Patient with typo/synonym 'livro'
    await page.fill('#ai-chatbot-input-field', 'posso lançar um livro?');
    await page.press('#ai-chatbot-input-field', 'Enter');
    await page.waitForTimeout(1200);
    await expect(chatbotBody).toContainText('Você como paciente não pode vender e-books. O que você pode fazer é apenas comprar. Vá até a aba de E-books e Protocolos e adquira por lá.');

    // Query for prescribing formulas as Patient
    await page.fill('#ai-chatbot-input-field', 'Como ver minha fórmula?');
    await page.press('#ai-chatbot-input-field', 'Enter');
    await page.waitForTimeout(1200);
    await expect(chatbotBody).toContainText('solicitar/requisitar orçamentos');

    // Query for shipping tracking as Patient
    await page.fill('#ai-chatbot-input-field', 'Onde está o rastreio?');
    await page.press('#ai-chatbot-input-field', 'Enter');
    await page.waitForTimeout(1200);
    await expect(chatbotBody).toContainText('clicando no link de rastreamento');
  });

  test('4. Master Nutritionist Admin Dashboard Integration', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // Login as Master Nutri
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati.cardoso@nutricionista.com.br');
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

    // Open Chatbot MEL panel to test Nutri role-specific responses
    const botBtn = page.locator('.ai-chatbot-btn');
    await expect(botBtn).toBeVisible();
    await botBtn.click();

    const chatbotBody = page.locator('#ai-chatbot-body');

    // Query CEP as Nutri
    await page.fill('#ai-chatbot-input-field', 'Como funciona o CEP?');
    await page.press('#ai-chatbot-input-field', 'Enter');
    await page.waitForTimeout(1200);
    await expect(chatbotBody).toContainText('Cadastro de Paciente');

    // Query e-books as Nutri
    await page.fill('#ai-chatbot-input-field', 'Como criar e-books?');
    await page.press('#ai-chatbot-input-field', 'Enter');
    await page.waitForTimeout(1200);
    await expect(chatbotBody).toContainText('criar, gerenciar e vender');

    // Query prescribing formulas as Nutri
    await page.fill('#ai-chatbot-input-field', 'Como prescrever formulas?');
    await page.press('#ai-chatbot-input-field', 'Enter');
    await page.waitForTimeout(1200);
    await expect(chatbotBody).toContainText('prescrever fórmulas magistrais');

    // Query shipping tracking as Nutri
    await page.fill('#ai-chatbot-input-field', 'Como funciona a entrega?');
    await page.press('#ai-chatbot-input-field', 'Enter');
    await page.waitForTimeout(1200);
    await expect(chatbotBody).toContainText('Nutricionistas não despacham');

    // Close Chatbot panel
    await botBtn.click();

    // Open user profile dropdown
    await page.locator('.user-profile').click();

    // Verify Painel do Dono (SaaS) button is visible
    const adminLink = page.locator('#profile-menu-admin-btn');
    await expect(adminLink).toBeVisible();

    // Click it and verify dashboard is displayed
    await adminLink.click();
    await expect(page.locator('#tab-admin-dashboard')).toBeVisible();

    // Logout
    await page.click('a.nav-item[onclick="handleLogout()"]');

    // Login as standard Nutri
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

    // Open profile dropdown
    await page.locator('.user-profile').click();

    // Verify Painel do Dono (SaaS) dropdown option is hidden
    await expect(page.locator('#profile-menu-admin-btn')).toBeHidden();
  });

  test('5. Clinical Timeline Full-Width Rendering & Interactive Actions', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // Login as Patient
    await page.click('#btn-role-paciente');
    await page.fill('#login-email', 'ana.silva@exemplo.com');
    await page.fill('#login-password', 'senha123');
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

    // Navigate to Evolução Física
    await page.locator('#menu-paciente >> text=Evolução Física').click();
    await expect(page.locator('#tab-evolution')).toBeVisible();

    // Verify timeline card is present in full-width dedicated section
    const timelineCard = page.locator('#evolution-timeline-card');
    await expect(timelineCard).toBeVisible();

    // Verify consult count badge
    await expect(page.locator('#timeline-consult-count')).toContainText('3 Consultas Realizadas');

    // Verify all 3 consultation items rendered in timeline
    const timelineItems = page.locator('#patient-clinical-timeline .timeline-item');
    await expect(timelineItems).toHaveCount(3);

    // Verify first card has Parecer, Plano Alimentar, and Formula Manipulada
    await expect(timelineItems.first()).toContainText('Parecer Clínico & Conduta');
    await expect(timelineItems.first()).toContainText('Plano Alimentar Sugerido');
    await expect(timelineItems.first()).toContainText('Fórmula Manipulada');

    // Test "Baixar PDF" action
    const btnDietPdf = timelineItems.first().locator('button:has-text("Baixar PDF")');
    await expect(btnDietPdf).toBeVisible();
    await btnDietPdf.click();
    await expect(page.locator('#diet-plan-modal').first()).toBeVisible();
    await expect(page.locator('#printable-diet-content').first()).toContainText('PLANO ALIMENTAR EM PDF');
    // Close modal
    await page.locator('#diet-plan-modal .btn-action-secondary:has-text("Fechar")').first().click();
    await expect(page.locator('#diet-plan-modal').first()).toBeHidden();

    // Test "Baixar Receita" action
    const btnPresc = timelineItems.first().locator('button:has-text("Baixar Receita")');
    if (await btnPresc.isVisible()) {
      await btnPresc.click();
      await expect(page.locator('#prescription-sheet-modal')).toBeVisible();
      await expect(page.locator('#presc-sheet-patient-name')).toContainText('Ana Paula Silva');
      // Close prescription modal
      await page.locator('#prescription-sheet-modal button:has-text("Fechar")').click();
      await expect(page.locator('#prescription-sheet-modal')).toBeHidden();
    }
  });

});

