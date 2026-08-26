# Backlog: Patient Empty State, Uber-Style Rating & Nutritionist Ranking Marketplace (EP-09 Story 1)

This story implements:
1. **Patient Empty State**: Clean initial dashboard for newly registered patients (no mock data, zeroed KPIs, initial avatar).
2. **Patient Linkage Differentiation**: Dedicated nutritionist card for invited patients vs. marketplace ranking card for self-registered open users.
3. **Uber-Style Nutritionist Rating System**: 1-to-5 star interactive ratings, compliment tags, and written testimonials post-consultation.
4. **Nutritionist Directory & Ranking Marketplace**: Ranked showcase modal sorted by rating with filters, reviews, and 1-click booking/linkage.

---

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Ensure all new patients without consultation history view a clean Empty State with zeroed KPIs (`-- kg`, `--%`), patient initials avatar, and inviting onboarding text.
- [x] Display dedicated nutritionist card for linked patients and "Choose Nutritionist & Book" card for open unlinked users.
- [x] Create Uber-style 1-to-5 star evaluation modal with compliment tags and patient review submissions.
- [x] Create Nutritionist Ranking & Directory modal sorted by review averages with specialty filters and 1-click linkage/booking.

### 2. CSS Styling (UX Specialist)
- [x] Style `.empty-state-card`, `.empty-state-icon`, and zeroed metric layouts in `style.css`.
- [x] Style `.rating-star-btn`, `.review-tags-grid`, and `.review-tag-chip` for the 1-5 star review modal.
- [x] Style `.nutri-ranking-modal`, `.nutri-ranking-card`, `.ranking-position-badge`, and review pills using brand tokens (`--primary-olive`, `--bronze-gold`).

### 3. HTML & JS Logic (Senior Developer)
- [x] Add `#modal-rate-nutri` (Evaluation Modal) and `#modal-nutri-ranking` (Ranking Modal) to `index.html`.
- [x] Refactor `loadPatientDashboard()` to cleanly handle empty history states without falling back to mock clinical data.
- [x] Refactor `renderPatientAboutNutriCard()` to support linked vs. unlinked open patients.
- [x] Implement `openRateNutriModal()`, `submitNutriReview()`, `openNutriRankingModal()`, and `selectNutriFromRanking()`.

### 4. QA Validation Specs (QA Tester)
- [x] Create Playwright E2E suite `tests/e2e/patient-empty-state-and-ranking.spec.js` validating:
  - New self-signup patient clean empty state.
  - Open ranking view and selecting a nutritionist.
  - Post-consultation 1-5 star rating and review calculation.
- [x] Run `npm test` verifying 0 regressions on all existing 25 unit/API tests.

---

# Backlog: Jitsi Meet Video Consultation Modal Widget (EP-04 Story 1)

This document tracks the tasks required to implement the Jitsi Meet Video Consultation modal widget. It replaces the current mock video call simulation (which uses static background images) with a live, interactive video consultation utilizing the Jitsi Meet External API.

---

## 📋 Epic & Story Context
- **Epic**: EP-04 (Telemedicine & Communications)
- **User Story**: Story 1 - Video Consultation Modal Widget
- **Business Goal**: Enable secure, low-latency, real-time video consultations directly inside the SaaS portal for both Nutricionistas (Doctors) and Pacientes (Patients) without requiring third-party downloads or external redirects.
- **Current State**: Completed and validated.
- **Target State**: A fully interactive Jitsi Meet iframe embedded inside a container (`#jitsi-container`) that handles dynamic room creation, user profile pass-through, custom controls, and graceful cleanup when calls end.

---

## 🛠️ Implementation Checklist

### 1. HTML & JS Logic (Senior Developer)
- [x] **Load Jitsi Meet External API Script**
  - Inject the official Jitsi script dynamically: `<script src="https://meet.jit.si/external_api.js"></script>` in `index.html`.
- [x] **Prepare the Jitsi Container DOM**
  - Replace mock video placeholders on the left side of the split screen with `<div id="jitsi-container" style="width: 100%; height: 100%;"></div>`.
- [x] **Initialize the Jitsi Meet Iframe (startTelemedCall)**
  - Instantiate `JitsiMeetExternalAPI` with dynamic room naming: `AmazingFranklin-{apptId}-{patientName}`.
- [x] **Bind Jitsi Meet Event Listeners**
  - Hook into `videoConferenceJoined` to start the call timer.
  - Hook into `videoConferenceLeft` and `readyToClose` to trigger modal cleanup (`endTelemedCall()`).
- [x] **Custom Call Control Integration**
  - Map existing mic, camera, and share buttons to `api.executeCommand()`.
- [x] **Session Cleanup & Teardown (endTelemedCall)**
  - Properly call `api.dispose()` and clear the container inner HTML.
- [x] **Co-existence with Clinical Notes**
  - Keep the right sidebar (`#telemed-notes-sidebar`) fully visible for clinicians and preserve notes upon saving.

---

### 🎨 CSS Styling (UX Specialist)
- [x] **Container Fluid Layout**
  - Make `#jitsi-container` fill 100% of the left modal split screen.
- [x] **Responsiveness & Flex Adapters**
  - Horizontal view on desktop; vertical stack with fixed height viewport on mobile screen dimensions.
- [x] **Loading and Buffering State Indicator**
  - Stylized loading spinner in theme colors displays while the Jitsi script is loading and rendering.
- [x] **Dark Mode Styling & Custom Controls**
  - Styled control toolbar overlays utilizing theme styling standards.

---

### 🧪 Test Validation Specs (QA Tester)
- [x] **Script Injection Verification**
  - Verified `window.JitsiMeetExternalAPI` definition on call start.
- [x] **Iframe Rendering and Source Check**
  - Verified that Playwright locates the Jitsi `<iframe>` inside `#jitsi-container` and matches the Jitsi domain.
- [x] **Dynamic Room Name & User Verification**
  - Verified that room names are correctly built and passed.
- [x] **Audio & Video Toggle Interaction**
  - Verified mic, camera, and screen sharing toggle status styling.
- [x] **End Call & Cleanup Verification**
  - Verified that ending a call disposes of Jitsi and resets container HTML.
- [x] **Tenant Isolation Testing**
  - Verified that patients from different subdomains (Tati vs Marina) are routed to separate rooms.
- [x] **Clinical Notes Persistence**
  - Verified that clinical notes entered during calls are written and saved to the patient profile history database.

---

# Backlog: Role-Aware Chatbot MEL AI Support Assistant (EP-05 Story 1)

This document tracks the tasks required to implement role-aware chatbot replies for the support assistant MEL.

## 🛠️ Implementation Checklist

### 1. HTML & JS Logic (Senior Developer)
- [x] **Parse Logged-In User Role**
  - Extract the role inside `generateAIChatbotReply` via `amazing_franklin_logged_in_role` or `activeRole`.
