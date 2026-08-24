// ============================================================================
// SUITE DE TESTES E2E DE PENETRAÇÃO E SEGURANÇA (Playwright)
// Caminho: tests/e2e/tenant-security.spec.js
// ============================================================================
// Objetivo: Simular ataques cibernéticos e acessos cruzados na interface
// do navegador. Garante que se o usuário tentar alterar URLs, localStorage,
// ou interceptar requisições, o frontend e backend impeçam o vazamento.
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Portal Multi-Tenant - E2E Penetration & Security Tests', () => {

  // CONFIGURAÇÃO DOS CENÁRIOS DE ACESSO
  const tenantTatiURL = 'http://taticardoso.localhost:3000';
  const tenantMarinaURL = 'http://marinasilva.localhost:3000';

  test('1. Isolamento Visual e White-Label por Subdomínio', async ({ page }) => {
    // Acessa o subdomínio da Dra. Tati
    await page.goto(tenantTatiURL);
    
    // Verifica se a logo de carregamento e os estilos primários correspondem à Dra. Tati
    const logoTati = page.locator('#view-login .auth-logo');
    await expect(logoTati).toBeVisible();
    await expect(logoTati).toHaveAttribute('alt', 'Logo Tati Cardoso');
    
    // Verifica se as variáveis de tema foram aplicadas de acordo com as cores dela (#607361)
    const primaryColorTati = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--primary-olive').trim()
    );
    expect(primaryColorTati).toBe('#607361');

    // Acessa o subdomínio da Dra. Marina
    await page.goto(tenantMarinaURL);

    // A logo e o título devem ser adaptados dinamicamente
    const logoMarina = page.locator('#view-login .auth-logo');
    await expect(logoMarina).toBeVisible();
    await expect(logoMarina).toHaveAttribute('alt', 'Logo Marina Silva');
    
    // As cores primárias no CSS devem ser redefinidas para o Oliva/Azul da Marina (#4E5B6A)
    const primaryColorMarina = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--primary-olive').trim()
    );
    expect(primaryColorMarina).toBe('#4E5B6A');
  });

  test('2. Tentativa de Bypass via URLs Maliciosas (URL Hijacking)', async ({ page }) => {
    // 1. Faz login como Dra. Tati Cardoso (Tenant A)
    await page.goto(tenantTatiURL);
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // Simula validação do 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Confirma que carregou a Área Clínica da Dra. Tati
    await expect(page.locator('#header-title')).toHaveText('Área Clínica da Nutricionista');

    // ATACANTE TENTA SEQUESTRO DE URL:
    // A Dra. Tati tenta forçar a navegação direta para acessar o prontuário de um paciente
    // pertencente à Dra. Marina, modificando o parâmetro da URL do painel.
    const idPacienteInvasor = 'patient-carlos-marina'; // Pertence à Marina
    await page.goto(`${tenantTatiURL}/#tab-evolution?patientId=${idPacienteInvasor}`);

    // O sistema deve interceptar o roteamento do frontend e redirecionar para erro ou bloquear
    // verificando que o tenant_id do paciente na URL não coincide com o tenant_id da sessão do JWT.
    const errorMessage = page.locator('.error-overlay, #unauthorized-message');
    
    // O sistema deve exibir mensagem de erro "Acesso Negado" ou retornar à home segura
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Acesso Não Autorizado');

    // Garante que nenhuma informação pessoal ou do prontuário do Carlos foi injetada no DOM
    const bodyContent = await page.textContent('body');
    expect(bodyContent).not.toContain('Carlos Souza');
    expect(bodyContent).not.toContain('Massa Muscular');
  });

  test('3. Tentativa de Injeção e Tampering no LocalStorage (Session Hijacking)', async ({ page }) => {
    // Navega ao portal da Dra. Tati
    await page.goto(tenantTatiURL);

    // Um usuário malicioso tenta injetar manualmente dados no localStorage / SessionStorage
    // para tentar enganar a aplicação fingindo pertencer ao Tenant da Marina Silva
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          user: {
            id: 'patient-ana-tati',
            email: 'ana.silva@exemplo.com',
            user_metadata: {
              tenant_id: 'tenant-marina-2222' // Tenta forçar o tenant do outro
            }
          },
          access_token: 'JWT_TATI_VALIDO' // Mas usa um token que corresponde à Tati no backend
        }
      }));
    });

    // Recarrega a página para aplicar o estado injetado
    await page.reload();

    // Quando o frontend tentar consultar dados, o backend validará a assinatura criptográfica do JWT.
    // O tenant_id contido nos metadados alterados do localStorage não baterá com a assinatura no backend.
    // O sistema deve deslogar o usuário ou recusar o carregamento dos dados.
    const authWrapper = page.locator('#auth-wrapper');
    await expect(authWrapper).toBeVisible(); // Deve voltar para a tela de login
  });

  test('4. Teste de Vazamento de Cookies e Sessão Cross-Subdomain', async ({ context }) => {
    // 1. Faz login no subdomínio da Dra. Tati
    const pageTati = await context.newPage();
    await pageTati.goto(tenantTatiURL);
    // Realiza login
    await pageTati.click('#btn-role-paciente');
    await pageTati.fill('#login-email', 'ana.silva@exemplo.com');
    await pageTati.fill('#login-password', 'senha123');
    await pageTati.click('#view-login button[type="submit"]');
    // Digita 2FA
    await pageTati.fill('#d1', '1'); await pageTati.fill('#d2', '2'); await pageTati.fill('#d3', '3');
    await pageTati.fill('#d4', '4'); await pageTati.fill('#d5', '5'); await pageTati.fill('#d6', '6');
    await pageTati.click('#view-2fa button[type="submit"]');

    // Confirma sessão ativa no Tenant A (Ana)
    await expect(pageTati.locator('#user-profile-name')).toHaveText('Ana Paula Silva');

    // 2. Abre uma nova aba e tenta acessar o subdomínio da Dra. Marina (Tenant B)
    const pageMarina = await context.newPage();
    await pageMarina.goto(tenantMarinaURL);

    // O cookie ou sessão da Ana não deve se propagar para o subdomínio da Marina
    // O usuário no subdomínio da Marina deve ser apresentado com a tela de login vazia
    const authWrapperMarina = pageMarina.locator('#auth-wrapper');
    await expect(authWrapperMarina).toBeVisible();
    
    const userProfileMarina = pageMarina.locator('#user-profile-name');
    await expect(userProfileMarina).not.toBeVisible();
  });

});
