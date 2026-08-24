// ============================================================================
// SUITE DE VERIFICAÇÃO DA CENTRAL DE CONTROLE TOTAL SAAS (Playwright)
// Caminho: tests/e2e/saas-total-control.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Amazing Franklin - SaaS Total Control Center E2E Tests', () => {

  const localPortalURL = 'http://localhost:3000';

  async function loginAsAdminAndSeed(page) {
    await page.goto(localPortalURL);

    // Seed test patient, test appointment, and test product in localStorage before logging in
    await page.evaluate(() => {
      // 1. Seed Patients
      const patients = JSON.parse(localStorage.getItem('amazing_franklin_patients_list')) || [];
      const cleanPatients = patients.filter(p => p.email !== 'deletar@teste.com');
      cleanPatients.push({
        id: 'pat-test-deletar',
        name: 'Paciente Teste Deletar',
        email: 'deletar@teste.com',
        phone: '(11) 99999-0000',
        lastConsult: '24/06/2026',
        status: 'Ativo',
        objective: 'Teste de Exclusao',
        history: [
          { date: '24/06/2026', weight: '75', bodyFat: '18' }
        ]
      });
      localStorage.setItem('amazing_franklin_patients_list', JSON.stringify(cleanPatients));

      // 2. Seed Appointments
      const appts = JSON.parse(localStorage.getItem('amazing_franklin_appointments_list')) || [];
      const cleanAppts = appts.filter(a => a.id !== 'appt-test-deletar');
      cleanAppts.push({
        id: 'appt-test-deletar',
        patientName: 'Paciente Teste Deletar',
        date: '24 de Junho de 2026',
        time: '16:00',
        type: 'Online',
        link: 'https://meet.jit.si/TatiCardoso-TesteDeletar-24Jun',
        status: 'Confirmado'
      });
      localStorage.setItem('amazing_franklin_appointments_list', JSON.stringify(cleanAppts));

      // 3. Seed Products
      const products = JSON.parse(localStorage.getItem('amazing_franklin_products_list')) || [];
      const cleanProducts = products.filter(p => p.id !== 'prod-test-deletar');
      cleanProducts.push({
        id: 'prod-test-deletar',
        title: 'Infoproduto Teste Deletar',
        price: 49.90,
        duration: 30,
        tag: 'E-BOOK',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        desc: 'Infoproduto de teste para remocao',
        fileUrl: 'test.pdf',
        isPublic: true
      });
      localStorage.setItem('amazing_franklin_products_list', JSON.stringify(cleanProducts));
    });

    // Reload the page so the app reads the new localStorage values during initialization
    await page.reload();

    // Click Nutricionista access role button
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati.cardoso@nutricionista.com.br');
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

    // Open User Profile and go to SaaS dashboard
    await page.locator('.user-profile').click();
    await page.locator('#profile-menu-admin-btn').click();
    await expect(page.locator('#tab-admin-dashboard')).toBeVisible();
  }

  test('1. Verify All 5 Dashboard Directory Tables are Loaded', async ({ page }) => {
    await loginAsAdminAndSeed(page);

    // 1. Patients Directory
    await expect(page.locator('#admin-patients-list-body tr:has-text("Paciente Teste Deletar")')).toBeVisible();
    
    // 2. Consultations History
    await expect(page.locator('#admin-consultations-list-body tr:has-text("Paciente Teste Deletar")')).toBeVisible();

    // 3. Prescriptions Center
    await expect(page.locator('#admin-prescriptions-list-body')).toBeVisible();

    // 4. Scheduled Appointments Directory
    await expect(page.locator('#admin-appointments-list-body tr:has-text("Paciente Teste Deletar")')).toBeVisible();

    // 5. E-books & Store Products Directory
    await expect(page.locator('#admin-products-list-body tr:has-text("Infoproduto Teste Deletar")')).toBeVisible();
  });

  test('2. Cancel an Appointment and Verify Audit Logs', async ({ page }) => {
    await loginAsAdminAndSeed(page);

    // Setup handler for confirm dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('cancelar e excluir permanentemente');
      await dialog.accept();
    });

    // Click Cancelar button on the test appointment row
    const apptRow = page.locator('#admin-appointments-list-body tr:has-text("Paciente Teste Deletar")');
    await apptRow.locator('button:has-text("Cancelar")').click();

    // Wait for DOM update
    await page.waitForTimeout(500);

    // Verify appointment is no longer in directory
    await expect(page.locator('#admin-appointments-list-body tr:has-text("Paciente Teste Deletar")')).toBeHidden();

    // Verify activity logs registered the cancellation
    await expect(page.locator('#admin-activities-list-body tr:has-text("Super Admin cancelou consulta de Paciente Teste Deletar")').first()).toBeVisible();
  });

  test('3. Remove an E-book Product and Verify Audit Logs', async ({ page }) => {
    await loginAsAdminAndSeed(page);

    // Setup handler for confirm dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('excluir permanentemente o produto');
      await dialog.accept();
    });

    // Click Remover button on the test product row
    const productRow = page.locator('#admin-products-list-body tr:has-text("Infoproduto Teste Deletar")');
    await productRow.locator('button:has-text("Remover")').click();

    // Wait for DOM update
    await page.waitForTimeout(500);

    // Verify product is no longer in directory
    await expect(page.locator('#admin-products-list-body tr:has-text("Infoproduto Teste Deletar")')).toBeHidden();

    // Verify activity logs registered the removal
    await expect(page.locator('#admin-activities-list-body tr:has-text("Super Admin excluiu o produto Infoproduto Teste Deletar")').first()).toBeVisible();
  });

  test('4. Delete a Consultation and Patient and Verify Cascading Logs', async ({ page }) => {
    await loginAsAdminAndSeed(page);

    // 1. Test Consultation Deletion
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Deseja excluir permanentemente');
      await dialog.accept();
    });

    const consultRow = page.locator('#admin-consultations-list-body tr:has-text("Paciente Teste Deletar")');
    await consultRow.locator('button:has-text("Excluir")').click();
    await page.waitForTimeout(500);

    await expect(page.locator('#admin-consultations-list-body tr:has-text("Paciente Teste Deletar")')).toBeHidden();
    await expect(page.locator('#admin-activities-list-body tr:has-text("excluiu consulta de Paciente Teste Deletar")').first()).toBeVisible();

    // 2. Test Patient Deletion
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('excluir permanentemente o paciente Paciente Teste Deletar');
      await dialog.accept();
    });

    const patientRow = page.locator('#admin-patients-list-body tr:has-text("Paciente Teste Deletar")');
    await patientRow.locator('button:has-text("Excluir")').click();
    await page.waitForTimeout(500);

    await expect(page.locator('#admin-patients-list-body tr:has-text("Paciente Teste Deletar")')).toBeHidden();
    await expect(page.locator('#admin-activities-list-body tr:has-text("excluiu o paciente Paciente Teste Deletar")').first()).toBeVisible();
  });

});
