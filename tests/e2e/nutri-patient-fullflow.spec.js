// ============================================================================
// SUITE DE TESTES END-TO-END: FLUXO COMPLETO NUTRICIONISTA & PACIENTE
// Caminho: tests/e2e/nutri-patient-fullflow.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Amazing Franklin - Full End-to-End Nutri & Patient Workflows', () => {

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

  test('1. Autenticação e Navegação Completa (Nutricionista vs Paciente)', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // A. Login como Nutricionista
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
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

    // Validar itens do menu da Nutricionista
    await expect(page.locator('#menu-nutricionista')).toBeVisible();
    await expect(page.locator('#menu-nutricionista >> text=Lista de Pacientes')).toBeVisible();
    await expect(page.locator('#menu-nutricionista >> text=Novo Atendimento')).toBeVisible();
    await expect(page.locator('#menu-nutricionista >> text=Agenda Semanal')).toBeVisible();
    await expect(page.locator('#menu-nutricionista >> text=Comunicação & Retenção')).toBeVisible();

    // B. Logout
    await page.click('a.nav-item[onclick="handleLogout()"]');
    await expect(page.locator('#view-login')).toBeVisible();

    // C. Login como Paciente
    await page.click('#btn-role-paciente');
    await page.fill('#login-email', 'ana.silva@exemplo.com');
    await page.fill('#login-password', 'senha123');
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

    // Validar itens do menu do Paciente
    await expect(page.locator('#menu-paciente')).toBeVisible();
    await expect(page.locator('#menu-paciente >> text=Página Inicial')).toBeVisible();
    await expect(page.locator('#menu-paciente >> text=Evolução Física')).toBeVisible();
    await expect(page.locator('#menu-paciente >> text=Área de Mentoria')).toBeVisible();
    await expect(page.locator('#menu-paciente >> text=E-books & Receitas')).toBeVisible();
  });

  test('2. Lista de Pacientes: Data de Cadastro, Filtros Avançados e Limpeza', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // Login como Nutricionista
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
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

    await expect(page.locator('#tab-nutri-patients')).toBeVisible();

    // Validar cabeçalho com Data de Cadastro
    const thead = page.locator('#tab-nutri-patients .patient-table thead');
    await expect(thead).toContainText('Data Cadastro');

    // Testar filtro por Status (Mentoria)
    await page.selectOption('#patient-status-filter', 'Mentoria');
    await page.waitForTimeout(300);
    const rowsMentoring = page.locator('#tab-nutri-patients .patient-table tbody tr');
    await expect(rowsMentoring).toContainText('Mentoria VIP');

    // Testar botão Limpar Filtros
    const clearBtn = page.locator('#btn-clear-patient-filters');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await page.waitForTimeout(300);

    // Testar filtro por Objetivo (Hipertrofia)
    await page.selectOption('#patient-objective-filter', 'Hipertrofia');
    await page.waitForTimeout(300);
    const rowsHyper = page.locator('#tab-nutri-patients .patient-table tbody tr');
    await expect(rowsHyper.first()).toContainText('Hipertrofia');

    // Limpar filtros novamente
    await clearBtn.click();
  });

  test('3. Agenda Semanal: Visualização de Colunas, Margens de Deslocamento e Regras', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // Login como Nutricionista
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
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

    // Abrir Agenda Semanal
    await page.locator('#menu-nutricionista >> text=Agenda Semanal').click();
    await expect(page.locator('#tab-nutri-schedule')).toBeVisible();

    // Validar colunas da semana
    const dayCols = page.locator('.schedule-day-column');
    await expect(dayCols).toHaveCount(6);

    // Validar KPIs no topo da agenda
    await expect(page.locator('#schedule-kpi-total-appts')).toBeVisible();
    await expect(page.locator('#schedule-kpi-total-hours')).toBeVisible();
    await expect(page.locator('#schedule-kpi-travel-hours')).toBeVisible();

    // Validar blocos de Deslocamento e Tolerância Clínica
    const transitBuffers = page.locator('.buffer-transit-card');
    await expect(transitBuffers.first()).toContainText('Deslocamento');

    const toleranceBuffers = page.locator('.buffer-tolerance-card');
    await expect(toleranceBuffers.first()).toContainText('Tolerância Clínica');

    // Abrir Modal de Regras de Margem
    await page.click('button:has-text("Regras de Margem")');
    await expect(page.locator('#schedule-settings-modal')).toHaveClass(/active/);

    // Fechar modal de regras
    await page.locator('#schedule-settings-modal .btn-action-secondary:has-text("Cancelar")').click();
    await expect(page.locator('#schedule-settings-modal')).not.toHaveClass(/active/);
  });

  test('4. Fluxo Multi-Canal: Reagendamento de Consulta e Modal de Despacho', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // Login como Nutricionista
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
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

    // Ir para Agenda Semanal
    await page.locator('#menu-nutricionista >> text=Agenda Semanal').click();
    await expect(page.locator('#tab-nutri-schedule')).toBeVisible();

    // Clicar em "Reagendar" no primeiro card disponível
    const rescheduleBtn = page.locator('.schedule-appt-card button:has-text("Reagendar")').first();
    await rescheduleBtn.click();

    await expect(page.locator('#schedule-appointment-modal')).toHaveClass(/active/);

    // Definir data e horário e confirmar com clique forçado
    await page.fill('#sched-date', '2026-06-25');
    await page.fill('#sched-time', '16:00');
    await page.click('#schedule-appointment-modal button[type="submit"]', { force: true });

    // Validar abertura do Modal de Notificação Multi-Canal
    const dispatchModal = page.locator('#appointment-dispatch-modal');
    await expect(dispatchModal).toHaveClass(/active/);
    await expect(dispatchModal).toContainText('WhatsApp');
    await expect(dispatchModal).toContainText('SMS Corporativo');
    await expect(dispatchModal).toContainText('E-mail Institucional');
    await expect(dispatchModal).toContainText('Área do Paciente');

    // Fechar modal de despacho
    await page.locator('#appointment-dispatch-modal button:has-text("Entendido")').click();
    await expect(dispatchModal).not.toHaveClass(/active/);
  });

  test('5. Central de Comunicação & Retenção: Radar Anti-Esquecimento e Fila WhatsApp', async ({ page }) => {
    await page.goto(tenantTatiURL);

    // Login como Nutricionista
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
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

    // Ir para Comunicação & Retenção
    await page.locator('#menu-nutricionista >> text=Comunicação & Retenção').click();
    await expect(page.locator('#tab-nutri-broadcast')).toBeVisible();

    // Validar Radar Anti-Esquecimento
    await expect(page.locator('#retention-radar-list')).toBeVisible();

    // Trocar Template para "Resgate de Inativos"
    await page.click('button:has-text("Resgate de Inativos")');
    await expect(page.locator('#broadcast-body')).toHaveValue(/Notamos que já faz um tempo/);

    // Clicar em "Abrir Fila no WhatsApp"
    await page.click('button:has-text("Abrir Fila no WhatsApp")');

    // Validar Modal de Fila WhatsApp
    const queueModal = page.locator('#whatsapp-broadcast-modal');
    await expect(queueModal).toHaveClass(/active/);
    await expect(queueModal).toContainText('Enviar no WhatsApp');

    // Fechar modal de fila
    await page.locator('#whatsapp-broadcast-modal button:has-text("Fechar")').click();
    await expect(queueModal).not.toHaveClass(/active/);
  });

});