- [x] **Implement Role-Specific Responses**
  - Precise answers for e-books/recipes (patients buy only, nutris sell/create)
  - Precise answers for prescribing formulas (nutris prescribe, patients request, suppliers quote)
  - Precise answers for shipping tracking/despatch (suppliers dispatch, patients track, nutris cannot dispatch)
  - Precise answers for CEP/address auto-fill (highlighting role-specific context)
- [x] **Verify Test Passing**
  - Ensure all existing and chatbot tests pass green.

---

# Backlog: Patient Dashboard Personalization & Rich Nutritionist Card (EP-06 Story 1)

This story tracks the redesign of the Patient Home Tab from a generic marketing pitch to a personalized, clinical cockpit and rich nutritionist trust card.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Personalize Patient Home Hero text to welcome the logged-in patient by name with journey progress chips.
- [x] Redesign "Sobre a Dra. Tati Cardoso" into an interactive, high-trust professional card with avatar, CRN, tags, clinic hours, and quick actions.
- [x] Support seamless multi-professional and multi-tenant branding.

### 2. CSS Styling (UX Specialist)
- [x] Style `.hero-section` as a sleek, motivating patient welcome card with brand gradients and micro-badges.
- [x] Style `.nutri-team-card` and `.nutri-bio-chip` with `--primary-olive`, `--bronze-gold`, and responsive flex layout.
- [x] Ensure mobile responsiveness on tablet and smartphone viewports.

### 3. HTML & JS Logic (Senior Developer)
- [x] Update HTML structure in `index.html` for `#tab-home` hero and about-nutri section.
- [x] Enhance `renderPatientAboutNutriCard()` and `applySubdomainBranding()` to dynamically inject patient name, active plan status, and professional credentials.
- [x] Bind quick action buttons to respective patient navigation tabs (`tab-evolution`, `tab-chat`, `tab-booking`).

### 4. QA Validation Specs (QA Tester)
- [x] Execute validation tests (`npm test` and API tests) ensuring zero regressions.
- [x] Verify visual rendering on localhost:8080.

---

# Backlog: Patient Home Mini-Dashboard & Multi-Nutritionist Personalization (EP-06 Story 2)

This story refactors the Patient Home Tab based on direct feedback: eliminating duplicate welcome text, replacing the redundant "Status & Objetivo" card with an actionable 4-KPI clinical summary dashboard, and embedding high-res nutritionist headshots with multi-dietitian team support.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Remove duplicate "Bem-vindo ao Amazing Franklin" text and align header with personalized dynamic patient name (e.g., Frederico/Ana Paula).
- [x] Replace the redundant "Status & Objetivo" card with a 4-KPI Clinical Summary Dashboard (Current Weight & Goal, Body Composition, Active Meal Plan, Next Consultation).
- [x] Embed real nutritionist portrait photo (`dra_tati_portrait.png` / `dra_marina_portrait.png`) + clinic logo with multi-dietitian support.

### 2. CSS Styling (UX Specialist)
- [x] Style `.patient-kpi-grid` and `.patient-kpi-card` with clean responsive layout, icons, delta badges, and brand theme variables (`--primary-olive`, `--bronze-gold`).
- [x] Style `.nutri-team-card` with nutritionist portrait, online badge, and clinic branding.

### 3. HTML & JS Logic (Senior Developer)
- [x] Update `#tab-home` markup in `index.html` removing redundant cards and inserting the 4-KPI dashboard.
- [x] Refactor `loadPatientDashboard()` and `applySubdomainBranding()` to dynamically inject patient name into greeting and update all 4 KPIs.
- [x] Enhance `renderPatientAboutNutriCard()` to support single or multiple nutritionists with portrait photos and direct WhatsApp/Chat links.

### 4. QA Validation Specs (QA Tester)
- [x] Execute validation tests (`npm test`) to ensure 100% test pass with zero regressions.
- [x] Verify visual rendering on localhost:8080.

---

# Backlog: Symmetric Multi-Nutritionist Team Cards Standardization (EP-06 Story 3)

Standardize the layout of the clinical team cards so that all assigned dietitians share the exact same modern, balanced visual structure side-by-side.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Standardize all nutritionist profiles to follow an identical symmetric layout (photo, name, CRN badge, role/specialty, tags, brief bio, and quick message link).
- [x] Display team members in a 2-column balanced grid (or responsive stack on mobile).
- [x] Maintain unified clinic contact info (WhatsApp, Email, clinic hours) and global consultation actions below the grid.

### 2. CSS Styling (UX Specialist)
- [x] Add `.nutri-team-grid` 2-column flex/grid system in `style.css`.
- [x] Style `.nutri-member-card` with consistent avatar sizing, border styling, chip tags, and typography.
- [x] Ensure smooth responsive wrapping on tablet and mobile viewports.

### 3. HTML & JS Logic (Senior Developer)
- [x] Refactor `renderPatientAboutNutriCard()` in `index.html` to generate identical symmetric member cards for all assigned nutritionists.
- [x] Ensure individual chat trigger links route directly to the respective nutritionist.

### 4. QA Validation Specs (QA Tester)
- [x] Run `npm test` verifying 100% passing tests with zero regressions.
- [x] Validate visual rendering on localhost:8080.

---

# Backlog: Self-Contained Individual Nutritionist Action Cards (EP-06 Story 4)

Relocate contact information (WhatsApp, Email) and direct action buttons ("Tirar Dúvida no Chat", "Agendar Consulta") inside each nutritionist's individual card so patients can direct communication and bookings to their desired professional.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Eliminate the generic bottom contact bar and redundant global action buttons.
- [x] Place dedicated contact info (WhatsApp, E-mail) inside each dietitian's individual card.
- [x] Place dedicated 2-button CTA row (`💬 Tirar Dúvidas` and `📅 Agendar Consulta`) inside each individual card targeting that specific dietitian.

### 2. CSS Styling (UX Specialist)
- [x] Style `.nutri-member-contacts` and `.nutri-member-actions` in `style.css` with clean icons, borders, and button hover states.
- [x] Ensure perfect alignment and vertical balance between cards in the 2-column grid.

### 3. HTML & JS Logic (Senior Developer)
- [x] Refactor `renderPatientAboutNutriCard()` in `index.html` to generate fully self-contained cards with per-professional contacts and action handlers.
- [x] Ensure chat and booking buttons work smoothly.

### 4. QA Validation Specs (QA Tester)
- [x] Run `npm test` verifying 100% passing tests with zero regressions.
- [x] Validate visual rendering on localhost:8080.

---

# Backlog: Single Dedicated Nutritionist Card Experience (EP-06 Story 5)

