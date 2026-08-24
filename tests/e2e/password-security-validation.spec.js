// ============================================================================
// SUITE DE TESTES E2E: GESTÃO SEGURA DE SENHAS (OLHO, REPETIÇÃO E VALIDAÇÃO)
// Arquivo: tests/e2e/password-security-validation.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('EP-07 Story 9: Gestão Segura de Senhas (Toggle de Olho, Confirmação e Validador)', () => {

  test.beforeEach(async ({ page }) => {
    // Abrir o sistema e limpar estado
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('1. Toggle de Olho na Tela de Login: Alternar tipo entre password e text', async ({ page }) => {
    await expect(page.locator('#view-login')).toBeVisible();
    const loginPwd = page.locator('#login-password');
    await expect(loginPwd).toHaveAttribute('type', 'password');

    // Botão de alternar visibilidade de senha
    const toggleBtn = page.locator('#view-login .password-toggle-btn');
    await expect(toggleBtn).toBeVisible();

    // Clicar para mostrar a senha
    await toggleBtn.click();
    await expect(loginPwd).toHaveAttribute('type', 'text');

    // Clicar novamente para ocultar a senha
    await toggleBtn.click();
    await expect(loginPwd).toHaveAttribute('type', 'password');
  });

  test('2. Cadastro da Nutricionista: Validador de Força Dinâmico e Checklist de Critérios', async ({ page }) => {
    await page.click('#btn-role-nutri');
    await page.click('a[onclick*="view-nutri-registration"]');
    await expect(page.locator('#view-nutri-registration')).toBeVisible();

    const pwdInput = page.locator('#nutri-reg-password');
    const meter = page.locator('#nutri-password-meter');

    // Inicialmente o medidor está oculto
    await expect(meter).toBeHidden();

    // Digitar senha fraca
    await pwdInput.fill('123');
    await expect(meter).toBeVisible();
    await expect(meter).toContainText('Fraca');

    // Digitar senha completa que atende a todos os critérios
    await pwdInput.fill('SenhaForte@2026');
    await expect(meter).toContainText('Excelente / Perfeita');
    await expect(meter.locator('.criteria-item.valid')).toHaveCount(5);
  });

  test('3. Confirmação de Senhas: Match Badge e Bloqueio de Senhas Divergentes', async ({ page }) => {
    await page.click('#btn-role-nutri');
    await page.click('a[onclick*="view-nutri-registration"]');
    await expect(page.locator('#view-nutri-registration')).toBeVisible();

    // Preencher dados cadastrais
    await page.fill('#nutri-reg-name', 'Dra. Camila Nunes');
    await page.fill('#nutri-reg-crn', 'CRN-3 88888');
    await page.fill('#nutri-reg-email', 'camila.nunes@nutri.com');
    await page.fill('#nutri-reg-phone', '11988887777');
    await page.fill('#nutri-reg-cep', '01311-200');
    await page.fill('#nutri-reg-city', 'São Paulo');

    const pwdInput = page.locator('#nutri-reg-password');
    const pwdConfirm = page.locator('#nutri-reg-password-confirm');
    const matchBadge = page.locator('#nutri-password-match');

    // Senhas divergentes
    await pwdInput.fill('SenhaSegura123');
    await pwdConfirm.fill('SenhaDiferente123');
    await expect(matchBadge).toBeVisible();
    await expect(matchBadge).toContainText('As senhas não conferem');

    // Tentar submeter com senhas divergentes
    await page.click('#view-nutri-registration button[type="submit"]');
    await expect(page.locator('#app-global-toast')).toBeVisible();
    await expect(page.locator('#app-global-toast')).toContainText('não são idênticas');

    // Corrigir para senhas idênticas
    await pwdConfirm.fill('SenhaSegura123');
    await expect(matchBadge).toContainText('Senhas idênticas');

    // Submeter com sucesso
    await page.click('#view-nutri-registration button[type="submit"]');

    // Redirecionado de volta para o login
    await expect(page.locator('#view-login')).toBeVisible();
  });

  test('4. Ativação de Paciente: Validação de Senha Forte e Confirmação', async ({ page }) => {
    // Acessar tela de primeiro acesso / ativação
    await page.click('#btn-role-paciente');
    await page.click('a[onclick*="view-patient-activation"]');
    await expect(page.locator('#view-patient-activation')).toBeVisible();

    // Passo 1: E-mail
    await page.fill('#pat-act-email', 'ana.silva@exemplo.com');
    await page.click('#pat-act-step1 button[type="submit"]');

    // Passo 2: Código SMS
    await expect(page.locator('#pat-act-step2')).toBeVisible();
    await page.fill('#pat-act-sms-code', '123456');
    await page.click('#pat-act-step2 button[type="submit"]');

    // Passo 3: CPF e Nova Senha
    await expect(page.locator('#pat-act-step3')).toBeVisible();
    await page.fill('#pat-act-cpf', '12345678901');

    const actPwd = page.locator('#pat-act-password');
    const actConfirm = page.locator('#pat-act-password-confirm');
    const actMatch = page.locator('#pat-act-password-match');

    // Testar toggle de olho no campo de ativação
    const toggleBtn = page.locator('#pat-act-step3 .password-toggle-btn').first();
    await expect(actPwd).toHaveAttribute('type', 'password');
    await toggleBtn.click();
    await expect(actPwd).toHaveAttribute('type', 'text');
    await toggleBtn.click();
    await expect(actPwd).toHaveAttribute('type', 'password');

    // Senha com senhas idênticas e seguras
    await actPwd.fill('SenhaPaciente123');
    await actConfirm.fill('SenhaPaciente123');
    await expect(actMatch).toContainText('Senhas idênticas');

    await page.click('#pat-act-step3 button[type="submit"]');

    // Redireciona para o login
    await expect(page.locator('#view-login')).toBeVisible();

    // Realizar login com as credenciais ativadas
    await page.fill('#login-password', 'SenhaPaciente123');
    await page.click('#view-login button[type="submit"]');

    // 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Deve entrar na aplicação
    await expect(page.locator('#app-container')).toBeVisible();
    await expect(page.locator('#tab-home')).toBeVisible();
  });

});
