// ============================================================================
// SUITE DE TESTES UNITÁRIOS E INTEGRAÇÃO DE API: SEGURANÇA E ISOLAMENTO DE ROTAS
// Caminho: tests/api/tenant-isolation.test.js
// ============================================================================
// Objetivo: Validar que os endpoints de API (REST/GraphQL) bloqueiam qualquer
// requisição cruzada que tente ler, alterar ou injetar dados de outro Tenant.
// ============================================================================

const request = require('supertest');
const express = require('express');

// MOCK DA CONFIGURAÇÃO DO EXPRESS E MIDDLEWARES
// Isso simula a estrutura real do nosso backend quando for migrado para Node.js/Next.js
const app = express();
app.use(express.json());

// Mock de dados e tenants no banco de dados para os testes
const mockTenants = {
  'tati-cardoso': { id: 'tenant-tati-1111', name: 'Dra. Tati Cardoso', primaryColor: '#607361' },
  'marina-silva': { id: 'tenant-marina-2222', name: 'Dra. Marina Silva', primaryColor: '#4E5B6A' }
};

const mockPatients = {
  'patient-ana-tati': { id: 'patient-ana-tati', tenantId: 'tenant-tati-1111', name: 'Ana Paula Silva' },
  'patient-carlos-marina': { id: 'patient-carlos-marina', tenantId: 'tenant-marina-2222', name: 'Carlos Souza' }
};

// MIDDLEWARE DE AUTENTICAÇÃO E CONTEXTO DE TENANT (MOCK)
// Decodifica o JWT do Supabase, valida a sessão e injeta o tenant_id no request
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token de autenticação não fornecido' });

  // Simulação de decodificação JWT do Supabase
  if (token === 'JWT_TATI_VALIDO') {
    req.user = { id: 'user-tati-admin', tenantId: 'tenant-tati-1111', role: 'nutricionista' };
  } else if (token === 'JWT_ANA_VALIDO') {
    req.user = { id: 'patient-ana-tati', tenantId: 'tenant-tati-1111', role: 'paciente' };
  } else if (token === 'JWT_MARINA_VALIDO') {
    req.user = { id: 'user-marina-admin', tenantId: 'tenant-marina-2222', role: 'nutricionista' };
  } else if (token === 'JWT_CARLOS_VALIDO') {
    req.user = { id: 'patient-carlos-marina', tenantId: 'tenant-marina-2222', role: 'paciente' };
  } else {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
  next();
}

// DEFINIÇÃO DAS ROTAS DE API TESTADAS
// 1. Rota de dados de customização de marca (White-Label pública)
app.get('/api/tenant/branding', (req, res) => {
  const subdomain = req.query.subdomain;
  const tenant = mockTenants[subdomain];
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant não encontrado para este subdomínio' });
  }
  res.json({
    business_name: tenant.name,
    primary_color: tenant.primaryColor,
    secondary_color: '#A3835B'
  });
});

// 2. Rota para obter ficha do paciente (Requer autenticação e isolamento)
app.get('/api/patients/:id', authenticateToken, (req, res) => {
  const patientId = req.params.id;
  const patient = mockPatients[patientId];

  if (!patient) {
    return res.status(404).json({ error: 'Paciente não encontrado' });
  }

  // REGRA DE OURO DE ISOLAMENTO: O tenant_id do paciente deve coincidir com o tenant_id do usuário logado
  if (patient.tenantId !== req.user.tenantId) {
    // Retornamos 404 (para não expor a existência do ID) ou 403 (Acesso Proibido)
    return res.status(403).json({ error: 'Acesso negado: Isolamento de dados violado!' });
  }

  res.json(patient);
});

// 3. Rota para cadastrar novo paciente (Injeção de Tenant Protegida)
app.post('/api/patients', authenticateToken, (req, res) => {
  if (req.user.role !== 'nutricionista') {
    return res.status(403).json({ error: 'Apenas nutricionistas podem cadastrar pacientes' });
  }

  // TENTATIVA DE EXPLOIT: O atacante tenta enviar um tenant_id diferente no corpo
  // O sistema deve ignorar o body.tenant_id e forçar o req.user.tenantId decodificado do JWT
  const newPatient = {
    id: `patient-${Math.random().toString(36).substr(2, 9)}`,
    tenantId: req.user.tenantId, // FORÇADO PELO JWT, IGNORA BODY
    name: req.body.name,
    email: req.body.email
  };

  res.status(201).json(newPatient);
});

// 4. Rota para paciente enviar exame
const mockExams = {
  'exam-1': { id: 'exam-1', tenantId: 'tenant-tati-1111', patientId: 'patient-ana-tati', title: 'Exame de Sangue', fileUrl: 'http://storage/exame1.pdf', status: 'pending', notes: '' }
};

app.post('/api/exams', authenticateToken, (req, res) => {
  if (req.user.role !== 'paciente') {
    return res.status(403).json({ error: 'Apenas pacientes podem fazer upload de exames' });
  }
  const newExam = {
    id: `exam-${Math.random().toString(36).substr(2, 9)}`,
    tenantId: req.user.tenantId,
    patientId: req.user.id,
    title: req.body.title,
    fileUrl: req.body.fileUrl,
    status: 'pending',
    notes: ''
  };
  mockExams[newExam.id] = newExam;
  res.status(201).json(newExam);
});