Align patient portal with standard 1-on-1 clinical practice: display a single, focused, and premium trust card for the patient's dedicated nutritionist (photo, CRN, bio, tags, direct WhatsApp, email, and action buttons).

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Streamline nutritionist section to display only the patient's dedicated single nutritionist.
- [x] Dynamic binding to the active nutritionist (e.g. Dra. Tati Cardoso or Dra. Marina Silva based on tenant/patient account).
- [x] Include HD portrait photo, status dot, CRN badge, specialty, detailed bio, specialty tags, direct WhatsApp, email, clinic hours, and 1-click CTA buttons ("Tirar Dúvidas no Chat", "Agendar Nova Consulta").

### 2. CSS Styling (UX Specialist)
- [x] Refine `.nutri-trust-card` and `.single-nutri-card` in `style.css` for a spacious, polished, single-column premium layout.

### 3. HTML & JS Logic (Senior Developer)
- [x] Update `renderPatientAboutNutriCard()` in `index.html` to render the single dedicated nutritionist layout.

### 4. QA Validation Specs (QA Tester)
- [x] Run `npm test` verifying 100% passing tests with zero regressions.
- [x] Validate visual rendering on localhost:8080.

---

# Backlog: Premium UX/UI Redesign of Nutritionist Card (EP-06 Story 6)

Redesign the single dedicated nutritionist card using a modern 2-column Executive Profile layout (hero profile & CTAs on the left, clinical methodology, specialty badges & contact pills on the right) for optimal visual hierarchy, scannability, and balance.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Redesign layout from a stretched single column into a balanced 2-column Executive layout.
- [x] Left Column: Larger HD portrait (100px+), verified CRN badge, specialty subtitle, clinic logo, and direct 2-button CTAs.
- [x] Right Column: Methodology card with quote tint, modern specialty badges, and structured contact pills (WhatsApp, E-mail, Clinic hours).
- [x] Responsive stacking on mobile/tablet.

### 2. CSS Styling (UX Specialist)
- [x] Implement `.nutri-profile-layout`, `.nutri-hero-col`, `.nutri-info-col`, `.nutri-methodology-card`, `.nutri-contact-pills`, and `.nutri-pill-item` in `style.css`.
- [x] Ensure luxury healthcare aesthetic with harmonious olive, bronze-gold, and slate tones.

### 3. HTML & JS Logic (Senior Developer)
- [x] Refactor `renderPatientAboutNutriCard()` in `index.html` to output the new 2-column Executive Profile markup.
- [x] Ensure all data attributes, dynamic bindings, and button clicks work seamlessly.

### 4. QA Validation Specs (QA Tester)
- [x] Run `npm test` verifying 100% passing tests with zero regressions.
- [x] Validate visual rendering on localhost:8080.

---

# Backlog: Plate Scanner & Video Consultations UX/UI Redesign (EP-06 Story 7)

Redesign the lower dashboard grid containing the AI Plate Scanner and Recorded Teleconsultations cards with high-impact visual diagramming, balanced heights, interactive dropzones, and rich recording video cards.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Redesign AI Plate Scanner with a modern interactive visual dropzone, AI food identification pills, and instant macro estimation.
- [x] Redesign Teleconsultas Gravadas with video thumbnail cards, consultation tags, duration, and 1-click video playback.
- [x] Ensure both cards maintain balanced height, consistent typography, and cohesive aesthetic.

### 2. CSS Styling (UX Specialist)
- [x] Style `.plate-scanner-card`, `.plate-dropzone`, `.ai-macro-pill`, `.recording-video-card`, and `.recording-play-btn` in `style.css`.
- [x] Match color palette with `--primary-olive`, `--bronze-gold`, and clean card backgrounds.

### 3. HTML & JS Logic (Senior Developer)
- [x] Update markup in `index.html` for both cards.
- [x] Implement robust `simulateAIScanPlate()`, `clearPlateScan()`, `renderPatientRecordings()`, and video playback handlers.

### 4. QA Validation Specs (QA Tester)
- [x] Run `npm test` verifying 100% passing tests with zero regressions.
- [x] Validate visual rendering on localhost:8080.

---

# Backlog: Direct WhatsApp Click-to-Chat & Mailto Integration (EP-06 Story 8)

Convert the WhatsApp contact box into a direct click-to-chat `https://wa.me/` link with custom pre-filled message and green brand styling, along with direct `mailto:` for e-mail.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Make the "WhatsApp Direto" card clickable, opening `https://wa.me/55{cleanPhone}?text={encodedMessage}` in a new tab.
- [x] Make the "E-mail Profissional" card clickable with `mailto:`.
- [x] Provide visual hover indicators (pointer cursor, green WhatsApp highlight).

### 2. CSS Styling (UX Specialist)
- [x] Style `.nutri-channel-link` with hover transitions, cursor pointer, and WhatsApp brand green accents.

### 3. HTML & JS Logic (Senior Developer)
- [x] Update `renderPatientAboutNutriCard()` in `index.html` to generate `<a>` links with `href="https://wa.me/..."` and `target="_blank"`.

### 4. QA Validation Specs (QA Tester)
- [x] Run `npm test` verifying 100% passing tests with zero regressions.
- [x] Validate visual rendering on localhost:8080.

---

# Backlog: Patient Profile Registration Modal Redesign & UX Polish (EP-06 Story 9)

Elevate the UX/UI of the "Cadastro de Dados do Paciente" modal with clear visual sectioning (Dados Pessoais vs. Endereço de Entrega), modern input styling, LGPD privacy badge, close button, and automatic ViaCEP address lookup.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Group the form into two distinct semantic sections: "1. Dados Pessoais & Contato" and "2. Endereço para Envio de Fórmulas".
- [x] Include top close button (✕), LGPD security badge, and friendly instructions.
- [x] Implement instant CEP auto-lookup via `fetch('https://viacep.com.br/ws/...')` to auto-fill street, neighborhood, city, and state.
- [x] Prevent text clipping on long names and addresses by expanding modal width to 580px and optimizing input paddings.

### 2. CSS Styling (UX Specialist)
- [x] Style `.modal-section-box`, `.input-group-badge`, and modal header in `style.css`.

### 3. HTML & JS Logic (Senior Developer)
- [x] Upgrade markup of `#patient-profile-registration-modal` in `index.html`.
- [x] Implement `lookupPatientCEP()` for auto-filling address fields with loading feedback.

### 4. QA Validation Specs (QA Tester)
- [x] Run `npm test` verifying 100% passing tests with zero regressions.
- [x] Verify modal visually in browser.

---

# Backlog: Evolução Física - Relatório PDF, Upload de Fotos & Histórico Clínico (EP-07 Story 1)

