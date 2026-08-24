// ============================================================================
// SUITE DE TESTES E2E: ESTADO ZERADO (EMPTY STATE), AVALIAÇÃO UBER & RANKING NUTRIS
// Caminho: tests/e2e/patient-empty-state-and-ranking.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Amazing Franklin - Empty State do Paciente, Avaliação 1-5 Estrelas & Ranking', () => {

  const baseURL = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('1. Cadastro do Zero: Visualização Inicial Limpa e Zerada (Empty State Completo)', async ({ page }) => {
    // Clica no link "Criar Nova Conta (Cadastro do Zero)"
    await page.click('a[onclick*="view-patient-signup"]');
    await expect(page.locator('#view-patient-signup')).toBeVisible();

    // Preenche formulário de auto-cadastro do paciente
    await page.fill('#pat-signup-name', 'Fernando Augusto Moreira');
    await page.fill('#pat-signup-phone', '(11) 98765-4321');
    await page.fill('#pat-signup-email', 'fernando.moreira@teste.com');
    await page.fill('#pat-signup-password', 'SenhaSegura@2026');
    await page.fill('#pat-signup-password-confirm', 'SenhaSegura@2026');
    await page.fill('#pat-signup-cep', '01311-200');
    await page.fill('#pat-signup-city', 'São Paulo');
    await page.selectOption('#pat-signup-state', 'SP');

    // Submete cadastro
    await page.click('#view-patient-signup button[type="submit"]');

    // Retorna para view de login
    await expect(page.locator('#view-login')).toBeVisible();

    // Realiza login com o novo paciente
    await page.fill('#login-email', 'fernando.moreira@teste.com');
    await page.fill('#login-password', 'SenhaSegura@2026');
    await page.click('#view-login button[type="submit"]');

    // 2FA View
    await expect(page.locator('#view-2fa')).toBeVisible();
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Valida entrada no app container
    await expect(page.locator('#app-container')).toBeVisible();

    // 1. Valida saudação com o primeiro nome real do paciente
    const heroTitle = page.locator('#patient-welcome-title');
    await expect(heroTitle).toContainText('Olá, Fernando!');

    // 2. Valida que os 4 KPIs estão limpos / zerados
    const kpiPeso = page.locator('#kpi-val-peso');
    const kpiSubPeso = page.locator('#kpi-sub-peso');
    const kpiGordura = page.locator('#kpi-val-gordura');
    const kpiMassa = page.locator('#kpi-val-massa');
    const kpiDiet = page.locator('#kpi-val-diet');

    await expect(kpiPeso).toHaveText('-- kg');
    await expect(kpiSubPeso).toContainText('Aguardando 1ª Bioimpedância');
    await expect(kpiGordura).toHaveText('--%');
    await expect(kpiMassa).toHaveText('-- kg');
    await expect(kpiDiet).toContainText('Nenhum plano prescrito');

    // 3. Valida que na aba de Evolução Física, o gráfico e a timeline mostram mensagens acolhedoras de espera
    await page.click('a.nav-item[onclick*="tab-evolution"]');
    await expect(page.locator('#tab-evolution')).toBeVisible();

    const chartSvg = page.locator('#chart-svg-elem');
    await expect(chartSvg).toContainText('Gráfico Aguardando 1ª Bioimpedância');

    const timeline = page.locator('#patient-clinical-timeline');
    await expect(timeline).toContainText('Nenhum parecer clínico registrado ainda');

    // 4. Valida Área de Mentoria em branco para paciente sem mentoria/vínculo
    await page.click('a.nav-item[onclick*="tab-mentoring"]');
    await expect(page.locator('#tab-mentoring')).toBeVisible();
    await expect(page.locator('#patient-mentoring-container')).toContainText('Nenhuma Mentoria Ativa');

    // 5. Valida E-books & Receitas (Apenas o que comprou; nada mockado se não comprou)
    await page.click('a.nav-item[onclick*="tab-ebooks"]');
    await expect(page.locator('#tab-ebooks')).toBeVisible();
    await expect(page.locator('#ebooks-purchased-grid')).toContainText('Nenhum e-book ou receita adquirida ainda');

    // 6. Valida Suporte & Dúvidas bloqueado para paciente sem nutricionista
    await page.click('a.nav-item[onclick*="tab-chat"]');
    await expect(page.locator('#tab-chat')).toBeVisible();
    await expect(page.locator('#chat-messages-container')).toContainText('Canal de Suporte Bloqueado');

    // 7. Valida Agendar Consulta bloqueado se não tiver nutricionista vinculada
    await page.click('a.nav-item[onclick*="tab-booking"]');
    await expect(page.locator('#tab-booking')).toBeVisible();
    await expect(page.locator('#patient-booking-container')).toContainText('Vínculo com Nutricionista Necessário');

    // 8. Valida Meus Relatórios zerado
    await page.click('a.nav-item[onclick*="tab-patient-reports"]');
    await expect(page.locator('#tab-patient-reports')).toBeVisible();
    await expect(page.locator('#report-patient-weight-diff')).toHaveText('-- kg → -- kg');
    await expect(page.locator('#patient-downloads-container')).toContainText('Nenhum laudo ou relatório emitido ainda');
  });

  test('2. Usuário Livre: Banner de Escolha no Ranking e Filtros de Especialidade', async ({ page }) => {
    // Cadastra e loga
    await page.click('a[onclick*="view-patient-signup"]');
    await page.fill('#pat-signup-name', 'Luciana Peixoto');
    await page.fill('#pat-signup-phone', '(11) 97777-1111');
    await page.fill('#pat-signup-email', 'luciana.peixoto@teste.com');
    await page.fill('#pat-signup-password', 'SenhaForte#2026');
    await page.fill('#pat-signup-password-confirm', 'SenhaForte#2026');
    await page.fill('#pat-signup-cep', '01311-200');
    await page.fill('#pat-signup-city', 'São Paulo');
    await page.selectOption('#pat-signup-state', 'SP');
    await page.click('#view-patient-signup button[type="submit"]');

    await page.fill('#login-email', 'luciana.peixoto@teste.com');
    await page.fill('#login-password', 'SenhaForte#2026');
    await page.click('#view-login button[type="submit"]');

    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // Valida banner de escolha de Nutricionista para usuário livre destacando Dra. Tatiane Cardoso
    const nutriCard = page.locator('#patient-about-nutri-card');
    await expect(nutriCard).toContainText('Dra. Tatiane Cardoso');
    await expect(nutriCard).toContainText('Nutricionista Principal • Recomendada');

    // Clica no botão "Ver Ranking de Nutricionistas & Agendar"
    await nutriCard.locator('button[onclick*="openNutriRankingModal"]').click();

    // Valida abertura do modal de ranking
    const rankingModal = page.locator('#modal-nutri-ranking');
    await expect(rankingModal).toBeVisible();
    await expect(rankingModal).toContainText('Ranking de Nutricionistas da Plataforma');

    // Valida presença de cards ranqueados com estrelas e reviews
    const cardsContainer = rankingModal.locator('#nutri-ranking-cards-container');
    await expect(cardsContainer).toContainText('Top Avaliada');
    await expect(cardsContainer).toContainText('Dra. Tati Cardoso');
    await expect(cardsContainer).toContainText('Dra. Marina Silva');

    // Testa filtro de especialidade
    await rankingModal.locator('button', { hasText: 'Nutrição Esportiva' }).click();
    await expect(cardsContainer).toContainText('Nutrição Clínica e Esportiva');

    // Fecha modal
    await rankingModal.locator('button[onclick*="closeNutriRankingModal"]').click();
    await expect(rankingModal).not.toHaveClass(/active/);
  });

  test('3. Escolha de Nutricionista no Ranking e Vinculação Automática com Agendamento', async ({ page }) => {
    // Cadastra e loga
    await page.click('a[onclick*="view-patient-signup"]');
    await page.fill('#pat-signup-name', 'Renato Castilho');
    await page.fill('#pat-signup-phone', '(11) 96666-2222');
    await page.fill('#pat-signup-email', 'renato.castilho@teste.com');
    await page.fill('#pat-signup-password', 'SenhaForte#2026');
    await page.fill('#pat-signup-password-confirm', 'SenhaForte#2026');
    await page.fill('#pat-signup-cep', '01311-200');
    await page.fill('#pat-signup-city', 'São Paulo');
    await page.selectOption('#pat-signup-state', 'SP');
    await page.click('#view-patient-signup button[type="submit"]');

    await page.fill('#login-email', 'renato.castilho@teste.com');
    await page.fill('#login-password', 'SenhaForte#2026');
    await page.click('#view-login button[type="submit"]');

    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    // Abre ranking
    await page.click('#patient-about-nutri-card button[onclick*="openNutriRankingModal"]');
    const rankingModal = page.locator('#modal-nutri-ranking');
    await expect(rankingModal).toBeVisible();

    // Escolhe a Dra. Tati Cardoso
    const tatiCard = rankingModal.locator('.nutri-ranking-card', { hasText: 'Dra. Tati Cardoso' });
    await tatiCard.locator('button', { hasText: 'Escolher & Agendar' }).first().click();

    // Valida fechamento do modal e redirecionamento para agendamento
    await expect(rankingModal).not.toHaveClass(/active/);
    await expect(page.locator('#tab-booking')).toBeVisible();

    // Retorna para a página inicial e valida que agora o card da Dra. Tati está dedicado e vinculado
    await page.click('a.nav-item[onclick*="tab-home"]');
    const aboutNutriCard = page.locator('#patient-about-nutri-card');
    await expect(aboutNutriCard).toContainText('Sua Nutricionista Responsável');
    await expect(aboutNutriCard).toContainText('Dra. Tati Cardoso');
    await expect(aboutNutriCard).toContainText('Avaliar Atendimento ⭐');
  });

  test('4. Avaliação Pós-Consulta Estilo Uber (1 a 5 Estrelas, Tags e Depoimento)', async ({ page }) => {
    // Injeta paciente vinculado e faz login
    await page.evaluate(() => {
      let list = JSON.parse(localStorage.getItem('amazing_franklin_patients_list') || '[]');
      list.unshift({
        id: 'pat-aval-1',
        name: 'Camila Fernandes',
        email: 'camila.fernandes@teste.com',
        password: 'senhaSegura123',
        phone: '(11) 98888-3333',
        status: 'Ativo',
        lastConsult: '10 de Julho de 2026',
        objective: 'Emagrecimento',
        nutriEmail: 'tati@cardoso.com',
        history: [{
          date: '10 de Julho de 2026',
          weight: 65.0,
          bodyFat: 20.0,
          muscleMass: 26.0,
          waterPct: 55.0,
          diet: 'Dieta Equilibrada'
        }]
      });
      localStorage.setItem('amazing_franklin_patients_list', JSON.stringify(list));
    });

    await page.fill('#login-email', 'camila.fernandes@teste.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // Clica no botão "Avaliar Atendimento ⭐" no card da nutricionista
    const aboutNutriCard = page.locator('#patient-about-nutri-card');
    await aboutNutriCard.locator('button', { hasText: 'Avaliar Atendimento' }).click();

    // Valida abertura do modal de avaliação estilo Uber
    const rateModal = page.locator('#modal-rate-nutri');
    await expect(rateModal).toBeVisible();
    await expect(rateModal.locator('#rate-nutri-name')).toContainText('Dra. Tati Cardoso');

    // Clica na 5ª estrela
    await rateModal.locator('.rate-star-interactive').nth(4).click();
    await expect(rateModal.locator('#rate-nutri-label')).toContainText('Excelente! (5 estrelas)');

    // Clica nas tags de elogio
    await rateModal.locator('.review-tag-chip', { hasText: 'Muito Atenciosa' }).click();
    await rateModal.locator('.review-tag-chip', { hasText: 'Plano Fácil de Seguir' }).click();

    // Preenche depoimento
    await rateModal.locator('#rate-nutri-comment').fill('A Dra. Tati é fantástica! A consulta superou minhas expectativas.');

    // Envia avaliação
    await rateModal.locator('button', { hasText: 'Enviar Avaliação' }).click();

    // Valida fechamento do modal
    await expect(rateModal).not.toHaveClass(/active/);

    // Valida que o card da nutricionista permanece atualizado com estrelas e contagem
    await expect(aboutNutriCard).toContainText('5.0');
  });

});