// 5. Rota para nutricionista analisar exame
app.put('/api/exams/:id/analyze', authenticateToken, (req, res) => {
  if (req.user.role !== 'nutricionista') {
    return res.status(403).json({ error: 'Apenas nutricionistas podem analisar exames' });
  }
  const exam = mockExams[req.params.id];
  if (!exam) {
    return res.status(404).json({ error: 'Exame não encontrado' });
  }
  if (exam.tenantId !== req.user.tenantId) {
    return res.status(403).json({ error: 'Acesso negado: Isolamento de dados violado!' });
  }
  exam.status = 'analyzed';
  exam.notes = req.body.notes;
  res.json(exam);
});

// ============================================================================
// SUITE JEST DE TESTES DE SEGURANÇA
// ============================================================================
describe('Suíte de Segurança API - Multi-Tenant Data Leakage Prevention', () => {

  describe('1. Dynamic Branding (White-Label Setup)', () => {
    it('Deve carregar as cores e a identidade da Dra. Tati quando acessada pelo subdomínio correspondente', async () => {
      const response = await request(app)
        .get('/api/tenant/branding?subdomain=tati-cardoso');
      
      expect(response.statusCode).toBe(200);
      expect(response.body.business_name).toBe('Dra. Tati Cardoso');
      expect(response.body.primary_color).toBe('#607361');
    });

    it('Deve carregar a identidade da Dra. Marina quando acessada pelo subdomínio dela', async () => {
      const response = await request(app)
        .get('/api/tenant/branding?subdomain=marina-silva');
      
      expect(response.statusCode).toBe(200);
      expect(response.body.business_name).toBe('Dra. Marina Silva');
      expect(response.body.primary_color).toBe('#4E5B6A');
    });

    it('Deve retornar 404 para subdomínios não cadastrados', async () => {
      const response = await request(app)
        .get('/api/tenant/branding?subdomain=subdominio-invasor');
      
      expect(response.statusCode).toBe(404);
    });
  });

  describe('2. Isolamento de Prontuários e Fichas de Pacientes', () => {
    it('Deve autorizar o acesso da Dra. Tati ao prontuário do seu próprio paciente', async () => {
      const response = await request(app)
        .get('/api/patients/patient-ana-tati')
        .set('Authorization', 'Bearer JWT_TATI_VALIDO');
      
      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Ana Paula Silva');
    });

    it('Deve bloquear terminantemente a Dra. Marina de acessar o prontuário do paciente da Dra. Tati', async () => {
      const response = await request(app)
        .get('/api/patients/patient-ana-tati') // Paciente da Dra. Tati
        .set('Authorization', 'Bearer JWT_MARINA_VALIDO'); // Token da Dra. Marina
      
      expect(response.statusCode).toBe(403);
      expect(response.body.error).toContain('Acesso negado: Isolamento de dados violado!');
      expect(response.body.name).toBeUndefined(); // Garante que nenhum dado vazou
    });

    it('Deve bloquear paciente do Tenant A (Ana) de consultar dados do paciente do Tenant B (Carlos)', async () => {
      const response = await request(app)
        .get('/api/patients/patient-carlos-marina')
        .set('Authorization', 'Bearer JWT_ANA_VALIDO');
      
      expect(response.statusCode).toBe(403);
    });

    it('Deve rejeitar qualquer requisição sem cabeçalhos de autenticação', async () => {
      const response = await request(app)
        .get('/api/patients/patient-ana-tati');
      
      expect(response.statusCode).toBe(401);
    });
  });

  describe('3. Prevenção de Injeção de Dados e Override de Tenant', () => {
    it('Deve ignorar o tenant_id enviado no corpo da requisição e forçar o tenant_id associado ao JWT do usuário', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', 'Bearer JWT_TATI_VALIDO')
        .send({
          name: 'Paciente Infiltrado',
          email: 'infiltrado@exemplo.com',
          tenantId: 'tenant-marina-2222' // Ataque: Tentativa de injetar paciente dentro do Tenant B (Marina)
        });
      
      expect(response.statusCode).toBe(201);
      // O tenantId gravado deve ser o do usuário autenticado (Tati), ignorando a tentativa de injeção
      expect(response.body.tenantId).toBe('tenant-tati-1111');
      expect(response.body.tenantId).not.toBe('tenant-marina-2222');
    });
  });

  describe('4. Envio e Análise de Exames Clínicos', () => {
    it('Deve autorizar o paciente a fazer upload de um exame sob o seu tenant', async () => {
      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', 'Bearer JWT_ANA_VALIDO')
        .send({
          title: 'Hemograma Completo',
          fileUrl: 'http://storage/hemograma.pdf'
        });
      
      expect(response.statusCode).toBe(201);
      expect(response.body.tenantId).toBe('tenant-tati-1111');
      expect(response.body.patientId).toBe('patient-ana-tati');
      expect(response.body.status).toBe('pending');
    });

    it('Deve permitir que a nutricionista de mesmo tenant analise o exame e insira notas', async () => {
      const response = await request(app)
        .put('/api/exams/exam-1/analyze')
        .set('Authorization', 'Bearer JWT_TATI_VALIDO')
        .send({
          notes: 'Valores normais de ferritina e glicose.'
        });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('analyzed');
      expect(response.body.notes).toBe('Valores normais de ferritina e glicose.');
    });

    it('Deve barrar nutricionista de outro tenant de tentar analisar o exame', async () => {
      const response = await request(app)
        .put('/api/exams/exam-1/analyze')
        .set('Authorization', 'Bearer JWT_MARINA_VALIDO')
        .send({
          notes: 'Acesso malicioso.'
        });
      
      expect(response.statusCode).toBe(403);
    });
  });

});