Modernizar e enriquecer a aba de Evolução Física com emissão completa de Relatório PDF Clínico, correção do upload e persistência das fotos de Antes e Depois, e transformação do Parecer Clínico em uma Linha do Tempo histórica interativa de todas as consultas.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Exportar Relatório 3D deve gerar um documento clínico oficial em PDF contendo cabeçalho institucional, dados do paciente, métricas de bioimpedância, comparativo de deltas, tabela de circunferências, parecer clínico, plano alimentar, fórmula manipulada e fotos antes/depois.
- [x] Upload de fotos de Antes e Depois deve atualizar imediatamente a visualização do paciente, persistir no `localStorage` por paciente e sincronizar com a consulta ativa.
- [x] O bloco de parecer clínico deve exibir todas as consultas históricas do paciente em uma Linha do Tempo Clínica (Timeline) contendo para cada atendimento:
  - Parecer Clínico & Evolução da Nutricionista
  - Plano Alimentar Sugerido com detalhes e link do PDF
  - Fórmula Manipulada & Suplementação prescrita com atalho para cotações
  - Métricas e botão de sincronização com o Holograma 3D
- [x] Toda nova consulta salva pela Nutricionista em seu painel deve alimentar automaticamente o histórico do paciente e refletir imediatamente na Linha do Tempo e no Holograma do cliente.
- [x] Adicionar badges visuais de evolução de métricas e suporte a alternância de exibição das fotos (Slider vs. Lado a Lado).

### 2. CSS Styling (UX Specialist)
- [x] Criar estilos para a Linha do Tempo Clínica (`.clinical-timeline`, `.timeline-card`, `.timeline-badge-date`, `.timeline-sync-btn`).
- [x] Criar estilos para os sub-cards de Plano Alimentar (`.diet-card`, `.timeline-btn-mini`) e Fórmula Manipulada (`.formula-card`).
- [x] Estilizar os controles de alternância de visualização da galeria de fotos e badges de deltas de bioimpedância.
- [x] Criar regras completas de `@media print` e classes `.print-report-container` para formatação perfeita em papel/PDF A4.

### 3. HTML & JS Logic (Senior Developer)
- [x] Implementar cards enriquecidos em `renderClinicalNotesTimeline()` exibindo parecer, plano alimentar e fórmula manipulada.
- [x] Implementar modal de emissão e impressão do Plano Alimentar em PDF (`#diet-plan-modal` e `openDietPlanPDF()`) com cardápio completo, diretrizes e substituições personalizadas por atendimento.
- [x] Adicionar botão "Baixar Receita" na Linha do Tempo e implementar `openPrescriptionForConsult()` para abrir o receituário oficial com assinatura digital ICP-Brasil e carimbo profissional pronto para PDF/impressão.
- [x] Atualizar `confirmAndSavePatientConsult()` para gravar `diet`, `dietDetails`, `dietPdf`, `formula` e `formulaStatus` em `patient.history` e sincronizar com `localStorage`.
- [x] Atualizar `exportPhysicalEvolutionPDF()` para incluir as seções de Plano Alimentar e Fórmula Manipulada no laudo gerado.
- [x] Garantir retrocompatibilidade e merge automático de dados no `window.onload` para histórico já salvo no navegador.

### 4. QA Validation Specs (QA Tester)
- [x] Validar que todas as consultas na Linha do Tempo mostram Parecer, Plano Alimentar e Fórmula Manipulada com botões de Baixar Receita e Ver Cotações.
- [x] Validar que o botão Baixar PDF do Plano Alimentar abre o documento oficial com cardápio, orientações, assinatura da nutricionista e botão de impressão em PDF.
- [x] Validar que o botão Baixar Receita abre o receituário oficial completo com assinatura da nutricionista.
- [x] Validar que uma nova consulta registrada pela Nutricionista aparece imediatamente na Área do Paciente.
- [x] Validar a abertura do PDF e a alternância de fotos.
- [x] Executar testes de regressão e documentar no `walkthrough.md`.

---

# Backlog: Restauração & Destaque Full-Width da Linha do Tempo de Pareceres Clínicos (EP-07 Story 2)

Restaurar a visibilidade nobre e completa da Linha do Tempo de Pareceres Clínicos na aba Evolução Física do Paciente, reposicionando o container como uma seção dedicada de largura total (Full Width) logo abaixo da grade superior, garantindo a exibição de todas as consultas históricas com pareceres, resumos, planos alimentares, fórmulas manipuladas e botões de ação rápidos.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Posicionar a Linha do Tempo de Pareceres Clínicos como uma seção nobre e independente de largura total (Full Width) em `tab-evolution`, abaixo do Gráfico e da Galeria de Fotos.
- [x] Garantir a exibição de todas as consultas históricas do paciente em ordem cronológica reversa (da mais recente para a mais antiga).
- [x] Exibir para cada atendimento:
  - Cabeçalho com data, tag de avaliação inicial/retorno, nutricionista responsável e badge do protocolo.
  - Parecer Clínico & Conduta integral da nutricionista em destaque visual.
  - Sub-card de Plano Alimentar com detalhes e botão de download do PDF oficial.
  - Sub-card de Fórmula Manipulada / Suplementação com botão "Baixar Receita" e atalho "Ver Cotações".
  - Indicadores antropométricos (Peso, Gordura, Massa Magra) e botão "Ver Medições 3D".

### 2. CSS Styling (UX Specialist)
- [x] Refinar layout e espaçamentos de `#patient-clinical-timeline`, `.clinical-timeline-container`, `.timeline-item` e `.timeline-card` em `style.css`.
- [x] Garantir responsividade fluida para `.timeline-prescriptions-grid` em telas desktop, tablet e mobile.
- [x] Utilizar a paleta de cores oficial (`--primary-olive`, `--bronze-gold`, `--terracotta`, `--lavender`).

### 3. HTML & JS Logic (Senior Developer)
- [x] Mover a estrutura do card da Linha do Tempo para fora da coluna esquerda de `.dashboard-grid`, criando uma seção dedicada de largura total em `index.html`.
- [x] Garantir que `renderClinicalNotesTimeline()` seja invocado na inicialização, na troca de abas (`switchTab('tab-evolution')`) e nas alterações de consulta.
- [x] Assegurar integridade das ações de abertura de PDF, receituário assinado e sincronização 3D.

### 4. QA Validation Specs (QA Tester)
- [x] Executar validação automatizada (`npm test`) sem regressões.
- [x] Validar visualmente a presença e completude da Linha do Tempo na aba Evolução Física.

---

# Backlog: Upload da Foto da Nutricionista & Validação do Fluxo Replicado / Multi-Tenant (EP-07 Story 3)

