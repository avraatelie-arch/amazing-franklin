// ============================================================================
// SUITE DE TESTES E2E: HONORÁRIOS, NFS-e, FLUXO DE CAIXA E REAJUSTE ANUAL (1 ANO)
// Caminho: tests/e2e/consult-fee-nfse-annual-review.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Amazing Franklin - Honorários, NFS-e e Lembrete de Reajuste Anual', () => {

  const tenantTatiURL = 'http://taticardoso.localhost:3000';

  test.beforeEach(async ({ page }) => {
    await page.goto(tenantTatiURL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  async function loginAsNutri(page) {
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // Aguarda view 2FA
    await expect(page.locator('#view-2fa')).toBeVisible();

    // 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();
  }

  test('1. Cadastro de Paciente com Honorário Personalizado e Preenchimento Automático no Atendimento', async ({ page }) => {
    await loginAsNutri(page);

    // Navega para Lista de Pacientes
    await page.click('a.nav-item[onclick*="tab-nutri-patients"]');
    await expect(page.locator('#tab-nutri-patients')).toBeVisible();

    // Abre modal de cadastro de paciente
    await page.click('button[onclick*="openRegisterPatientModal"]');
    const modal = page.locator('#register-patient-modal');
    await expect(modal).toBeVisible();

    // Preenche dados do novo paciente com valor customizado (R$ 480.00)
    await page.locator('#reg-patient-name').fill('Mariana Alcantara');
    await page.locator('#reg-patient-email').fill('mariana.alcantara@teste.com');
    await page.locator('#reg-patient-phone').fill('(11) 97777-6666');
    await page.locator('#reg-patient-consult-fee').fill('480.00');

    // Submete cadastro
    await modal.locator('button[type="submit"]').click();

    // Fecha modal de sucesso de ativação se abrir
    const onboardingModal = page.locator('#patient-onboarding-success-modal');
    if (await onboardingModal.isVisible()) {
      await page.click('#patient-onboarding-success-modal button[onclick*="closePatientOnboardingSuccessModal"]');
    }

    // Verifica que o paciente aparece na tabela de pacientes
    await expect(page.locator('#tab-nutri-patients table.patient-table')).toContainText('Mariana Alcantara');

    // Clica em "Novo Atendimento" para Mariana Alcantara
    const row = page.locator('#tab-nutri-patients table.patient-table tr', { hasText: 'Mariana Alcantara' });
    await row.locator('button[onclick*="selectPatientForConsult"]').click();

    // Verifica que foi redirecionada para #tab-nutri-consult
    await expect(page.locator('#tab-nutri-consult')).toBeVisible();
    await expect(page.locator('#consult-patient-title')).toContainText('Mariana Alcantara');

    // Verifica que o campo de honorário foi preenchido com 480.00
    const feeInput = page.locator('#consult-patient-fee');
    await expect(feeInput).toHaveValue('480.00');
  });

  test('2. Conclusão da Consulta, Emissão de NFS-e e Alimentação do Fluxo de Caixa', async ({ page }) => {
    await loginAsNutri(page);

    // Cadastra paciente
    await page.click('a.nav-item[onclick*="tab-nutri-patients"]');
    await page.click('button[onclick*="openRegisterPatientModal"]');
    const modal = page.locator('#register-patient-modal');
    await expect(modal).toBeVisible();

    await page.locator('#reg-patient-name').fill('Rafael Barreto');
    await page.locator('#reg-patient-email').fill('rafael.barreto@teste.com');
    await page.locator('#reg-patient-phone').fill('(11) 98888-5555');
    await page.locator('#reg-patient-consult-fee').fill('500.00');
    await modal.locator('button[type="submit"]').click();

    const onboardingModal = page.locator('#patient-onboarding-success-modal');
    if (await onboardingModal.isVisible()) {
      await page.click('#patient-onboarding-success-modal button[onclick*="closePatientOnboardingSuccessModal"]');
    }

    // Abre atendimento clicando no botão da linha
    const row = page.locator('#tab-nutri-patients table.patient-table tr', { hasText: 'Rafael Barreto' });
    await row.locator('button[onclick*="selectPatientForConsult"]').click();
    await expect(page.locator('#tab-nutri-consult')).toBeVisible();
    await expect(page.locator('#consult-patient-title')).toContainText('Rafael Barreto');

    // Preenche dados da consulta
    await page.fill('#input-peso', '78.5');
    await page.fill('#input-gordura', '16.2');
    await page.fill('#input-massa', '36.8');
    await page.fill('#input-notes', 'Paciente Rafael Barreto compareceu para consulta e bioimpedância.');
    await page.fill('#input-dieta', 'Plano Alimentar Hipertrofia & Performance V1');

    // Salva consulta
    await page.click('#form-nutri-consult button[type="submit"]');
    const reviewModal = page.locator('#consult-review-modal');
    await expect(reviewModal).toBeVisible();

    // Confirma gravação clicando no botão do modal
    await page.click('#consult-review-modal button[onclick*="confirmAndSavePatientConsult"]');
    await expect(reviewModal).not.toHaveClass(/active/);

    // Fecha o modal de prontuário se aberto e navega para o Dashboard & Fluxo de Caixa (aba Relatórios)
    await page.evaluate(() => {
      if (typeof closePatientProfileModal === 'function') {
        closePatientProfileModal();
      }
      if (typeof switchTab === 'function') {
        switchTab('tab-nutri-reports');
      }
    });

    await expect(page.locator('#tab-nutri-reports')).toBeVisible();

    // Valida que a tabela de fluxo de caixa contém a consulta de Rafael Barreto com valor R$ 500,00
    const cashFlowTable = page.locator('#nutri-cash-flow-body');
    await expect(cashFlowTable).toContainText('Rafael Barreto');
    await expect(cashFlowTable).toContainText('500,00');

    // Clica no botão "Ver NFS-e"
    const entryRow = cashFlowTable.locator('tr', { hasText: 'Rafael Barreto' });
    await entryRow.locator('button', { hasText: 'Ver NFS-e' }).click();

    // Valida abertura do modal de NFS-e oficial
    const nfseModal = page.locator('#modal-view-nfse');
    await expect(nfseModal).toBeVisible();
    await expect(nfseModal.locator('#nfse-tomador-name')).toContainText('Rafael Barreto');
    await expect(nfseModal.locator('#nfse-total-val')).toContainText('500,00');
    await expect(nfseModal.locator('#nfse-prestador-name')).toContainText('Tati Cardoso');

    // Fecha modal
    await nfseModal.locator('button[onclick*="closeNfseModal"]').first().click();
    await expect(nfseModal).not.toHaveClass(/active/);
  });

  test('3. Detecção de Aniversário de 1 Ano, Alerta de Reajuste Opcional e Aplicação de Preset (+10%)', async ({ page }) => {
    await loginAsNutri(page);

    // Injeta um paciente com 1 ano de atendimento no localStorage e dispara renderização
    await page.evaluate(() => {
      let list = JSON.parse(localStorage.getItem('amazing_franklin_patients_list') || '[]');
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setDate(oneYearAgo.getDate() - 10); // 375 dias atrás

      list.unshift({
        name: "Juliana Mendes",
        createdAt: "15 de Janeiro de 2025",
        contractStartDate: oneYearAgo.toISOString(),
        lastFeeReviewDate: oneYearAgo.toISOString(),
        consultFee: 350.00,
        annualFeeAlertDismissed: false,
        lastConsult: "15 de Janeiro de 2025",
        status: "Ativo",
        objective: "Emagrecimento & Longevidade",
        email: "juliana.mendes@teste.com",
        phone: "(11) 91234-5678",
        history: [],
        nutriEmail: "tati@cardoso.com"
      });

      localStorage.setItem('amazing_franklin_patients_list', JSON.stringify(list));
      if (typeof renderPatientsTable === 'function') {
        renderPatientsTable();
      }
    });

    // Valida que o alerta de revisão de honorários de 1 ano apareceu no topo
    const alertsContainer = page.locator('#patient-annual-review-alerts-container');
    await expect(alertsContainer).toBeVisible();
    await expect(alertsContainer).toContainText('Lembrete de Aniversário de Acompanhamento (1 Ano)');
    await expect(alertsContainer).toContainText('Juliana Mendes');
    await expect(alertsContainer).toContainText('R$ 350,00');

    // Clica no botão "Reajustar Valor"
    await alertsContainer.locator('button', { hasText: 'Reajustar Valor' }).click();

    // Valida modal de reajuste
    const adjustModal = page.locator('#modal-adjust-patient-fee');
    await expect(adjustModal).toBeVisible();
    await expect(adjustModal.locator('#adjust-fee-display-name')).toContainText('Juliana Mendes');
    await expect(adjustModal.locator('#adjust-fee-current-val')).toContainText('350,00');

    // Clica no preset +10%
    await adjustModal.locator('button', { hasText: '+10%' }).click();
    await expect(adjustModal.locator('#adjust-fee-new-val')).toHaveValue('385.00');

    // Salva reajuste
    await adjustModal.locator('button[type="submit"]').click();

    // Valida fechamento do modal e que o alerta foi dispensado/atualizado
    await expect(adjustModal).not.toHaveClass(/active/);
    await expect(alertsContainer).not.toBeVisible();

    // Abre prontuário da Juliana Mendes e valida que o novo valor é R$ 385,00
    const julianaRow = page.locator('#tab-nutri-patients table.patient-table tr', { hasText: 'Juliana Mendes' });
    await julianaRow.locator('button[onclick*="openPatientProfileModal"]').click();

    const profileModal = page.locator('#patient-profile-modal');
    await expect(profileModal).toBeVisible();
    await expect(profileModal.locator('#profile-patient-consult-fee')).toContainText('385,00');
  });

  test('4. Opção de Manter Valor Atual sem Reajuste (+1 Ano) Postergando o Lembrete', async ({ page }) => {
    await loginAsNutri(page);

    // Injeta paciente veterano e dispara renderização
    await page.evaluate(() => {
      let list = JSON.parse(localStorage.getItem('amazing_franklin_patients_list') || '[]');
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      list.unshift({
        name: "Marcio Souza",
        createdAt: "10 de Fevereiro de 2025",
        contractStartDate: oneYearAgo.toISOString(),
        lastFeeReviewDate: oneYearAgo.toISOString(),
        consultFee: 320.00,
        annualFeeAlertDismissed: false,
        lastConsult: "10 de Fevereiro de 2025",
        status: "Ativo",
        objective: "Hipertrofia",
        email: "marcio.souza@teste.com",
        phone: "(11) 94444-3333",
        history: [],
        nutriEmail: "tati@cardoso.com"
      });

      localStorage.setItem('amazing_franklin_patients_list', JSON.stringify(list));
      if (typeof renderPatientsTable === 'function') {
        renderPatientsTable();
      }
    });

    const alertsContainer = page.locator('#patient-annual-review-alerts-container');
    await expect(alertsContainer).toBeVisible();
    await expect(alertsContainer).toContainText('Marcio Souza');

    // Clica em "Manter Valor (+1 Ano)"
    await alertsContainer.locator('button', { hasText: 'Manter Valor (+1 Ano)' }).click();

    // O alerta é dispensado
    await expect(alertsContainer).not.toBeVisible();

    // Verifica que o valor permaneceu R$ 320,00 no prontuário
    const marcioRow = page.locator('#tab-nutri-patients table.patient-table tr', { hasText: 'Marcio Souza' });
    await marcioRow.locator('button[onclick*="openPatientProfileModal"]').click();

    const profileModal = page.locator('#patient-profile-modal');
    await expect(profileModal.locator('#profile-patient-consult-fee')).toContainText('320,00');
  });

});
