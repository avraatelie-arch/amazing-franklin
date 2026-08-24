const { chromium } = require('c:/Users/Dati/Documents/antigravity/amazing-franklin/node_modules/@playwright/test');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.log(`BROWSER PAGE ERROR: ${err.message}`);
  });

  const tenantTatiURL = 'http://taticardoso.localhost:3000';
  console.log(`Navigating to ${tenantTatiURL}...`);
  try {
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

    await page.waitForSelector('#app-container', { visible: true });
    
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
    await page.reload();

    // Switch to Cotações de Fórmulas tab
    await page.click('text=Cotações de Fórmulas');
    await page.waitForSelector('#tab-patient-quotes', { visible: true });

    // Buy formula quote from BioVida Manipulação
    await page.click('button:has-text("Comprar e Receber")');
    await page.waitForSelector('#checkout-modal', { visible: true });

    // Complete payment
    await page.click('button:has-text("Confirmar e Pagar")');
    console.log("Clicked Confirmar e Pagar. Waiting for alert...");

    // Wait for success toast / modal close
    await page.waitForTimeout(3000);

    // Log out
    await page.click('.user-profile');
    await page.click('#user-profile-menu button:has-text("Sair da Conta")');
    await page.waitForSelector('#auth-wrapper', { visible: true });
    console.log("Logged out patient.");

    // 2. Log in as Fornecedor
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

    await page.waitForSelector('#app-container', { visible: true });
    console.log("Logged in as supplier. Clicking 'Pedidos Recebidos'...");

    // Click link
    await page.click('text=Pedidos Recebidos');
    
    // Check if visible
    const visible = await page.isVisible('#tab-supplier-orders');
    console.log(`#tab-supplier-orders visible: ${visible}`);

    // Take screenshot of supplier screen
    await page.screenshot({ path: 'C:/Users/Dati/.gemini/antigravity-ide/brain/a0b1b887-da15-48f6-baec-3e0f383473a6/scratch/screenshot_supplier.png' });
    console.log("Screenshot saved.");

  } catch (err) {
    console.error("Error during execution:", err);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
})();