Permitir que a Nutricionista faça upload e alteração da sua Foto de Perfil diretamente em seu painel ("Meu Cadastro" / Perfil da Nutricionista), refletindo instantaneamente na Área do Paciente ("Sobre sua Nutricionista", cabeçalhos e consultas), documentando e validando a replicação automática de bioimpedância/dietas/fórmulas e o isolamento seguro de banco de dados por Tenant (RLS).

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Adicionar campo de upload e prévia da Foto de Perfil da Nutricionista no modal de edição de perfil (`#nutri-profile-modal`).
- [x] Fazer com que a foto da nutricionista atualizada seja salva em `nutriProfile.photoUrl` e replicada imediatamente no card "Sobre sua Nutricionista" (`#patient-about-nutri-card`) da área do paciente.
- [x] Validar que todas as informações imputadas no painel da Nutri (bioimpedância, circunferências, plano alimentar, fórmulas e pareceres) são replicadas no portal do cliente ao salvar.
- [x] Confirmar e documentar o isolamento multi-tenant (cada nutricionista possui seu ecossistema isolado de pacientes com RLS no PostgreSQL / Supabase).

### 2. CSS Styling (UX Specialist)
- [x] Estilizar o box de upload de foto com preview circular no modal de perfil da nutricionista em `style.css`.

### 3. HTML & JS Logic (Senior Developer)
- [x] Adicionar o markup de upload de foto e prévia em `#nutri-profile-modal` no `index.html`.
- [x] Implementar `handleNutriPhotoUpload()` e `updateNutriPhotoPreview()` com suporte a FileReader Base64 e URL externa.
- [x] Atualizar `openNutriProfileModal()`, `saveNutriProfileModal()` e `renderPatientAboutNutriCard()` para utilizar `nutriProfile.photoUrl`.

### 4. QA Validation Specs (QA Tester)
- [x] Validar testes de isolamento de tenants (`npm test`).

---

# Backlog: Onboarding & Ativação de Acesso do Paciente via E-mail / WhatsApp (EP-07 Story 4)

Quando a nutricionista cadastra um novo paciente, disponibilizar imediatamente o envio automatizado de convite por e-mail e atalho direto de WhatsApp com link de primeiro acesso, permitindo ao paciente definir sua senha e ingressar no portal de forma fluida e segura.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Ao salvar um novo paciente no consultório da nutricionista, disparar notificação de e-mail de boas-vindas com link de ativação da conta.
- [x] Exibir modal de sucesso com atalho de 1 clique para envio de convite via WhatsApp com texto personalizado e link de ativação.
- [x] Fornecer botão de cópia rápida do link de ativação (`#activation?email=...`).
- [x] Permitir que o paciente acesse o link (ou clique em "Primeiro Acesso" na tela de login), valide o código de segurança, crie sua senha pessoal e entre diretamente na sua área.

### 2. CSS Styling (UX Specialist)
- [x] Estilizar o modal de pós-cadastro do paciente com destaque para o botão de WhatsApp e status de e-mail em `style.css`.

### 3. HTML & JS Logic (Senior Developer)
- [x] Adicionar o modal `#patient-onboarding-success-modal` em `index.html`.
- [x] Atualizar `saveNewPatient()` para acionar a notificação e abrir o modal de convite.
- [x] Implementar `showPatientActivationStep()`, `activatePatientFirstAccess()`, `verifyPatientActivationCode()` e `submitPatientPasswordActivation()`.
- [x] Suportar roteamento por hash `#activation?email=...` na inicialização da aplicação.

### 4. QA Validation Specs (QA Tester)
- [x] Executar testes automatizados (`npm test`) garantindo integridade das rotas de ativação.

---

# Backlog: Exibição da Data de Cadastro na Lista de Pacientes (EP-07 Story 5)

Adicionar a coluna e a informação de "Data de Cadastro" (quando o paciente foi registrado no consultório) na tabela de Pacientes Cadastrados do painel da nutricionista e no cabeçalho do prontuário, assegurando a persistência automática da data em novos cadastros e a retrocompatibilidade com registros existentes.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Adicionar a coluna "Data Cadastro" (ou "Cadastrado em") na tabela de Pacientes Cadastrados da aba `tab-nutri-patients`.
- [x] Exibir a data de cadastro para cada paciente na lista em formato legível (ex: "10 de Janeiro de 2026" ou "16/06/2026").
- [x] Registrar a data atual automaticamente no atributo `createdAt` sempre que um novo paciente for cadastrado via `saveNewPatient()`.
- [x] Exibir a data de cadastro também no cabeçalho do modal de prontuário/perfil do paciente (`openPatientProfileModal`).

### 2. CSS Styling (UX Specialist)
- [x] Ajustar o layout e alinhamento da tabela `.patient-table` para acomodar a nova coluna mantendo harmonia visual e responsividade.

### 3. HTML & JS Logic (Senior Developer)
- [x] Atualizar o cabeçalho `<thead>` da tabela em `tab-nutri-patients` em `index.html`.
- [x] Atualizar a renderização dinâmica em `renderPatientsTable()` para injetar a coluna com `p.createdAt`.
- [x] Atualizar `saveNewPatient()` para salvar a data atual em `newPatient.createdAt`.
- [x] Adicionar rotina de backfill no `window.onload` para popular `createdAt` em pacientes legados salvos no `localStorage`.

### 4. QA Validation Specs (QA Tester)
- [x] Executar testes automatizados (`npm test`) sem regressões.

---

# Backlog: Central de Comunicação & Régua de Retenção de Pacientes (EP-07 Story 6)

Disponibilizar uma central completa de comunicação e engajamento no painel da nutricionista ("Comunicação & Retenção"), permitindo disparos em massa segmentados (E-mail e WhatsApp), seleção de templates pré-configurados e editáveis (Resgate de Inativos, Lançamento de Protocolos, Check-in Motivacional, Avisos), e radar de pacientes para contato com alertas de tempo sem retorno.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Criar item "Comunicação & Retenção" no menu lateral da Nutricionista (`#menu-nutricionista`).
- [x] Permitir segmentar o público-alvo: Todos, Ativos, Mentoria VIP, Inativos (+30 dias), Novos Pacientes e por Objetivo Clínico.
- [x] Oferecer biblioteca de templates pré-formatados e editáveis:
  - 🔄 Resgate de Inativo / Lembrete de Consulta de Retorno
  - 🌿 Divulgação de Novo Protocolo / Cardápio / E-book
  - 💧 Check-in Semanal de Motivação & Hidratação
  - 📢 Avisos Gerais / Comunicado do Consultório
- [x] Suportar múltiplos canais: Disparo por E-mail Institucional e Gerador de Fila WhatsApp personalizada.
- [x] Exibir "Radar de Retenção" com lista de pacientes que precisam de contato e atalho de 1 clique para WhatsApp.
- [x] Exibir histórico de comunicados e campanhas enviadas.

