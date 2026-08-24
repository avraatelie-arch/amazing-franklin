# Manual da Plataforma - Amazing Franklin (Portal Nutri & Pharma SaaS)

Bem-vindo ao manual oficial do Amazing Franklin, um portal multi-tenant SaaS completo voltado para Nutricionistas, Fornecedores (Farmácias de Manipulação) e Pacientes. Este manual serve como base de conhecimento para o Assistente Virtual (MEL) integrado na plataforma.

---

## 1. Visão Geral da Plataforma
A plataforma visa conectar nutricionistas aos seus pacientes, automatizar prescrições e permitir que farmácias credenciadas concorram por orçamentos de fórmulas magistrais. A entrega das fórmulas é rastreável, e há canais de chamados e suporte integrados para garantir agilidade e excelência.

---

## 2. Automação de Endereço via CEP (ViaCEP)
A plataforma possui preenchimento automático de endereço usando a API pública ViaCEP (`https://viacep.com.br/ws/{cep}/json/`).
- **Comportamento**: Quando o campo CEP atinge 8 dígitos válidos, a consulta é disparada automaticamente.
- **Validação Visual**: 
  - Borda **verde** indica CEP válido e campos de endereço auto-preenchidos.
  - Borda **vermelha** indica CEP inválido ou erro de consulta.
- **Formulários Integrados**:
  - Cadastro de Fornecedor (Farmácia)
  - Cadastro de Paciente (Nutricionista criando novo)
  - Formulário de Endereço de Entrega (Painel do Paciente)
  - Edição de Perfil da Nutricionista (Meu Cadastro)
  - Edição de Perfil da Farmácia (Meu Cadastro)
  - Edição de Perfil do Paciente (Meu Cadastro)

---

## 3. Funcionalidades por Perfil de Usuário

### A. Nutricionista
1. **Gestão de Pacientes**: Cadastro completo incluindo informações de endereço (com busca automatizada por CEP).
2. **Consultas & Prontuário**:
   - Registro de peso, gordura corporal, massa magra, circunferência e fotos de antes/depois.
   - **Programa de Evolução Nutricional**:
     - Permite selecionar modelos pré-definidos (ex: **Metabolismo** ou **Gestação**) para preenchimento ágil.
     - As seções incluem: *Título da Capa, Visão Geral, Estratégia, Refeições, Suplementação e Próximos Passos*.
     - Os campos permanecem editáveis para ajustes personalizados antes de salvar.
   - **Prescrição de Fórmulas**: Envio de fórmulas diretamente para cotação no marketplace de farmácias credenciadas.
3. **Meu Cadastro**: Edição de dados do consultório, especialidade, registro CRN e endereço profissional.

### B. Paciente
1. **Painel de Evolução**:
   - Visualização do prontuário, progresso gráfico de peso e gordura.
   - Acesso ao **Programa de Evolução Nutricional** em formato de slides premium animados e interativos.
   - Suporte a **impressão otimizada** (sem cabeçalhos do navegador, barra de navegação ou botões de controle) para geração de PDFs limpos.
2. **Acompanhamento de Pedidos & Fórmulas**:
   - Comparação de preços e prazos de cotações recebidas de farmácias.
   - Pagamento integrado simulado com Stripe.
   - Acompanhamento do status de entrega com link de rastreamento clicável da transportadora selecionada pela farmácia.
3. **Suporte Direto (Chamados)**: Canal de chat direto com a farmácia selecionada para tirar dúvidas sobre a fórmula ou entrega do pedido.
4. **Meu Cadastro**: Edição de dados pessoais, telefone e endereço de entrega.

### C. Fornecedor (Farmácia de Manipulação)
1. **Orçamentos**: Envio de propostas de preço, valor do frete e prazo de entrega para as fórmulas prescritas pelos nutricionistas.
2. **Gerenciamento de Pedidos (Vendas)**:
   - Recebimento de notificações de pedidos aprovados e pagos pelo cliente.
   - **Despacho & Rastreamento**: No momento do despacho, o fornecedor deve selecionar a **Transportadora** (Correios, Jadlog, FedEx, Loggi, Azul Cargo) e inserir o **Código de Rastreamento**.
3. **Suporte & Chamados**: Painel de chamados ativos para interagir e responder a mensagens diretas dos pacientes sobre seus pedidos.
4. **Meu Cadastro**: Edição dos dados da farmácia (CNPJ, CRF do farmacêutico responsável, e-mail corporativo, telefone e endereço).

### D. Super Administrador (Dono do SaaS)
1. **Painel de Controle SaaS (Cockpit do Dono)**:
   - **Acesso Direto (Master)**: Acessível diretamente pelo botão "Master" na tela de login (usando o e-mail padrão `admin@plataforma.com`), abrindo um ambiente exclusivo e uma barra de navegação dedicada para controle global do negócio. Também acessível por e-mail de administrador na conta clínica master.
   - **12 Métricas Consolidadas (KPIs)**: Exibição em tempo real de faturamento SaaS estimado (assinaturas ativas * preço), volume de vendas no marketplace, comissões retidas, faturamento total de infoprodutos da loja, contagem de nutricionistas, fornecedores e pacientes cadastrados, quantidade total de infoprodutos no catálogo, consultas agendadas, prontuários salvos, propostas de orçamento enviadas por farmácias e o status consolidado de cotações (Em Aberto / Fechadas).
   - **Painel Operacional SaaS (Health & Performance Indicators)**:
     - **Crescimento & Métricas SaaS**: MRR (Receita Recorrente Mensal), ARR (Receita Recorrente Anual), Churn Rate (Taxa de cancelamento) e LTV (Lifetime Value) calculados dinamicamente, além de CAC (Custo de Aquisição de Clientes).
     - **Engajamento & Uso do Produto**: Monitoramento de DAU/MAU, Taxa de Ativação (Onboarding) e taxas de Feature Adoption (Fórmulas, Evolução, Diário Alimentar IA).
     - **Técnico & Suporte**: SLA de Uptime (Disponibilidade), latência de carregamento, erros críticos/bugs ativos, pontuação CSAT (Satisfação) e Backlog de chamados pendentes (backlog) atualizado em tempo real.
   - **Gráficos Analíticos**: Gráficos dinâmicos em SVG mostrando a evolução mensal do faturamento e a divisão percentual dos usuários (Pacientes, Nutricionistas, Fornecedores).
   - **Histórico de Atividades (Logs de Auditoria)**: Registro automático em tempo real de eventos críticos, como alteração de parâmetros comerciais, disparos de campanhas, suspensão/reativação de licenças, cancelamentos de consultas e exclusões de registros.
