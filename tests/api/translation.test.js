// ============================================================================
// SUITE DE TESTES UNITÁRIOS DE TRADUÇÃO DINÂMICA (i18n)
// Caminho: tests/api/translation.test.js
// ============================================================================

const fs = require('fs');
const path = require('path');

// Ler o index.html para analisar a estrutura do dicionário
const htmlPath = path.join(__dirname, '../../index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Extrair o dicionário i18n via regex
const i18nMatch = htmlContent.match(/const i18n = ({[\s\S]*?});/);
if (!i18nMatch) {
  throw new Error('Falha ao encontrar o dicionário i18n no arquivo index.html');
}

// Avaliar o dicionário i18n de forma segura para obter o objeto JS
const i18n = eval('(' + i18nMatch[1] + ')');

describe('Testes Unitários do Sistema de Tradução Dinâmica (i18n)', () => {
  
  test('O dicionário de tradução deve possuir os idiomas suportados (pt, en, es)', () => {
    expect(i18n).toHaveProperty('pt');
    expect(i18n).toHaveProperty('en');
    expect(i18n).toHaveProperty('es');
  });

  test('Todos os idiomas do dicionário devem ter exatamente as mesmas chaves de tradução', () => {
    const ptKeys = Object.keys(i18n.pt).sort();
    const enKeys = Object.keys(i18n.en).sort();
    const esKeys = Object.keys(i18n.es).sort();

    // Validar contagem de chaves
    expect(enKeys.length).toBe(ptKeys.length);
    expect(esKeys.length).toBe(ptKeys.length);

    // Validar equivalência exata das chaves
    expect(enKeys).toEqual(ptKeys);
    expect(esKeys).toEqual(ptKeys);
  });

  test('Valores de chaves críticas não devem ser vazios ou indefinidos', () => {
    const languages = ['pt', 'en', 'es'];
    
    languages.forEach(lang => {
      Object.entries(i18n[lang]).forEach(([key, val]) => {
        expect(val).toBeDefined();
        expect(typeof val).toBe('string');
        expect(val.length).toBeGreaterThan(0);
      });
    });
  });

  test('Deve traduzir elementos do DOM corretamente (Simulação de changeLanguage)', () => {
    // Estado global simulado
    let currentLang = 'pt';
    let activeRole = 'paciente';

    // Mock simples dos elementos do DOM
    const mockElements = [
      {
        tagName: 'SPAN',
        attributes: { 'data-i18n': 'welcome' },
        innerText: '',
        getAttribute(attr) { return this.attributes[attr]; },
        querySelector() { return null; }
      },
      {
        tagName: 'INPUT',
        attributes: { 'data-i18n': 'lblPassword' },
        placeholder: '',
        getAttribute(attr) { return this.attributes[attr]; }
      },
      {
        tagName: 'BUTTON',
        attributes: { 'data-i18n': 'btnVerify2FA' },
        innerText: '',
        getAttribute(attr) { return this.attributes[attr]; },
        querySelector() { return null; }
      },
      {
        tagName: 'SPAN',
        attributes: { 'data-i18n': 'rememberMe' },
        innerText: '',
        getAttribute(attr) { return this.attributes[attr]; },
        querySelector() { return null; }
      }
    ];

    // Implementação mockada de changeLanguage contendo a lógica central de index.html
    function changeLanguageMock(lang) {
      currentLang = lang;
      const dict = i18n[lang];
      
      mockElements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = dict[key];
          } else {
            el.innerText = dict[key];
          }
        }
      });
    }

    // 1. Testar tradução em Português
    changeLanguageMock('pt');
    expect(mockElements[0].innerText).toBe(i18n.pt.welcome);
    expect(mockElements[1].placeholder).toBe(i18n.pt.lblPassword);
    expect(mockElements[2].innerText).toBe(i18n.pt.btnVerify2FA);
    expect(mockElements[3].innerText).toBe(i18n.pt.rememberMe);

    // 2. Testar tradução em Inglês
    changeLanguageMock('en');
    expect(mockElements[0].innerText).toBe(i18n.en.welcome);
    expect(mockElements[1].placeholder).toBe(i18n.en.lblPassword);
    expect(mockElements[2].innerText).toBe(i18n.en.btnVerify2FA);
    expect(mockElements[3].innerText).toBe(i18n.en.rememberMe);

    // 3. Testar tradução em Espanhol
    changeLanguageMock('es');
    expect(mockElements[0].innerText).toBe(i18n.es.welcome);
    expect(mockElements[1].placeholder).toBe(i18n.es.lblPassword);
    expect(mockElements[2].innerText).toBe(i18n.es.btnVerify2FA);
    expect(mockElements[3].innerText).toBe(i18n.es.rememberMe);
  });
});