### 2. CSS Styling (UX Specialist)
- [x] Estilizar os cards de templates rápidos, seletor de segmentos, cards do radar de retenção e badges em `style.css`.
- [x] Utilizar as variáveis oficiais (`--primary-olive`, `--bronze-gold`, `--terracotta`, `--lavender`).

### 3. HTML & JS Logic (Senior Developer)
- [x] Adicionar o link no menu `#menu-nutricionista` e a seção `#tab-nutri-broadcast` em `index.html`.
- [x] Implementar funções `applyBroadcastTemplate()`, `updateBroadcastTargetCount()`, `sendNutriBroadcast()`, `renderNutriRetentionRadar()` e `renderNutriBroadcastHistory()`.

### 4. QA Validation Specs (QA Tester)
- [x] Executar testes automatizados (`npm test`) sem regressões.

---

# Backlog: Filtros Avançados de Pacientes & Agenda Semanal com Margem de Deslocamento e Tolerância (EP-07 Story 7)

Implementar filtros avançados (Status e Objetivo) na barra de pesquisa da Lista de Pacientes e criar a visualização de "Agenda Semanal" no painel da nutricionista com controle inteligente de duração (60m, 75m, 90m), tolerância pós-consulta e margem de deslocamento/trânsito pré e pós consulta presencial.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Adicionar filtros de Status e Objetivo na toolbar da tabela de pacientes em `tab-nutri-patients`.
- [x] Criar item "Agenda Semanal" no menu lateral da Nutricionista (`#menu-nutricionista`).
- [x] Criar a aba `#tab-nutri-schedule` com visão geral da semana (dias, horários ocupados, livres, presencial vs online).
- [x] Implementar regras de buffer time: margem de tolerância clínica (+15min) e margem de deslocamento para atendimento presencial (30min antes e 30min depois).
- [x] Exibir blocos visuais de trânsito/deslocamento e impedir sobreposição com outros agendamentos.
- [x] Permitir configurar as regras de agenda (duração padrão, margens de segurança).

### 2. CSS Styling (UX Specialist)
- [x] Estilizar a grade da agenda semanal (`.weekly-schedule-grid`), cartões de consultas presenciais/online, blocos de deslocamento (`.buffer-transit-card`) e filtros da tabela em `style.css`.

### 3. HTML & JS Logic (Senior Developer)
- [x] Atualizar a toolbar de `tab-nutri-patients` com os selects de status e objetivo e integrar a `filterPatientsList()`.
- [x] Adicionar a seção `#tab-nutri-schedule` e o modal `#schedule-settings-modal` em `index.html`.
- [x] Implementar funções `renderWeeklySchedule()`, `navigateScheduleWeek()`, `saveScheduleSettings()` e cálculo dinâmico de buffers de deslocamento.

### 4. QA Validation Specs (QA Tester)
- [x] Executar testes automatizados (`npm test`) sem regressões.

---

# Backlog: Sistema Multi-Canal de Notificações de Reagendamento e Cancelamento (EP-07 Story 8)

Garantir que sempre que uma consulta for **cancelada ou reagendada**, o paciente receba avisos automáticos em todos os canais: **WhatsApp**, **SMS**, **E-mail** e **Notificação In-App na Área do Paciente**, com banner de alerta em tempo real e atualização dinâmica do painel.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Ao **reagendar** uma consulta:
  - Disparar notificação por WhatsApp com nova data, horário, tipo e link de telemedicina/endereço.
  - Disparar SMS de confirmação de reagendamento.
  - Disparar E-mail institucional de alteração de horário.
  - Registrar Notificação In-App no portal do paciente e atualizar o card de "Próxima Consulta".
- [x] Ao **cancelar** uma consulta:
  - Disparar notificação por WhatsApp informando o cancelamento e link para remarcação.
  - Disparar SMS de aviso de cancelamento.
  - Disparar E-mail institucional com aviso e opções de novo agendamento.
  - Exibir banner de aviso de cancelamento na Área do Paciente com botão para agendar novo horário.
- [x] Criar modal de resumo de despacho multi-canal (`#appointment-dispatch-modal`) para feedback visual completo da nutricionista.

### 2. CSS Styling (UX Specialist)
- [x] Estilizar o modal de despacho multi-canal (`.dispatch-channel-card`, `.dispatch-status-badge`) e o banner in-app de avisos no portal do paciente em `style.css`.

### 3. HTML & JS Logic (Senior Developer)
- [x] Implementar função `notifyPatientAppointmentChange(type, apptData, oldData)` que orquestra os 4 canais.
- [x] Integrar disparos multi-canal em `saveNewAppointment()` (modo reagendamento) e `deleteAppointment()`.
- [x] Criar e gerenciar estado `patientNotifications` e renderizar o feed/banner na área do paciente (`loadPatientDashboard()`).
- [x] Adicionar o modal `#appointment-dispatch-modal` em `index.html`.

### 4. QA Validation Specs (QA Tester)
- [x] Executar suite de testes automatizados (`npm test`) sem regressões.

---

# Backlog: Gestão Segura de Senhas - Toggle de Visibilidade (Olho 👁️), Repetição de Senha e Validador de Força (EP-07 Story 9)

Implementar em todas as telas de autenticação, cadastro e ativação:
1. **Botão de Olho (Toggle de Visibilidade)**: Alternar visualização entre texto mascarado (`type="password"`) e texto aberto (`type="text"`).
2. **Campo Repetir Senha / Confirmação**: Validação em tempo real garantindo que as duas senhas sejam exatamente idênticas para avançar.
3. **Fator de Segurança (Validador de Força)**:
   - Mínimo de 8 caracteres
   - Pelo menos 1 letra maiúscula (`[A-Z]`)
   - Pelo menos 1 letra minúscula (`[a-z]`)
   - Pelo menos 1 número (`[0-9]`)
   - Pelo menos 1 caractere especial (`[!@#$%^&*(),.?":{}|<>]`)
   - Checklist visual dinâmico com ticks verdes e barra de força.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Implementar o toggle de visibilidade com ícone de olho em todos os campos de senha (Login, Cadastro Nutri, Cadastro Paciente, Ativação Paciente, Credenciamento Fornecedor, Esqueci Senha).
- [x] Adicionar campo "Repetir Senha" / "Confirmar Senha" em todos os fluxos de criação e redefinição de senha.
- [x] Exibir validador de força com barra de progresso e checklist dinâmico em tempo real de critérios de segurança (maiúscula, minúscula, número, caractere especial, tamanho mín. 8).
- [x] Exibir indicador visual de correspondência de senhas ("Senhas idênticas" vs "As senhas não conferem") e bloquear envio de formulário com senhas divergentes ou inseguras.

