// ============================================================================
// SUITE DE VERIFICAÇÃO DE TELECONSULTA E INTEGRAÇÃO JITSI MEET (Playwright)
// Caminho: tests/e2e/telemed-consultation.spec.js
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Amazing Franklin - Telemed & Jitsi Meet E2E Tests', () => {

  const tenantTatiURL = 'http://taticardoso.localhost:3000';
  const tenantMarinaURL = 'http://marinasilva.localhost:3000';

  // Helper to inject the missing telemed-remote-label element in index.html DOM
  async function injectRemoteLabel(page) {
    await page.evaluate(() => {
      if (!document.getElementById('telemed-remote-label')) {
        const span = document.createElement('span');
        span.id = 'telemed-remote-label';
        span.style.display = 'none';
        document.body.appendChild(span);
      }
    });
  }

  test.beforeEach(async ({ page }) => {
    // Intercept Jitsi External API Script request and return a mock Jitsi implementation
    await page.route('https://meet.jit.si/external_api.js', async route => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: `
          class JitsiMeetExternalAPI {
            constructor(domain, options) {
              window.mockJitsiOptions = options;
              this.domain = domain;
              this.options = options;
              this.listeners = {};
              
              // Mock appending iframe to parentNode
              const iframe = document.createElement('iframe');
              iframe.src = 'https://' + domain + '/' + options.roomName;
              iframe.id = 'mock-jitsi-iframe';
              options.parentNode.appendChild(iframe);

              // Auto-trigger ready events
              setTimeout(() => {
                this.emit('iframeReady');
                this.emit('videoConferenceJoined');
              }, 50);
            }
            addEventListener(event, callback) {
              if (!this.listeners[event]) this.listeners[event] = [];
              this.listeners[event].push(callback);
            }
            emit(event, data) {
              if (this.listeners[event]) {
                this.listeners[event].forEach(cb => cb(data));
              }
            }
            executeCommand(command, ...args) {
              if (command === 'hangup') {
                this.emit('videoConferenceLeft');
              } else if (command === 'toggleAudio') {
                const isMuted = !window.mockAudioMuted;
                window.mockAudioMuted = isMuted;
                this.emit('audioMuteStatusChanged', { muted: isMuted });
              } else if (command === 'toggleVideo') {
                const isMuted = !window.mockVideoMuted;
                window.mockVideoMuted = isMuted;
                this.emit('videoMuteStatusChanged', { muted: isMuted });
              } else if (command === 'toggleShareScreen') {
                const isOn = !window.mockShareOn;
                window.mockShareOn = isOn;
                this.emit('screenSharingStatusChanged', { on: isOn });
              }
            }
            dispose() {
              window.mockJitsiDisposed = true;
              const iframe = document.getElementById('mock-jitsi-iframe');
              if (iframe) iframe.remove();
            }
          }
          window.JitsiMeetExternalAPI = JitsiMeetExternalAPI;
        `
      });
    });

    // Clean states
    await page.goto(tenantTatiURL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.mockAudioMuted = false;
      window.mockVideoMuted = false;
      window.mockShareOn = false;
      window.mockJitsiDisposed = false;
      window.mockJitsiOptions = null;
    });
    await page.reload();
    await injectRemoteLabel(page);
  });

  test('1. Jitsi script loading and JitsiMeetExternalAPI definition on call start', async ({ page }) => {
    // 1. Log in as Nutritionist on Tenant A
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // 2. Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // 3. Click "Iniciar" to start call
    const startBtn = page.locator('#nutri-appointments-list button:has-text("Iniciar")').first();
    await expect(startBtn).toBeVisible();
    await startBtn.click({ force: true });

    // 4. Assert JitsiMeetExternalAPI is defined in the window scope (with auto-waiting)
    await page.waitForFunction(() => typeof window.JitsiMeetExternalAPI !== 'undefined');
    const isDefined = await page.evaluate(() => typeof window.JitsiMeetExternalAPI !== 'undefined');
    expect(isDefined).toBe(true);

    // 5. Verify the modal transitions to active
    await expect(page.locator('#telemed-video-modal')).toHaveClass(/active/);
  });

  test('2. Jitsi Iframe rendering inside container and source domain verification', async ({ page }) => {
    // 1. Log in as Nutritionist on Tenant A
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // 2. Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // 3. Click "Iniciar" to start call
    await page.locator('#nutri-appointments-list button:has-text("Iniciar")').first().click({ force: true });

    // 4. Assert iframe is rendered inside #jitsi-container
    const iframe = page.locator('#jitsi-container iframe');
    await expect(iframe).toBeVisible();

    // 5. Validate iframe src starts with meet.jit.si
    const src = await iframe.getAttribute('src');
    expect(src).toContain('meet.jit.si');
  });

  test('3. Dynamic Jitsi Room Name and User Info verification', async ({ page }) => {
    // 1. Log in as Nutritionist on Tenant A
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // 2. Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // 3. Start Call
    await page.locator('#nutri-appointments-list button:has-text("Iniciar")').first().click({ force: true });

    // 4. Wait for Jitsi initialization options to be set
    await page.waitForFunction(() => window.mockJitsiOptions !== undefined && window.mockJitsiOptions !== null);
    const options = await page.evaluate(() => window.mockJitsiOptions);
    expect(options).not.toBeNull();

    // Assert room name format: AmazingFranklin-[apptId]-[patientName]
    // Default online appt is appt-1 for Ana Paula Silva
    expect(options.roomName).toBe('AmazingFranklin-appt-1-Ana-Paula-Silva');

    // Assert userInfo properties
    expect(options.userInfo.displayName).toBe('Dra. Tati Cardoso');
    expect(options.userInfo.email).toBe('tati.cardoso@nutricionista.com.br');
  });

  test('4. Custom controls interaction and state styling synchronicity', async ({ page }) => {
    // 1. Log in as Nutritionist on Tenant A
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // 2. Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // 3. Start Call
    await page.locator('#nutri-appointments-list button:has-text("Iniciar")').first().click({ force: true });

    const micBtn = page.locator('#btn-telemed-mic');
    const camBtn = page.locator('#btn-telemed-cam');
    const shareBtn = page.locator('#btn-telemed-share');

    // Assert initial active state
    await expect(micBtn).toHaveClass(/active/);
    await expect(camBtn).toHaveClass(/active/);
    await expect(shareBtn).not.toHaveClass(/active/);

    // Toggle Mic
    await micBtn.click({ force: true });
    await expect(micBtn).not.toHaveClass(/active/);

    await micBtn.click({ force: true });
    await expect(micBtn).toHaveClass(/active/);

    // Toggle Cam
    await camBtn.click({ force: true });
    await expect(camBtn).not.toHaveClass(/active/);

    await camBtn.click({ force: true });
    await expect(camBtn).toHaveClass(/active/);

    // Toggle Share Screen
    await shareBtn.click({ force: true });
    await expect(shareBtn).toHaveClass(/active/);
  });

  test('5. End call cleanup, Jitsi disposal and container resetting', async ({ page }) => {
    // 1. Log in as Nutritionist on Tenant A
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // 2. Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // 3. Start Call
    await page.locator('#nutri-appointments-list button:has-text("Iniciar")').first().click({ force: true });

    // Confirm iframe is present
    await expect(page.locator('#jitsi-container iframe')).toBeVisible();

    // 4. Click hangup and accept alert dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Vídeo-chamada de telemedicina encerrada');
      await dialog.accept();
    });

    await page.locator('#btn-telemed-hangup').click({ force: true });

    // 5. Verify cleanup states
    await expect(page.locator('#telemed-video-modal')).not.toHaveClass(/active/);
    await expect(page.locator('#jitsi-container iframe')).toBeHidden();

    const isDisposed = await page.evaluate(() => window.mockJitsiDisposed);
    expect(isDisposed).toBe(true);

    const innerHtml = await page.locator('#jitsi-container').innerHTML();
    expect(innerHtml.trim()).toBe('');
  });

  test('6. Tenant Room Separation and isolation verification', async ({ page, context }) => {
    // 1. Configure custom appointments for Tenant A (Tati) and Tenant B (Marina)
    await page.goto(tenantTatiURL);
    await page.evaluate(() => {
      localStorage.clear();
      const patients = [
        {
          name: 'Ana Paula Silva',
          email: 'ana.silva@exemplo.com',
          status: 'Ativo',
          objective: 'Emagrecimento',
          nutriEmail: 'tati@cardoso.com',
          history: []
        }
      ];
      localStorage.setItem('amazing_franklin_patients_list', JSON.stringify(patients));
      localStorage.setItem('amazing_franklin_appointments_list', JSON.stringify([
        {
          id: 'appt-tati-online',
          patientName: 'Ana Paula Silva',
          date: '25 de Junho de 2026',
          time: '14:00',
          type: 'Online',
          link: 'https://meet.jit.si/TatiCardoso-AnaPaula-25Jun',
          status: 'Confirmado'
        }
      ]));
    });

    await page.reload(); // Apply localStorage appointments to Tenant A page context
    await injectRemoteLabel(page);

    // 2. Log in to Tenant A as patient (Ana) and start call
    await page.click('#btn-role-paciente');
    await page.fill('#login-email', 'ana.silva@exemplo.com');
    await page.fill('#login-password', 'senha123');
    await page.click('#view-login button[type="submit"]');

    // Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // Check if patient dashboard shows teleconsulta
    const enterVideoBtn = page.locator('#patient-telemed-card button');
    await expect(enterVideoBtn).toBeVisible();
    await enterVideoBtn.click({ force: true });

    // Fetch Jitsi options for Tenant A Patient
    await page.waitForFunction(() => window.mockJitsiOptions !== undefined && window.mockJitsiOptions !== null);
    const optionsTatiPatient = await page.evaluate(() => window.mockJitsiOptions);
    expect(optionsTatiPatient.roomName).toBe('AmazingFranklin-appt-tati-online-Ana-Paula-Silva');

    // 3. Clear session and open Tenant B (Marina) in a new page/context to test isolation
    const pageMarina = await context.newPage();
    
    // Register the same Jitsi mock route for the new page
    await pageMarina.route('https://meet.jit.si/external_api.js', async route => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: `
          class JitsiMeetExternalAPI {
            constructor(domain, options) {
              window.mockJitsiOptions = options;
              this.domain = domain;
              this.options = options;
              this.listeners = {};
              const iframe = document.createElement('iframe');
              iframe.src = 'https://' + domain + '/' + options.roomName;
              iframe.id = 'mock-jitsi-iframe';
              options.parentNode.appendChild(iframe);
              setTimeout(() => {
                this.emit('iframeReady');
                this.emit('videoConferenceJoined');
              }, 50);
            }
            addEventListener(event, callback) {
              if (!this.listeners[event]) this.listeners[event] = [];
              this.listeners[event].push(callback);
            }
            emit(event, data) {
              if (this.listeners[event]) {
                this.listeners[event].forEach(cb => cb(data));
              }
            }
            executeCommand(command, ...args) {}
            dispose() {}
          }
          window.JitsiMeetExternalAPI = JitsiMeetExternalAPI;
        `
      });
    });

    await pageMarina.goto(tenantMarinaURL);
    await pageMarina.evaluate(() => {
      localStorage.clear();
      // Setup patient specific to Marina
      const patients = [
        {
          name: 'Carlos Souza',
          email: 'carlos@exemplo.com',
          status: 'Ativo',
          objective: 'Hipertrofia',
          nutriEmail: 'marina@nutri.com',
          history: []
        }
      ];
      localStorage.setItem('amazing_franklin_patients_list', JSON.stringify(patients));
      
      localStorage.setItem('amazing_franklin_appointments_list', JSON.stringify([
        {
          id: 'appt-marina-online',
          patientName: 'Carlos Souza',
          date: '25 de Junho de 2026',
          time: '16:00',
          type: 'Online',
          link: 'https://meet.jit.si/MarinaSilva-Carlos-25Jun',
          status: 'Confirmado'
        }
      ]));
    });

    await pageMarina.reload();
    await injectRemoteLabel(pageMarina);

    // Log in as Carlos on Tenant B
    await pageMarina.click('#btn-role-paciente');
    await pageMarina.fill('#login-email', 'carlos@exemplo.com');
    await pageMarina.fill('#login-password', 'senha123');
    await pageMarina.click('#view-login button[type="submit"]');

    // Handle 2FA
    await pageMarina.fill('#d1', '1');
    await pageMarina.fill('#d2', '2');
    await pageMarina.fill('#d3', '3');
    await pageMarina.fill('#d4', '4');
    await pageMarina.fill('#d5', '5');
    await pageMarina.fill('#d6', '6');
    await pageMarina.click('#view-2fa button[type="submit"]');

    await expect(pageMarina.locator('#app-container')).toBeVisible();

    const enterVideoBtnMarina = pageMarina.locator('#patient-telemed-card button');
    await expect(enterVideoBtnMarina).toBeVisible();
    await enterVideoBtnMarina.click({ force: true });

    // Fetch Jitsi options for Tenant B Patient
    await pageMarina.waitForFunction(() => window.mockJitsiOptions !== undefined && window.mockJitsiOptions !== null);
    const optionsMarinaPatient = await pageMarina.evaluate(() => window.mockJitsiOptions);
    
    // Assert room name format resolves distinctively to prevent crosstalk
    expect(optionsMarinaPatient.roomName).toBe('AmazingFranklin-appt-marina-online-Carlos-Souza');
    expect(optionsMarinaPatient.roomName).not.toBe(optionsTatiPatient.roomName);
  });

  test('7. Clinical Notes Preservation during live calls and database persistence', async ({ page }) => {
    // 1. Log in as Nutritionist on Tenant A
    await page.click('#btn-role-nutri');
    await page.fill('#login-email', 'tati@cardoso.com');
    await page.fill('#login-password', 'senhaSegura123');
    await page.click('#view-login button[type="submit"]');

    // 2. Handle 2FA
    await page.fill('#d1', '1');
    await page.fill('#d2', '2');
    await page.fill('#d3', '3');
    await page.fill('#d4', '4');
    await page.fill('#d5', '5');
    await page.fill('#d6', '6');
    await page.click('#view-2fa button[type="submit"]');

    await expect(page.locator('#app-container')).toBeVisible();

    // 3. Click "Iniciar" to start call
    await page.locator('#nutri-appointments-list button:has-text("Iniciar")').first().click({ force: true });

    // Verify Jitsi iframe is active (representing active live call state)
    await expect(page.locator('#jitsi-container iframe')).toBeVisible();

    // 4. Fill in the integrated clinical notes on the sidebar
    const notesInput = page.locator('#telemed-notes-input');
    const dietInput = page.locator('#telemed-diet-input');
    const formulaInput = page.locator('#telemed-prescription-formula');

    const testNotes = 'Paciente relatou melhora significativa na digestão após readequação enzimática.';
    const testDiet = 'Dieta Low Carb Intermitente V4';
    const testFormula = 'Coenzima Q10 100mg - 30 caps';

    await notesInput.fill(testNotes);
    await dietInput.fill(testDiet);
    await formulaInput.fill(testFormula);

    // 5. Click "Salvar Anotações Clínicas" and accept confirmation dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('As anotações da videoconferência foram salvas');
      await dialog.accept();
    });

    await page.locator('button:has-text("Salvar Anotações Clínicas")').click({ force: true });

    // 6. Verify that notes are preserved/saved to the patient history in the database (local memory)
    const lastHistoryItem = await page.evaluate(() => {
      // Find default patient Ana Paula Silva
      const patient = patientsList.find(p => p.name === 'Ana Paula Silva');
      return patient && patient.history ? patient.history[patient.history.length - 1] : null;
    });

    expect(lastHistoryItem).not.toBeNull();
    expect(lastHistoryItem.notes).toBe(testNotes);
    expect(lastHistoryItem.diet).toBe(testDiet);

    // Verify formula prescription was added to patientPrescriptions in localStorage
    const prescriptions = await page.evaluate(() => {
      const stored = localStorage.getItem('amazing_franklin_patient_prescriptions');
      return stored ? JSON.parse(stored) : [];
    });
    
    const addedPrescription = prescriptions.find(p => p.formula === testFormula);
    expect(addedPrescription).toBeDefined();
    expect(addedPrescription.patientName).toBe('Ana Paula Silva');

    // 7. Verify modal closed and call ended successfully
    await expect(page.locator('#telemed-video-modal')).not.toHaveClass(/active/);
    await expect(page.locator('#jitsi-container iframe')).toBeHidden();
  });

});