2. **Central de Controle Total (5 Diretórios com Ações Administrativas)**:
   - **Diretório Geral de Pacientes**: Visualização detalhada da base de pacientes cadastrados com opção de exclusão permanente (`adminDeletePatient`).
   - **Histórico de Consultas / Atendimentos**: Consolidação de todos os prontuários e evoluções gravadas pelas nutricionistas com opção de exclusão permanente (`adminDeleteConsultation`).
   - **Central de Prescrições e Receitas**: Controle de todas as receitas de fórmulas magistrais com opção de exclusão permanente (`adminDeletePrescription`).
   - **Diretório de Consultas Agendadas**: Controle e monitoramento de agendamentos de consultas presenciais e online (sessões Jitsi) com opção de cancelamento administrativo (`adminCancelAppointment`).
   - **Diretório de Infoprodutos (E-books & Protocolos)**: Controle total do catálogo de infoprodutos configurados no portal com opção de remoção permanente (`adminDeleteProduct`).
3. **Diretório de Nutricionistas & Controle de Licenças**:
   - Lista completa de nutricionistas cadastradas na plataforma.
   - **Suspensão/Reativação**: O administrador pode suspender ou reativar instantaneamente a licença de qualquer nutricionista.
   - **Bloqueio Visual (Overlay)**: Caso a nutricionista esteja com a licença suspensa, um overlay de bloqueio visual estilizado e impenetrável cobre todo o painel clínico no momento do login, exibindo uma mensagem administrativa de suspensão e botão para contatar o suporte comercial.
4. **Parâmetros e Configurações Comerciais**:
   - Ajuste dinâmico do Preço Mensal da Licença SaaS (R$) e do Período de Teste Grátis (Dias).
   - Ajuste da **Taxa de Comissão do Marketplace (%)** (de 5% a 30%), que é aplicada automaticamente nas cotações e repasses de compras de fórmulas no marketplace.
5. **Gerenciamento de Comunicados**:
   - Criação e publicação de avisos globais com segmentação (Pacientes, Nutricionistas, Fornecedores ou Todos) e remoção instantânea.
6. **Campanhas de E-mail em Massa**:
   - Ferramenta de disparo de comunicados comerciais em massa para grupos de usuários cadastrados com registro detalhado no Histórico de Campanhas Enviadas.

---

## 4. Cadastro Multiclínicas, Ativação de Paciente e Isolamento (Multi-tenant)
A plataforma suporta múltiplos consultórios e clinicas independentes, garantindo isolamento total de dados e fluxos de onboarding flexíveis.
- **Credenciamento de Nutricionistas**: Novas profissionais podem se cadastrar diretamente na tela de login, iniciando um período Trial automático de 15 dias. Seus dados (CRN, e-mail, telefone, especialidade) e consultório são editáveis em "Meu Cadastro".
- **Cadastro Direto de Paciente**: Pacientes podem criar uma conta do zero preenchendo o formulário de cadastro direto.
- **Primeiro Acesso e Ativação**: Pacientes pré-cadastrados por uma nutricionista entram no sistema sem senha. Para acessar o portal:
  1. Devem clicar em "Primeiro Acesso? Ativar minha Conta" na tela de login.
  2. Inserir o e-mail cadastrado pela nutricionista.
  3. Validar a ativação através do código simulado de segurança (`123456`).
  4. Definir seu CPF e sua senha pessoal de acesso.
- **Isolamento de Dados (Tenant Isolation)**: Cada nutricionista possui acesso restrito apenas aos seus respectivos pacientes cadastrados. Pacientes de outras clínicas ou cadastros isolados permanecem invisíveis e inacessíveis para terceiros, tanto na tabela de pacientes quanto nos seletores de agendamento e evolução.
- **Meu Cadastro**: Disponível no menu de perfil de todos os usuários (Nutricionistas, Fornecedores, Pacientes) para atualização em tempo real de informações e sincronização com as bases globais.

---

## 5. Assistente Virtual de Suporte (MEL)
A plataforma possui um widget flutuante de chat de suporte automatizado chamado **MEL**.
- **Função**: Ajudar os usuários a navegar na plataforma, entender como funciona a cotação de fórmulas, como rastrear pedidos, cadastrar evolução ou como ativar o primeiro acesso.
- **Base de Conhecimento**: Utiliza as informações descritas neste manual.

---

*Nota: Este manual deve ser atualizado sempre que novas funcionalidades forem adicionadas ou fluxos existentes forem modificados.*
