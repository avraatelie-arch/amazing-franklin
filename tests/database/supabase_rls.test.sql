-- ============================================================================
-- SUITE DE TESTES pgTAP: SEGURANÇA E ISOLAMENTO DE DADOS MULTI-TENANT (RLS)
-- Caminho: tests/database/supabase_rls.test.sql
-- ============================================================================
-- Objetivo: Garantir que a segurança no nível de banco de dados (Row-Level Security)
-- está ativa, configurada e bloqueando 100% de qualquer vazamento de dados entre inquilinos.
-- ============================================================================

BEGIN;

-- Planeja o número de asserções executadas nesta suíte de testes
SELECT plan(22);

-- 1. VERIFICAÇÃO DE POLÍTICA DE SEGURANÇA ATIVA (RLS)
-- Certifica que o Row Level Security está ativado em todas as tabelas críticas
SELECT has_rls('tenants', 'RLS deve estar habilitada na tabela tenants');
SELECT has_rls('users', 'RLS deve estar habilitada na tabela users');
SELECT has_rls('clinical_protocol_templates', 'RLS deve estar habilitada na tabela clinical_protocol_templates');
SELECT has_rls('patient_consultations', 'RLS deve estar habilitada na tabela patient_consultations');
SELECT has_rls('products', 'RLS deve estar habilitada na tabela products');
SELECT has_rls('orders', 'RLS deve estar habilitada na tabela orders');
SELECT has_rls('appointments', 'RLS deve estar habilitada na tabela appointments');
SELECT has_rls('body_scans', 'RLS deve estar habilitada na tabela body_scans');
SELECT has_rls('audit_logs', 'RLS deve estar habilitada na tabela audit_logs');
SELECT has_rls('patient_exams', 'RLS deve estar habilitada na tabela patient_exams');

-- 2. CRIAÇÃO DE DADOS DE TESTE (CENÁRIO COM DOIS TENANTS DIFERENTES)
-- Tenant A: Dra. Tati Cardoso
-- Tenant B: Dra. Marina Silva
DECLARE
    tenant_tati_id UUID := '11111111-1111-1111-1111-111111111111';
    tenant_marina_id UUID := '22222222-2222-2222-2222-222222222222';
    
    paciente_tati_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    paciente_marina_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
BEGIN
    -- Limpa registros existentes no ambiente de testes sandbox
    DELETE FROM audit_logs;
    DELETE FROM patient_exams;
    DELETE FROM body_scans;
    DELETE FROM appointments;
    DELETE FROM users;
    DELETE FROM tenants;

    -- Inserir os dois Tenants
    INSERT INTO tenants (id, business_name, subdomain, primary_color, secondary_color)
    VALUES (tenant_tati_id, 'Dra. Tati Cardoso', 'taticardoso', '#607361', '#A3835B');

    INSERT INTO tenants (id, business_name, subdomain, primary_color, secondary_color)
    VALUES (tenant_marina_id, 'Dra. Marina Silva', 'marinasilva', '#4E5B6A', '#C5A982');

    -- Inserir os Pacientes correspondentes a cada Tenant
    -- IMPORTANTE: Para contornar restrições de RLS ao popular a base de teste, 
    -- o superusuário de banco (postgres/db owner) executa estas inserções de seeding.
    INSERT INTO users (id, tenant_id, email, full_name, role)
    VALUES (paciente_tati_id, tenant_tati_id, 'ana.silva@exemplo.com', 'Ana Paula Silva (Tati)', 'paciente');

    INSERT INTO users (id, tenant_id, email, full_name, role)
    VALUES (paciente_marina_id, tenant_marina_id, 'carlos.souza@exemplo.com', 'Carlos Souza (Marina)', 'paciente');

    -- Inserir registros de Bioimpedância (body_scans)
    INSERT INTO body_scans (id, tenant_id, patient_id, scan_date, weight, body_fat, muscle_mass)
    VALUES ('a1a1a1a1-1111-1111-1111-111111111111', tenant_tati_id, paciente_tati_id, '2026-06-19', 68.5, 22.4, 28.9);

    INSERT INTO body_scans (id, tenant_id, patient_id, scan_date, weight, body_fat, muscle_mass)
    VALUES ('b2b2b2b2-2222-2222-2222-222222222222', tenant_marina_id, paciente_marina_id, '2026-06-19', 82.1, 18.2, 36.4);

    -- Inserir registros de Exames (patient_exams)
    INSERT INTO patient_exams (id, tenant_id, patient_id, title, file_url, status)
    VALUES ('c1c1c1c1-1111-1111-1111-111111111111', tenant_tati_id, paciente_tati_id, 'Exame Sangue Tenant A', 'http://storage/exameA.pdf', 'pending');

    INSERT INTO patient_exams (id, tenant_id, patient_id, title, file_url, status)
    VALUES ('d2d2d2d2-2222-2222-2222-222222222222', tenant_marina_id, paciente_marina_id, 'Exame Sangue Tenant B', 'http://storage/exameB.pdf', 'pending');
END;

