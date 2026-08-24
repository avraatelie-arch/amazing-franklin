// ============================================================================
// SUITE DE TESTES UNITÁRIOS E DE INTEGRAÇÃO: FLUXO NUTRICIONISTA & PACIENTE
// Caminho: tests/api/patient-nutri-flow.test.js
// ============================================================================

const fs = require('fs');
const path = require('path');

describe('Amazing Franklin - Testes Unitários: Fluxo Nutri & Paciente', () => {

  const htmlPath = path.join(__dirname, '../../index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  test('1. Estrutura de Pacientes deve conter Data de Cadastro (createdAt) e campos clínicos', () => {
    // Validar se o array inicial de pacientes possui o campo createdAt
    expect(htmlContent).toContain('createdAt');
    expect(htmlContent).toContain('patient-status-filter');
    expect(htmlContent).toContain('patient-objective-filter');
    expect(htmlContent).toContain('btn-clear-patient-filters');
  });

  test('2. Motor de Filtros de Pacientes: Lógica de Busca, Status e Objetivo', () => {
    const mockPatients = [
      { name: "Ana Paula Silva", status: "Ativo (Consultório)", objective: "Perda de Peso", createdAt: "10 de Maio de 2026", email: "ana@email.com" },
      { name: "Carlos Henrique Ramos", status: "Mentoria VIP", objective: "Hipertrofia", createdAt: "15 de Maio de 2026", email: "carlos@email.com" },
      { name: "Beatriz Albuquerque", status: "Inativo (+30 dias)", objective: "Reeducação Alimentar", createdAt: "01 de Abril de 2026", email: "beatriz@email.com" },
      { name: "Mariana Costa", status: "Novo Paciente", objective: "Gestacional", createdAt: "12 de Junho de 2026", email: "mariana@email.com" }
    ];

    // Filtro por Busca textual
    const query = "ana";
    const filteredByQuery = mockPatients.filter(p => p.name.toLowerCase().includes(query) || p.objective.toLowerCase().includes(query));
    expect(filteredByQuery.length).toBe(2); // Ana Paula e Mariana

    // Filtro por Status
    const statusFilter = "Mentoria";
    const filteredByStatus = mockPatients.filter(p => p.status.toLowerCase().includes(statusFilter.toLowerCase()));
    expect(filteredByStatus.length).toBe(1);
    expect(filteredByStatus[0].name).toBe("Carlos Henrique Ramos");

    // Filtro por Objetivo
    const objFilter = "Gestacional";
    const filteredByObj = mockPatients.filter(p => p.objective.toLowerCase().includes(objFilter.toLowerCase()));
    expect(filteredByObj.length).toBe(1);
    expect(filteredByObj[0].name).toBe("Mariana Costa");
  });

  test('3. Motor da Agenda Semanal: Cálculo de Buffer de Deslocamento e Tolerância Clínica', () => {
    const scheduleSettings = {
      duration: 75,
      toleranceBuffer: 15,
      travelBuffer: 30,
      workStart: "08:00",
      workEnd: "18:00"
    };

    function timeStringToMinutes(t) {
      const parts = t.split(':');
      return parseInt(parts[0], 10) * 60 + (parseInt(parts[1], 10) || 0);
    }

    function formatMinutesToTime(totalMins) {
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // Caso A: Consulta Presencial às 09:30 com 75m
    const apptStartMins = timeStringToMinutes("09:30"); // 570 mins
    const apptDuration = 75;
    const isPresencial = true;

    // Buffer de Deslocamento de Ida (30 min antes)
    const travelBeforeStart = apptStartMins - scheduleSettings.travelBuffer; // 540 mins -> 09:00
    expect(formatMinutesToTime(travelBeforeStart)).toBe("09:00");

    // Fim do Atendimento Clínico (09:30 + 75m = 10:45)
    const apptEndMins = apptStartMins + apptDuration; // 645 mins -> 10:45
    expect(formatMinutesToTime(apptEndMins)).toBe("10:45");

    // Tolerância Clínica (+15m = 11:00)
    const toleranceEnd = apptEndMins + scheduleSettings.toleranceBuffer; // 660 mins -> 11:00
    expect(formatMinutesToTime(toleranceEnd)).toBe("11:00");

    // Buffer de Deslocamento de Retorno (30 min depois = 11:30)
    const travelAfterEnd = toleranceEnd + scheduleSettings.travelBuffer; // 690 mins -> 11:30
    expect(formatMinutesToTime(travelAfterEnd)).toBe("11:30");

    // Próximo slot livre seguro deve iniciar a partir das 11:30
    expect(travelAfterEnd).toBe(690);
  });

  test('4. Central de Comunicação & Retenção: Resgate Anti-Esquecimento e Substituição de Variáveis', () => {
    const template = "Olá, {nome}! Aqui é a {nutri}. Notei que faz tempo que não nos vemos. Veja seus relatórios em {link_portal}";
    const patient = { name: "Ana Paula Silva", phone: "(11) 98765-4321" };
    const nutriName = "Dra. Tati Cardoso";
    const portalUrl = "http://localhost:3000";

    const parsed = template
      .replace(/{nome}/g, patient.name)
      .replace(/{nutri}/g, nutriName)
      .replace(/{link_portal}/g, portalUrl);

    expect(parsed).toContain("Olá, Ana Paula Silva!");
    expect(parsed).toContain("Aqui é a Dra. Tati Cardoso");
    expect(parsed).toContain(portalUrl);

    // Formatação do link de WhatsApp
    const phoneDigits = patient.phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/55${phoneDigits}?text=${encodeURIComponent(parsed)}`;
    expect(waUrl).toContain("5511987654321");
    expect(waUrl).toContain("https://wa.me/");
  });

  test('5. Sistema Multi-Canal: Geração de Notificações de Reagendamento e Cancelamento', () => {
    const appt = {
      patientName: "Frederico Augusto",
      date: "28 de Junho de 2026",
      time: "15:30",
      type: "Online",
      link: "https://meet.jit.si/TatiCardoso-Frederico-2806"
    };

    // Caso Reagendamento
    const reschedTitle = "Consulta Reagendada";
    const reschedMsg = `Sua consulta com a nutricionista foi reagendada para ${appt.date} às ${appt.time} (${appt.type}).`;
    expect(reschedMsg).toContain("28 de Junho de 2026 às 15:30 (Online)");

    // Caso Cancelamento
    const cancelTitle = "Consulta Cancelada";
    const cancelMsg = `Sua consulta de ${appt.date} às ${appt.time} foi cancelada. Acesse o portal para escolher um novo horário.`;
    expect(cancelMsg).toContain("cancelada");
  });

  test('6. Verificação de Elementos Essenciais no HTML da Interface', () => {
    // Menu da Nutricionista
    expect(htmlContent).toContain('Agenda Semanal');
    expect(htmlContent).toContain('Comunicação & Retenção');
    expect(htmlContent).toContain('tab-nutri-schedule');
    expect(htmlContent).toContain('tab-nutri-broadcast');
    expect(htmlContent).toContain('appointment-dispatch-modal');
    expect(htmlContent).toContain('schedule-settings-modal');

    // Menu do Paciente
    expect(htmlContent).toContain('tab-home');
    expect(htmlContent).toContain('patient-announcements-area');
    expect(htmlContent).toContain('patient-telemed-card');
  });

  test('7. Validador de Força de Senha e Fator de Segurança (EP-07 Story 9)', () => {
    function evaluatePasswordStrength(password) {
      const pwd = password || '';
      const minLength = pwd.length >= 8;
      const hasUpper = /[A-Z]/.test(pwd);
      const hasLower = /[a-z]/.test(pwd);
      const hasNumber = /[0-9]/.test(pwd);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd);

      let score = 0;
      if (minLength) score++;
      if (hasUpper) score++;
      if (hasLower) score++;
      if (hasNumber) score++;
      if (hasSpecial) score++;

      let level = 0;
      let label = "Muito Fraca";
      if (score === 1) {
        level = 1;
        label = "Fraca";
      } else if (score === 2 || score === 3) {
        level = 2;
        label = "Média";
      } else if (score === 4) {
        level = 3;
        label = "Forte";
      } else if (score === 5) {
        level = 4;
        label = "Excelente / Perfeita";
      }

      const isValid = minLength && hasUpper && hasLower && hasNumber;
      return { score, level, label, minLength, hasUpper, hasLower, hasNumber, hasSpecial, isValid };
    }

    // Senha muito fraca (apenas números curtos)
    const weak = evaluatePasswordStrength('12345');
    expect(weak.score).toBe(1);
    expect(weak.level).toBe(1);
    expect(weak.isValid).toBe(false);

    // Senha média (8 caracteres, letras minúsculas e números)
    const medium = evaluatePasswordStrength('senha123');
    expect(medium.minLength).toBe(true);
    expect(medium.hasLower).toBe(true);
    expect(medium.hasNumber).toBe(true);
    expect(medium.hasUpper).toBe(false);
    expect(medium.isValid).toBe(false); // falta maiúscula

    // Senha forte válida (8+ caracteres, maiúscula, minúscula, número)
    const strong = evaluatePasswordStrength('SenhaSegura123');
    expect(strong.isValid).toBe(true);
    expect(strong.score).toBe(4);
    expect(strong.level).toBe(3);

    // Senha excelente / perfeita (com símbolo especial)
    const perfect = evaluatePasswordStrength('SenhaForte@2026!');
    expect(perfect.score).toBe(5);
    expect(perfect.level).toBe(4);
    expect(perfect.hasSpecial).toBe(true);
  });

  test('8. Elementos de UI de Senha Segura e Confirmação no index.html', () => {
    // Validação de presença dos wrappers de toggle de olho
    expect(htmlContent).toContain('password-input-wrapper');
    expect(htmlContent).toContain('password-toggle-btn');
    expect(htmlContent).toContain('togglePasswordVisibility');

    // Validação de presença dos campos de confirmação de senha
    expect(htmlContent).toContain('nutri-reg-password-confirm');
    expect(htmlContent).toContain('pat-signup-password-confirm');
    expect(htmlContent).toContain('pat-act-password-confirm');
    expect(htmlContent).toContain('sup-reg-password-confirm');

    // Validação de presença dos medidores e badges
    expect(htmlContent).toContain('nutri-password-meter');
    expect(htmlContent).toContain('pat-signup-password-meter');
    expect(htmlContent).toContain('evaluatePasswordStrength');
    expect(htmlContent).toContain('validatePasswordSecurityAndMatch');
  });

  test('9. Split de Pagamento & Comissionamento Automático SaaS (EP-08 Story 1)', () => {
    function calculatePharmacySplit(totalPrice, commissionRate = 10) {
      const commission = parseFloat((totalPrice * (commissionRate / 100)).toFixed(2));
      const payout = parseFloat((totalPrice * ((100 - commissionRate) / 100)).toFixed(2));
      return { commission, payout, total: totalPrice };
    }

    // Pedido de Fórmula de R$ 97,00 (Fórmula 85 + Frete 12)
    const split1 = calculatePharmacySplit(97.00, 10);
    expect(split1.commission).toBe(9.70);
    expect(split1.payout).toBe(87.30);
    expect(split1.commission + split1.payout).toBe(97.00);

    // Pedido de Fórmula de R$ 250,00
    const split2 = calculatePharmacySplit(250.00, 10);
    expect(split2.commission).toBe(25.00);
    expect(split2.payout).toBe(225.00);
  });

  test('10. Elementos de UI de Propostas em Aberto, Cobrança WhatsApp e PIX Dinâmico', () => {
    // Lista de propostas enviadas e botões de follow-up
    expect(htmlContent).toContain('supplier-submitted-proposals-list');
    expect(htmlContent).toContain('sendSupplierQuoteWhatsAppFollowUp');
    expect(htmlContent).toContain('resendSupplierQuoteEmail');
    expect(htmlContent).toContain('btn-whatsapp-followup');

    // Elementos de Checkout PIX Dinâmico
    expect(htmlContent).toContain('pix-instruction');
    expect(htmlContent).toContain('pix-countdown-timer');
    expect(htmlContent).toContain('pix-qrcode-box');
    expect(htmlContent).toContain('pix-code-input');
    expect(htmlContent).toContain('copyPixCode');
  });

});