### 2. CSS Styling (UX Specialist)
- [x] Criar classes `.password-input-wrapper`, `.password-toggle-btn` com posicionamento absoluto e ícones SVG de olho aberto e fechado.
- [x] Estilizar a barra de força da senha `.password-strength-bar` com cores dinâmicas de acordo com o nível (fraca = vermelho/terracota, média = ouro/bronze, forte = verde oliva).
- [x] Estilizar o checklist de critérios de segurança `.password-criteria-list` com itens `.criteria-item` e ícones de validação reativos.
- [x] Estilizar o badge de correspondência de senhas `.password-match-badge`.

### 3. HTML & JS Logic (Senior Developer)
- [x] Adicionar wrappers e botões com `onclick="togglePasswordVisibility('inputId', this)"` em todos os inputs de senha em `index.html`.
- [x] Inserir os campos de confirmação de senha (`#nutri-reg-password-confirm`, `#pat-signup-password-confirm`, `#pat-act-password-confirm`, `#sup-reg-password-confirm`).
- [x] Inserir os containers visuais do validador de força (`#nutri-password-meter`, `#pat-signup-password-meter`, `#pat-act-password-meter`, `#sup-password-meter`).
- [x] Implementar funções `togglePasswordVisibility(inputId, btnEl)`, `evaluatePasswordStrength(password)`, `handlePasswordInputLive(passwordInputId, meterContainerId, confirmInputId, matchBadgeId)` e `validatePasswordSecurityAndMatch(password, passwordConfirm)`.
- [x] Integrar as validações de segurança em `registerNewNutri()`, `signupNewPatient()`, `submitPatientPasswordActivation()` e `accreditSupplier()`.

### 4. QA Validation Specs (QA Tester)
- [x] Criar testes unitários em Jest para a função de avaliação de força de senha (`evaluatePasswordStrength`) cobrindo todos os critérios.
- [x] Atualizar suítes Playwright e validar o preenchimento de confirmação de senha, o clique no toggle do olho e o bloqueio quando as senhas não conferem.
- [x] Executar `npm test` e `npx playwright test` com 100% de aprovação (23 unitários + 48 E2E).

---

# Backlog: Farmácia Parceira - Gestão de Propostas em Aberto, Cobrança Multi-Canal (WhatsApp/E-mail), Checkout PIX Dinâmico e Split de Comissões SaaS (EP-08 Story 1)

Implementar para a Farmácia de Manipulação Parceira:
1. **Gestão de Propostas em Aberto**: Visualização de todas as propostas enviadas e ainda não fechadas pelo paciente, com status em tempo real e tempo decorrido.
2. **Ações Rápidas de Cobrança / Follow-up Multi-Canal**:
   - Botão para cobrar/lembrar o paciente via **WhatsApp** com mensagem personalizada pré-formatada e link direto de checkout.
   - Botão para reenviar a proposta por **E-mail** institucional.
3. **Checkout com PIX Dinâmico e Cartão de Crédito**:
   - Geração de QR Code PIX dinâmico, código Pix Copia e Cola, contagem regressiva e confirmação de pagamento.
4. **Split de Pagamento & Comissionamento Automático do SaaS**:
   - Divisão automática entre comissão da plataforma (ex: 10%) e repasse líquido da farmácia (90%) em compras de fórmulas e suplementos.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Criar no painel da Farmácia a visualização de "Propostas Enviadas / Aguardando Fechamento" com detalhes da fórmula, valor e botões de ação.
- [x] Implementar as ações de follow-up: envio de lembrete por WhatsApp (`https://wa.me/...`) com link direto de pagamento e reenvio de e-mail.
- [x] Implementar no checkout modal a opção de pagamento via **PIX Dinâmico** com QR Code e Chave Copia e Cola.
- [x] Garantir o split de comissões automático e a exibição das métricas de repasse líquido no dashboard do fornecedor e comissão acumulada no cockpit do Master.

### 2. CSS Styling (UX Specialist)
- [x] Estilizar a tabela e os cards de propostas enviadas (`.quote-proposal-card`, `.proposal-action-btn`, `.proposal-status-badge`) em `style.css`.
- [x] Estilizar o container do PIX Dinâmico (`.pix-checkout-container`, `.pix-qrcode-box`, `.pix-copy-paste-box`, `.pix-timer-badge`) em `style.css`.

### 3. HTML & JS Logic (Senior Developer)
- [x] Atualizar `#tab-supplier-quotes` em `index.html` para incluir duas visões organizadas: "Cotações Pendentes de Resposta" e "Propostas Enviadas (Aguardando Fechamento)".
- [x] Implementar funções `renderSupplierQuotes()`, `sendSupplierQuoteWhatsAppFollowUp(prescriptionId, quoteId)` e `resendSupplierQuoteEmail(prescriptionId, quoteId)`.
- [x] Atualizar o modal `#checkout-modal` com a interface dinâmica de PIX (QR Code SVG, código Copia e Cola e simulação de confirmação).
- [x] Atualizar `processPayment()` para processar pagamentos PIX/Cartão com cálculo dinâmico de comissão da plataforma e repasse líquido.

### 4. QA Validation Specs (QA Tester)
- [x] Criar testes unitários em `tests/api/patient-nutri-flow.test.js` para a lógica de split de pagamentos e geração de links de WhatsApp.
- [x] Criar suite E2E Playwright `tests/e2e/supplier-quotes-pix.spec.js` cobrindo visualização de propostas em aberto, cobrança via WhatsApp, checkout via PIX dinâmico e split de comissão.
- [x] Executar `npm test` e `npx playwright test` com 100% de aprovação (25 unitários + 51 E2E).

---

# Backlog: Sincronização em Tempo Real de Agendamento Paciente-Nutricionista & Suspensão de Horários Ocupados (EP-10 Story 1)

Garantir que:
1. **Sincronização Imediata na Agenda da Nutricionista**: Ao confirmar um agendamento pelo login do paciente, a consulta reflete imediatamente na **Agenda Semanal** (`tab-nutri-schedule`) e na **Lista de Atendimentos** (`#nutri-appointments-list`) da respectiva nutricionista.
2. **Bloqueio / Suspensão Automática de Horários Ocupados**: O horário escolhido fica suspenso e marcado como **Ocupado / Indisponível** na agenda da nutricionista, impedindo que outro paciente marque o mesmo horário e evitando atendimentos duplicados.
3. **Liberação Automática do Horário em Caso de Cancelamento ou Remarcação**: Caso o paciente ou a nutricionista cancele ou altere o horário da consulta, aquele horário volta a ficar 100% disponível para novos agendamentos na plataforma.
4. **Isolamento por Nutricionista**: Os horários bloqueados pertencem exclusivamente à nutricionista com quem a consulta foi marcada, sem bloquear agendas de outras profissionais.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] O agendamento realizado pelo paciente deve gravar os dados com `nutriEmail`, `patientName`, `date`, `time`, `type` e `status: "Confirmado"` na chave persistente `amazing_franklin_appointments_list`.
- [x] O horário reservado deve ficar desabilitado e marcado como Ocupado no calendário de agendamento de outros pacientes para aquela nutricionista.
- [x] A consulta deve aparecer na Agenda Semanal (`renderWeeklySchedule`) e na Lista de Atendimentos (`renderAppointmentsList`) da nutricionista responsável.
- [x] Cancelamento ou reagendamento (pelo paciente ou pela nutricionista) deve liberar imediatamente o horário para novos agendamentos.