-- ============================================================================
-- 3. EXECUÇÃO DOS CASOS DE TESTE DE ISOLAMENTO
-- ============================================================================

-- CASO 1: Simular contexto de login da Dra. Tati Cardoso (Tenant A)
-- Toda a camada de API do Supabase define a variável de sessão 'app.current_tenant_id'
SELECT set_config('app.current_tenant_id', '11111111-1111-1111-1111-111111111111', true);

-- Teste 10: Garante que a Tati vê APENAS os seus próprios pacientes
SELECT results_eq(
    'SELECT full_name FROM users WHERE role = ''paciente''',
    $$VALUES ('Ana Paula Silva (Tati)')$$,
    'Sob o contexto do Tenant A, a query deve listar somente pacientes do Tenant A'
);

-- Teste 11: Garante que a Tati não vê o paciente da Marina
SELECT results_ne(
    'SELECT full_name FROM users WHERE role = ''paciente''',
    $$VALUES ('Carlos Souza (Marina)')$$,
    'Sob o contexto do Tenant A, NUNCA deve ser listado paciente do Tenant B'
);

-- Teste 12: Garante que a Tati vê apenas suas bioimpedâncias
SELECT results_eq(
    'SELECT weight FROM body_scans',
    $$VALUES (68.5)$$,
    'Sob o contexto do Tenant A, a query deve listar somente medidas físicas do Tenant A'
);

-- Teste: Garante que a Tati vê apenas seus exames
SELECT results_eq(
    'SELECT title FROM patient_exams',
    $$VALUES ('Exame Sangue Tenant A')$$,
    'Sob o contexto do Tenant A, a query deve listar somente exames do Tenant A'
);

-- Teste 13: Tentativa de UPDATE cruzado pelo Tenant A em dados do Tenant B (deve falhar ou afetar zero linhas)
-- A Tati tenta alterar o peso do paciente da Marina
UPDATE body_scans 
SET weight = 150.0 
WHERE patient_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT results_eq(
    'SELECT weight FROM body_scans WHERE patient_id = ''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb''',
    $$SELECT CAST(NULL AS NUMERIC)$$, -- A query não deve retornar nada porque o RLS bloqueia o acesso
    'O Tenant A tentando atualizar dados do Tenant B deve ser barrado (zero registros atualizados)'
);

-- CASO 2: Alterar o contexto para a Dra. Marina Silva (Tenant B)
SELECT set_config('app.current_tenant_id', '22222222-2222-2222-2222-222222222222', true);

-- Teste 14: Garante que a Marina vê APENAS os seus próprios pacientes
SELECT results_eq(
    'SELECT full_name FROM users WHERE role = ''paciente''',
    $$VALUES ('Carlos Souza (Marina)')$$,
    'Sob o contexto do Tenant B, a query deve listar somente pacientes do Tenant B'
);

-- Teste 15: Garante que a Marina vê apenas suas bioimpedâncias
SELECT results_eq(
    'SELECT weight FROM body_scans',
    $$VALUES (82.1)$$,
    'Sob o contexto do Tenant B, a query deve listar somente medidas físicas do Tenant B'
);

-- Teste: Garante que a Marina vê apenas seus exames
SELECT results_eq(
    'SELECT title FROM patient_exams',
    $$VALUES ('Exame Sangue Tenant B')$$,
    'Sob o contexto do Tenant B, a query deve listar somente exames do Tenant B'
);

-- Teste 16: Tentativa de DELETE cruzado pelo Tenant B em dados do Tenant A
-- A Marina tenta deletar as medidas físicas da paciente da Tati
DELETE FROM body_scans 
WHERE patient_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Reverte contexto para superusuário para inspecionar se a linha foi deletada ou protegida
SELECT set_config('app.current_tenant_id', '00000000-0000-0000-0000-000000000000', true);
SELECT results_eq(
    'SELECT COUNT(*)::integer FROM body_scans WHERE patient_id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa''',
    $$VALUES (1)$$,
    'A tentativa de exclusão cruzada de dados por outro Tenant deve falhar de forma silenciosa e manter o registro intacto'
);

-- CASO 3: Simular acesso público ou sem Tenant Context (Acesso anônimo ou token malformado)
SELECT set_config('app.current_tenant_id', '', true);

-- Teste 17: Query geral de usuários sem tenant ativo deve retornar VAZIO
SELECT is_empty(
    'SELECT * FROM users',
    'Sem um tenant_id de contexto definido, a query deve retornar absolutamente nenhum resultado'
);

-- Teste 18: Query de bioimpedâncias sem tenant ativo deve retornar VAZIO
SELECT is_empty(
    'SELECT * FROM body_scans',
    'Sem um tenant_id de contexto definido, a tabela de bioimpedâncias deve ficar invisível'
);

-- Teste: Query de exames sem tenant ativo deve retornar VAZIO
SELECT is_empty(
    'SELECT * FROM patient_exams',
    'Sem um tenant_id de contexto definido, a tabela de exames deve ficar invisível'
);

-- Finaliza os testes e desfaz todas as inserções para manter o banco limpo
SELECT * FROM finish();
ROLLBACK;
