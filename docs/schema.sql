-- ============================================================================
-- SCHEMA DDL MULTI-TENANT COM ROW-LEVEL SECURITY (RLS)
-- Caminho: docs/schema.sql
-- ============================================================================
-- Banco de Dados: PostgreSQL
-- Objetivo: Definição de tabelas, relacionamentos e políticas de segurança
-- restritivas para garantir isolamento total de dados entre inquilinos.
-- ============================================================================

-- Extensão para geração de UUIDs de segurança
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE INQUILINOS (Nutritionistas/Clínicas Assinantes)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    
    -- Customização de Marca (White-Label)
    primary_color VARCHAR(7) DEFAULT '#607361',
    secondary_color VARCHAR(7) DEFAULT '#A3835B',
    logo_url TEXT,
    
    -- Status da Assinatura SaaS
    subscription_status VARCHAR(50) DEFAULT 'trial', -- 'trial', 'active', 'suspended', 'canceled'
    subscription_plan VARCHAR(50) DEFAULT 'pro', -- 'basic', 'pro', 'premium'
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE USUÁRIOS (Pacientes e Profissionais)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'paciente', -- 'paciente', 'nutricionista', 'admin'
    phone VARCHAR(20),
    is_trusted BOOLEAN DEFAULT FALSE,
    
    -- Dados Fiscais para NFS-e
    tax_id VARCHAR(20),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip VARCHAR(15),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, email)
);

-- 3. MODELOS DE PROTOCOLOS CLÍNICOS
CREATE TABLE clinical_protocol_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    base_html_template TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CONSULTAS E PRONTUÁRIOS EMITIDOS
CREATE TABLE patient_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES clinical_protocol_templates(id) ON DELETE RESTRICT,
    
    custom_goals TEXT,
    dietary_restrictions TEXT,
    suplementation TEXT,
    custom_orientations TEXT,
    return_days INT DEFAULT 30,
    
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUTOS / INFOPRODUTOS À VENDA
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    duration_days INT,
    file_url TEXT, -- Link para download (ex: PDF do e-book ou guia de vendas)
    content_metadata JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PEDIDOS DE COMPRA
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_gateway VARCHAR(50) NOT NULL,
    gateway_charge_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PRODUTOS ADQUIRIDOS / LIBERADOS
CREATE TABLE user_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, product_id)
);

-- 8. AGENDAMENTOS E TELEMEDICINA
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    appointment_type VARCHAR(50) NOT NULL DEFAULT 'online',
    status VARCHAR(50) DEFAULT 'pendente',
    requires_deposit BOOLEAN DEFAULT TRUE,
    deposit_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'nao_aplicavel',
    
    telemed_room_name VARCHAR(100),
    telemed_token TEXT,
    
    nfe_requested BOOLEAN DEFAULT FALSE,
    nfe_status VARCHAR(50) DEFAULT 'nao_emitida',
    nfe_number VARCHAR(50),
    nfe_pdf_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. HISTÓRICO DE MEDIDAS E BIOIMPEDÂNCIA (Visbody 3D)
CREATE TABLE body_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    scan_date DATE NOT NULL,
    weight DECIMAL(5,2),
    body_fat DECIMAL(4,1),
    muscle_mass DECIMAL(5,2),
    water_pct DECIMAL(4,1),
    visceral_fat INT,
    tmb INT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. AUDITORIA E SEGURANÇA (Rastreabilidade LGPD)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) E CRIAÇÃO DAS POLÍTICAS DE ISOLAMENTO
-- ============================================================================

-- Ativação de RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_protocol_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- DEFINIÇÃO DAS POLÍTICAS DE ISOLAMENTO POR TENANT (Inquilino)
-- Nota: 'app.current_tenant_id' é definido na sessão da conexão no Supabase/Postgres
-- para cada requisição vinda do backend autenticado.

-- 1. tenants
CREATE POLICY tenant_isolation_policy ON tenants
    AS RESTRICTIVE
    USING (id = current_setting('app.current_tenant_id')::uuid);

-- 2. users
CREATE POLICY tenant_isolation_policy ON users
    AS RESTRICTIVE
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 3. clinical_protocol_templates
CREATE POLICY tenant_isolation_policy ON clinical_protocol_templates
    AS RESTRICTIVE
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 4. patient_consultations
CREATE POLICY tenant_isolation_policy ON patient_consultations
    AS RESTRICTIVE
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 5. products
CREATE POLICY tenant_isolation_policy ON products
    AS RESTRICTIVE
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 6. orders
CREATE POLICY tenant_isolation_policy ON orders
    AS RESTRICTIVE
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 7. user_products
CREATE POLICY tenant_isolation_policy ON user_products
    AS RESTRICTIVE
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 8. appointments
CREATE POLICY tenant_isolation_policy ON appointments
    AS RESTRICTIVE
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 9. body_scans
CREATE POLICY tenant_isolation_policy ON body_scans
    AS RESTRICTIVE
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 10. audit_logs
CREATE POLICY tenant_isolation_policy ON audit_logs
    AS RESTRICTIVE
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 11. TABELA DE EXAMES ANEXADOS (Enviados por Pacientes)
CREATE TABLE patient_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP WITH TIME ZONE,
    nutritionist_notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    
    CONSTRAINT patient_exams_status_check CHECK (status IN ('pending', 'analyzed'))
);

-- Ativação de RLS na tabela de exames
ALTER TABLE patient_exams ENABLE ROW LEVEL SECURITY;

-- Política de RLS para isolamento de inquilino na tabela de exames
CREATE POLICY tenant_isolation_policy ON patient_exams
    AS RESTRICTIVE
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