### 2. CSS Styling (UX Specialist)
- [x] Estilizar os horários ocupados `.time-slot.occupied`, `.time-slot.disabled` com indicação visual clara de indisponibilidade e hover proibido.
- [x] Estilizar a seção de "Minhas Consultas Agendadas" com botão de cancelamento no portal do paciente.

### 3. HTML & JS Logic (Senior Developer)
- [x] Criar função `isSameDayAppointment(dateVal, targetYear, targetMonthIndex, targetDay)` para compatibilizar e normalizar todos os formatos de data (ISO, DD/MM/YYYY, "DD de Mês de YYYY").
- [x] Criar função `isSlotOccupied(nutriEmail, year, month, day, timeStr)` para checar ocupação de horários.
- [x] Atualizar `renderPatientBookingTab()` para verificar horários ocupados e desabilitar seleção.
- [x] Atualizar `confirmBooking()` para validar se o horário ainda está livre antes de gravar, salvar em `amazing_franklin_appointments_list` e gerar URL completa de WhatsApp.
- [x] Atualizar `renderWeeklySchedule()` para usar `isSameDayAppointment()` e renderizar os agendamentos na coluna correta da semana.
- [x] Implementar `cancelPatientAppointment(apptId)` para permitir cancelamento direto pelo paciente com liberação imediata do horário.

### 4. QA Validation Specs (QA Tester)
- [x] Criar suite E2E Playwright validando agendamento pelo paciente, bloqueio do horário para outros pacientes, exibição na agenda da nutricionista e liberação do horário após cancelamento.
- [x] Executar `npm test` garantindo zero regressões em todos os testes unitários.

---

# Backlog: Ficha Clínica - Upload e Pré-Visualização de Fotos de Evolução Visual (Campo 4)

Implementar e corrigir o upload das Fotos de Evolução Visual (Foto de Antes e Foto de Depois) na aba de Novo Atendimento da Nutricionista:
1. **Separação de Handlers**: Desacoplar `handleConsultPhotoUpload` do upload de avatar de perfil para evitar conflitos de escopo.
2. **Pré-visualização Visual ao Vivo**: Miniaturas em tempo real com moldura destacada no padrão visual da plataforma.
3. **Ações de Remoção e Reset**: Botão flutuante para excluir/substituir a foto e reset automático ao salvar ou limpar a consulta.
4. **Validação e Persistência**: Gravação no histórico clínico do paciente no momento do salvamento da consulta.

## 🛠️ Implementation Checklist

### 1. HTML & JS Logic (Senior Developer)
- [x] Desacoplar funções criando `handleConsultPhotoUpload(event, type)` e `handleNutriAvatarUpload(event)`.
- [x] Implementar containers de preview dinâmico (`#preview-container-before` e `#preview-container-after`) com botão de remoção rápida (`removeConsultPhoto`).
- [x] Sincronizar persistência em `tempPhotoBefore` e `tempPhotoAfter` e gravação no histórico clínico do paciente.

### 2. QA Validation Specs (QA Tester)
- [x] Executar `npm test` (Jest): 25/25 testes aprovados.
- [x] Executar testes E2E Playwright: todos aprovados com 100% de sucesso.

---

# Backlog: Real-Time Bidirectional Patient-Nutritionist Chat & Support Desk (EP-11 Story 1)

This story removes canned bot responses and implements a real, bidirectional communication channel between each patient and their assigned nutritionist:
1. **No Bot / No Canned Responses**: The patient sends real messages that are routed to their designated nutritionist's inbox.
2. **Nutritionist Direct Inbox**: The nutritionist views conversations grouped by patient with unread indicators, patient profile badge, and direct reply composer.
3. **Real-Time Bidirectional Sync**: Messages sent by the nutritionist are immediately visible to the patient, and vice versa, with accurate timestamps and sender attribution.
4. **Assigned Nutritionist Attribution**: The chat header dynamically displays the assigned nutritionist's name and photo rather than generic hardcoded strings.

## 🛠️ Implementation Checklist

### 1. Product Owner (PO Requirements & Acceptance Criteria)
- [x] Eliminar completamente respostas automáticas e respostas fakes/bot (`chatBotResponses`) do chat.
- [x] Cada mensagem enviada pelo paciente deve ser salva e vinculada ao e-mail da nutricionista que o atende (`patient.nutriEmail`).
- [x] No portal da Nutricionista, a aba `tab-chat` deve permitir selecionar o paciente e responder diretamente com histórico contínuo da conversa.
- [x] O cabeçalho do chat do paciente deve exibir o nome e foto da sua nutricionista responsável.
- [x] Persistência segura em `localStorage` sob `amazing_franklin_patient_chats`.

### 2. CSS Styling (UX Specialist)
- [x] Estilizar a lista de conversas da nutricionista (`.nutri-chat-patient-list`, `.nutri-chat-patient-item.active`, `.chat-unread-badge`).
- [x] Estilizar os balões de mensagem com avatar do remetente, data/hora formatada e indicação visual de leitura.
- [x] Garantir layout responsivo no desktop (lista à esquerda + chat à direita) e mobile.

### 3. HTML & JS Logic (Senior Developer)
- [x] Criar estrutura de dados `amazing_franklin_patient_chats` indexada por ID/Email do paciente e Nutricionista.
- [x] Atualizar `renderChatMessages()` para renderizar o histórico real do paciente ativo com sua nutricionista.
- [x] Implementar a visão da nutricionista com seletor de pacientes (`renderNutriChatInbox()`, `selectPatientChat()`).
- [x] Atualizar `sendChatMessage()` para enviar mensagem real sem disparar respostas automáticas, sincronizando os dois lados em tempo real.

### 4. QA Validation Specs (QA Tester)
- [x] Criar teste Playwright `tests/e2e/test-realtime-patient-nutri-chat.spec.js` validando:
  - Envio de mensagem pelo paciente Alexandre para a Dra. Tatiane Cardoso sem resposta automática.
  - Recepção e visualização da mensagem no portal da nutricionista.
  - Resposta enviada pela nutricionista e recebimento no portal do paciente.
- [x] Executar `npm test` garantindo zero regressões.
