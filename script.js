/* ============================================================
   CHURRASCÔMETRO – script.js
   Calculadora de churrasco mais completa do Brasil 🔥
   ============================================================ */

'use strict';

/* ----------------------------------------------------------------
   DADOS BASE
   Todos os valores por adulto, perfil médio, 5 horas de churrasco
----------------------------------------------------------------- */
const BASE = {
  // Carnes (g por adulto)
  carnes: {
    economico: {
      picanha:  150,
      costela:  150,
      frango:   130,
      linguica: 100,
    },
    medio: {
      picanha:  250,
      costela:  220,
      frango:   180,
      linguica: 130,
    },
    premium: {
      picanha:   350,
      costela:   280,
      frango:    180,
      linguica:  130,
      maminha:   180,
      queijocualho: 100,
    },
  },

  // Cervejas (latas 350 ml por adulto)
  cerveja: { economico: 3, medio: 5, premium: 7 },

  // Refrigerante (ml por pessoa)
  refri:   { economico: 350, medio: 550, premium: 800 },

  // Água (ml por pessoa)
  agua:    { economico: 500, medio: 700, premium: 1000 },

  // Acompanhamentos (g por pessoa)
  acomp: {
    farofa:    { economico: 80,  medio: 100, premium: 120 },
    maionese:  { economico: 40,  medio: 55,  premium: 70  },
    paodeAlho: { economico: 1,   medio: 2,   premium: 3   }, // unidades
  },

  // Preços médios 2025 (BRL)
  precos: {
    picanha:      100, // R$/kg
    costela:       50,
    frango:        23,
    linguica:      30,
    maminha:       72,
    queijocualho:  60,
    legumes:       15,
    halloumi:      55,
    cerveja350:     5, // R$/lata
    vinho:         45, // R$/garrafa 750ml
    refri2L:       10,
    agua500:        2.5,
    gelo5kg:       10,
    limao:          1,   // por unidade
    cachaca700:    32,
    farofa500g:    12,
    maionese250:    8,
    paodeAlho:      4,   // por unidade
    tomate:         4,   // R$/kg
    cebola:         5,   // R$/kg
    carvao5kg:     30,
  },
};

/* ----------------------------------------------------------------
   DADOS DO RESULTADO (globais para o compartilhamento)
----------------------------------------------------------------- */
let resultData = {};

/* ----------------------------------------------------------------
   NAVEGAÇÃO
----------------------------------------------------------------- */
function goToStep(n) {
  if (n === 2) {
    const adultos = parseInt(document.getElementById('adultos').value);
    if (adultos < 1) {
      alert('Adicione pelo menos 1 adulto para continuar. 😄');
      return;
    }
  }

  [1, 2, 3].forEach(i => {
    const el = document.getElementById('step' + i);
    if (el) el.classList.toggle('hidden', i !== n);

    const sni = document.getElementById('sni-' + i);
    if (sni) {
      sni.classList.toggle('active', i === n);
      sni.classList.toggle('done',   i < n);
    }

    const snl = document.getElementById('snl-' + i);
    if (snl) snl.classList.toggle('done', i < n);
  });

  if (n > 1) window.scrollTo({ top: document.getElementById('calculadora').offsetTop - 20, behavior: 'smooth' });
}

/* ----------------------------------------------------------------
   COUNTER INPUTS
----------------------------------------------------------------- */
function changeCount(id, delta) {
  const input = document.getElementById(id);
  const min = parseInt(input.min ?? 0);
  const max = parseInt(input.max ?? 9999);
  const val = Math.min(max, Math.max(min, (parseInt(input.value) || 0) + delta));
  input.value = val;
}

/* ----------------------------------------------------------------
   HELPERS
----------------------------------------------------------------- */
function kgStr(grams) {
  if (grams >= 1000) {
    const kg = (grams / 1000).toFixed(1).replace('.', ',');
    return kg + ' kg';
  }
  return grams + ' g';
}

function fmt(n) { return n.toLocaleString('pt-BR'); }

function fmtBRL(n) { return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

/* ----------------------------------------------------------------
   CORE CALCULATION
----------------------------------------------------------------- */
function calcular() {
  const adultos  = parseInt(document.getElementById('adultos').value)  || 0;
  const criancas = parseInt(document.getElementById('criancas').value) || 0;
  const duracao  = parseInt(document.getElementById('duracao').value)  || 5;
  const horario  = document.querySelector('input[name="horario"]:checked').value;
  const perfil   = document.querySelector('input[name="perfil"]:checked').value;
  const vegPct   = parseInt(document.querySelector('input[name="veg"]:checked').value);

  const temCerveja    = document.getElementById('cb-cerveja').checked;
  const temCaipirinha = document.getElementById('cb-caipirinha').checked;
  const temVinho      = document.getElementById('cb-vinho').checked;
  const temRefri      = document.getElementById('cb-refri').checked;
  const temAgua       = document.getElementById('cb-agua').checked;

  // Multiplicador de duração
  let durMult = 1;
  if      (horario === 'diaall') durMult = 1.7;
  else if (duracao <= 3)          durMult = 0.75;
  else if (duracao > 6)           durMult = 1.3;

  const vegRatio  = vegPct / 100;
  const carneiros  = adultos * (1 - vegRatio);   // adultos não-vegetarianos
  const carneirosCriancas = criancas * (1 - vegRatio);
  const totalPessoas = adultos + criancas;

  // ---- CARNES ----
  const receitaCarne = BASE.carnes[perfil];
  const carnes = {};
  let totalCarneGramas = 0;

  for (const [corte, gPP] of Object.entries(receitaCarne)) {
    const g = Math.round((carneiros * gPP + carneirosCriancas * gPP * 0.45) * durMult);
    carnes[corte] = g;
    totalCarneGramas += g;
  }

  // Opções vegetarianas
  const vegAdultos = adultos * vegRatio;
  if (vegAdultos > 0) {
    carnes.legumes    = Math.round(vegAdultos * (perfil === 'premium' ? 350 : 280) * durMult);
    if (perfil !== 'economico') carnes.halloumi = Math.round(vegAdultos * 150 * durMult);
    totalCarneGramas += (carnes.legumes || 0) + (carnes.halloumi || 0);
  }

  // ---- BEBIDAS ----
  const bebidas = {};

  if (temCerveja && adultos > 0) {
    const latas = Math.round(adultos * BASE.cerveja[perfil] * durMult);
    bebidas.cerveja = { latas, longnecks: Math.ceil(latas * 350 / 600) };
  }

  if (temCaipirinha && adultos > 0) {
    const porcoes = Math.round(adultos * (horario === 'diaall' ? 4 : 2) * durMult);
    bebidas.caipirinha = {
      limoes:   Math.ceil(porcoes / 2),
      cachaca:  Math.ceil(porcoes * 50 / 700), // garrafas 700ml
      acucar:   Math.round(porcoes * 15),       // g
    };
  }

  if (temVinho && adultos > 0) {
    bebidas.vinho = { garrafas: Math.ceil(adultos / 4 * durMult) };
  }

  if (temRefri) {
    const mlTotal = Math.round(totalPessoas * BASE.refri[perfil] * durMult);
    bebidas.refri = { ml: mlTotal, garrafas2L: Math.ceil(mlTotal / 2000) };
  }

  if (temAgua) {
    const mlTotal = Math.round(totalPessoas * BASE.agua[perfil] * durMult);
    bebidas.agua = { ml: mlTotal, garrafas500: Math.ceil(mlTotal / 500) };
  }

  // Gelo
  const geloKg = Math.max(2, Math.ceil(totalPessoas * (horario === 'diaall' ? 0.8 : 0.5)));
  bebidas.gelo = { kg: geloKg };

  // ---- ACOMPANHAMENTOS ----
  const acomp = {};
  const baseAcomp = BASE.acomp;

  acomp.farofa    = Math.round(totalPessoas * baseAcomp.farofa[perfil]    * durMult);
  acomp.maionese  = Math.round(totalPessoas * baseAcomp.maionese[perfil]  * durMult);
  acomp.paodeAlho = Math.round(totalPessoas * baseAcomp.paodeAlho[perfil] * durMult);

  // Vinagrete
  acomp.tomate = Math.ceil(totalPessoas / 3);
  acomp.cebola = Math.ceil(totalPessoas / 4);

  if (perfil !== 'economico') acomp.arroz = Math.round(totalPessoas * 80);

  if (perfil === 'premium') {
    acomp.mandioca = Math.round(totalPessoas * 150);
    acomp.salada   = Math.ceil(totalPessoas / 5); // pés de alface
  }

  // ---- CARVÃO ----
  const carvaoKg   = Math.max(3, Math.ceil(totalCarneGramas / 1000 * 1.3));
  const carvaoSacos = Math.ceil(carvaoKg / 5);

  // ---- ORÇAMENTO ----
  const p = BASE.precos;
  let custoMin = 0, custoMax = 0;

  // Carnes
  const precoCarne = {
    picanha:      { min: 80,  max: 130 },
    costela:      { min: 40,  max: 65  },
    frango:       { min: 18,  max: 28  },
    linguica:     { min: 22,  max: 40  },
    maminha:      { min: 58,  max: 85  },
    queijocualho: { min: 45,  max: 80  },
    legumes:      { min: 8,   max: 20  },
    halloumi:     { min: 40,  max: 75  },
  };

  for (const [corte, g] of Object.entries(carnes)) {
    if (precoCarne[corte]) {
      custoMin += (g / 1000) * precoCarne[corte].min;
      custoMax += (g / 1000) * precoCarne[corte].max;
    }
  }

  // Bebidas
  if (bebidas.cerveja) {
    custoMin += bebidas.cerveja.latas * 4;
    custoMax += bebidas.cerveja.latas * 7;
  }
  if (bebidas.caipirinha) {
    custoMin += bebidas.caipirinha.cachaca * 20;
    custoMax += bebidas.caipirinha.cachaca * 50;
    custoMin += bebidas.caipirinha.limoes  * 0.7;
    custoMax += bebidas.caipirinha.limoes  * 1.5;
  }
  if (bebidas.vinho) {
    custoMin += bebidas.vinho.garrafas * 30;
    custoMax += bebidas.vinho.garrafas * 80;
  }
  if (bebidas.refri) {
    custoMin += bebidas.refri.garrafas2L * 7;
    custoMax += bebidas.refri.garrafas2L * 14;
  }
  if (bebidas.agua) {
    custoMin += bebidas.agua.garrafas500 * 2;
    custoMax += bebidas.agua.garrafas500 * 4;
  }
  custoMin += geloKg * 1.5;
  custoMax += geloKg * 2.5;

  // Acompanhamentos
  custoMin += (acomp.farofa / 500)   * 8;
  custoMax += (acomp.farofa / 500)   * 18;
  custoMin += (acomp.maionese / 250) * 6;
  custoMax += (acomp.maionese / 250) * 12;
  custoMin += acomp.paodeAlho * 3;
  custoMax += acomp.paodeAlho * 5;
  custoMin += acomp.tomate   * 0.6;
  custoMax += acomp.tomate   * 1.2;
  custoMin += acomp.cebola   * 0.5;
  custoMax += acomp.cebola   * 1.0;

  // Carvão
  custoMin += carvaoSacos * 22;
  custoMax += carvaoSacos * 42;

  custoMin = Math.round(custoMin);
  custoMax = Math.round(custoMax);

  // ---- SCORE ----
  const gPorPessoa = adultos > 0 ? totalCarneGramas / adultos : 0;
  let score = '';
  if (vegPct === 100) {
    score = '🌱 Churrasco vegetariano! Que isso, né? Mas tá valendo! 💚';
  } else if (gPorPessoa < 350) {
    score = '😅 Tá com vergonha de churrasco, né? Bota mais carne aí!';
  } else if (gPorPessoa < 550) {
    score = '👍 Churrasco do bem! Vai dar certo sim!';
  } else if (gPorPessoa < 800) {
    score = '🥩 Churrasqueiro de respeito! Esse vai ser épico!';
  } else {
    score = '👑🔥 REI DO CHURRASCO! Churrasco de sonho confirmado!';
  }

  resultData = { adultos, criancas, duracao, horario, perfil, vegPct, carnes, bebidas, acomp, carvao: { kg: carvaoKg, sacos: carvaoSacos }, orcamento: { min: custoMin, max: custoMax }, score, totalCarneGramas, temCerveja, temCaipirinha, temVinho, temRefri, temAgua };

  renderResults(resultData);
  goToStep(3);
}

/* ----------------------------------------------------------------
   RENDER RESULTS
----------------------------------------------------------------- */
function renderResults(d) {
  // Score banner
  document.getElementById('score-banner').textContent = d.score;

  // Quick summary
  const qs = document.getElementById('quick-summary');
  const total = d.adultos + d.criancas;
  qs.innerHTML = `
    <div class="qs-chip">👥 ${total} pessoa${total !== 1 ? 's' : ''}</div>
    <div class="qs-chip">⏱️ ${d.duracao}h</div>
    <div class="qs-chip">🥩 ${(d.totalCarneGramas / 1000).toFixed(1).replace('.',',')} kg de carne</div>
    <div class="qs-chip">💰 ${fmtBRL(d.orcamento.min)}–${fmtBRL(d.orcamento.max)}</div>
  `;

  // ---- CARNES ----
  const carneLabels = {
    picanha:      { icon: '🥩', label: 'Picanha' },
    costela:      { icon: '🦴', label: 'Costela' },
    frango:       { icon: '🍗', label: 'Frango' },
    linguica:     { icon: '🌭', label: 'Linguiça' },
    maminha:      { icon: '🥩', label: 'Maminha' },
    queijocualho: { icon: '🧀', label: 'Queijo Coalho' },
    legumes:      { icon: '🥦', label: 'Legumes' },
    halloumi:     { icon: '🧀', label: 'Halloumi' },
  };

  let carnesHtml = '';
  for (const [corte, g] of Object.entries(d.carnes)) {
    if (g <= 0) continue;
    const info = carneLabels[corte] || { icon: '🥩', label: corte };
    const pacotes = Math.ceil(g / 1000); // pacotes de 1kg aprox
    carnesHtml += `
      <div class="res-card">
        <span class="rc-icon">${info.icon}</span>
        <div class="rc-name">${info.label}</div>
        <div class="rc-amount">${kgStr(g)}</div>
        <div class="rc-note">≈ ${pacotes} pacote${pacotes !== 1 ? 's' : ''} de 1 kg</div>
      </div>`;
  }

  const totalKg = (d.totalCarneGramas / 1000).toFixed(1).replace('.', ',');
  carnesHtml += `
    <div class="res-card" style="background:rgba(255,107,53,0.08);border-color:rgba(255,107,53,0.4)">
      <span class="rc-icon">🔥</span>
      <div class="rc-name">TOTAL CARNE</div>
      <div class="rc-amount">${totalKg} kg</div>
      <div class="rc-unit">para ${d.adultos + d.criancas} pessoas</div>
    </div>`;

  document.getElementById('grid-carnes').innerHTML = carnesHtml;

  // ---- BEBIDAS ----
  let bebidasHtml = '';

  if (d.bebidas.cerveja) {
    const { latas, longnecks } = d.bebidas.cerveja;
    const caixas = Math.ceil(latas / 24);
    bebidasHtml += resCard('🍺', 'Cerveja', latas + ' latas', `= ${longnecks} long necks · ${caixas} cx`);
  }

  if (d.bebidas.caipirinha) {
    const { limoes, cachaca, acucar } = d.bebidas.caipirinha;
    bebidasHtml += resCard('🍹', 'Caipirinha', limoes + ' limões', `${cachaca} garrafa${cachaca !== 1 ? 's' : ''} cachaça · ${acucar}g açúcar`);
  }

  if (d.bebidas.vinho) {
    const g = d.bebidas.vinho.garrafas;
    bebidasHtml += resCard('🍷', 'Vinho', g + ' garrafa' + (g !== 1 ? 's' : ''), '750 ml cada');
  }

  if (d.bebidas.refri) {
    const { garrafas2L } = d.bebidas.refri;
    bebidasHtml += resCard('🥤', 'Refrigerante', garrafas2L + ' garrafa' + (garrafas2L !== 1 ? 's' : ''), '2 L cada');
  }

  if (d.bebidas.agua) {
    const { garrafas500 } = d.bebidas.agua;
    bebidasHtml += resCard('💧', 'Água', garrafas500 + ' garrafa' + (garrafas500 !== 1 ? 's' : ''), '500 ml cada');
  }

  const gelo = d.bebidas.gelo.kg;
  const sacoGelo = Math.ceil(gelo / 5);
  bebidasHtml += resCard('🧊', 'Gelo', gelo + ' kg', `${sacoGelo} saco${sacoGelo !== 1 ? 's' : ''} de 5 kg`);

  document.getElementById('grid-bebidas').innerHTML = bebidasHtml;

  // ---- ACOMPANHAMENTOS ----
  const a = d.acomp;
  let acompHtml = '';

  const sacFarofa = Math.ceil(a.farofa / 500);
  acompHtml += resCard('🍚', 'Farofa', kgStr(a.farofa), `${sacFarofa} pct de 500 g`);

  const tuboMaio = Math.ceil(a.maionese / 250);
  acompHtml += resCard('🥛', 'Maionese', kgStr(a.maionese), `${tuboMaio} pote${tuboMaio !== 1 ? 's' : ''} de 250 g`);

  acompHtml += resCard('🧄', 'Pão de Alho', a.paodeAlho + ' unid.', 'congelado/artesanal');

  acompHtml += resCard('🍅', 'Tomate', a.tomate + ' unid.', 'vinagrete');
  acompHtml += resCard('🧅', 'Cebola',  a.cebola  + ' unid.', 'vinagrete');

  if (a.arroz) {
    acompHtml += resCard('🍚', 'Arroz',     kgStr(a.arroz),    'cru (rende o dobro)');
  }
  if (a.mandioca) {
    acompHtml += resCard('🌿', 'Mandioca',  kgStr(a.mandioca), 'descascada e cozida');
  }
  if (a.salada) {
    acompHtml += resCard('🥬', 'Alface',    a.salada + ' pé' + (a.salada !== 1 ? 's' : ''), 'salada verde');
  }

  document.getElementById('grid-acomp').innerHTML = acompHtml;

  // ---- CARVÃO ----
  const { kg, sacos } = d.carvao;
  let carvaoHtml = resCard('🪵', 'Carvão', kg + ' kg', `${sacos} saco${sacos !== 1 ? 's' : ''} de 5 kg`);
  carvaoHtml += resCard('🔥', 'Acendedor', '1 unid.', 'acendedor em pasta ou gel');
  carvaoHtml += resCard('🔪', 'Faca', '1 boa faca', 'bem afiada!');
  carvaoHtml += resCard('🧂', 'Sal Grosso', '1 kg', 'tempero básico e honesto');
  document.getElementById('grid-carvao').innerHTML = carvaoHtml;

  // ---- ORÇAMENTO ----
  const oc = d.orcamento;
  const porPessoa = Math.round((oc.min + oc.max) / 2 / (d.adultos + d.criancas || 1));
  document.getElementById('budget-box').innerHTML = `
    <div class="budget-range">${fmtBRL(oc.min)} – ${fmtBRL(oc.max)}</div>
    <div class="budget-breakdown">
      <div class="budget-item"><span>Por pessoa (média)</span><span>${fmtBRL(porPessoa)}</span></div>
      <div class="budget-item"><span>Só as carnes</span><span>${fmtBRL(Math.round(d.totalCarneGramas / 1000 * 65))}</span></div>
    </div>
    <div class="budget-note">* Estimativa com base nos preços médios de supermercados brasileiros em 2025. Pode variar por região.</div>
  `;

  // ---- LISTA DE COMPRAS ----
  buildShoppingList(d);
}

function resCard(icon, name, amount, note) {
  return `
    <div class="res-card">
      <span class="rc-icon">${icon}</span>
      <div class="rc-name">${name}</div>
      <div class="rc-amount">${amount}</div>
      <div class="rc-unit">${note}</div>
    </div>`;
}

/* ----------------------------------------------------------------
   LISTA DE COMPRAS
----------------------------------------------------------------- */
function buildShoppingList(d) {
  const carneLabels = {
    picanha: 'Picanha', costela: 'Costela', frango: 'Frango (coxa/sobrecoxa)',
    linguica: 'Linguiça', maminha: 'Maminha', queijocualho: 'Queijo Coalho',
    legumes: 'Legumes para grelhar', halloumi: 'Halloumi',
  };

  let sections = [];

  // Carnes
  let carneItems = [];
  for (const [corte, g] of Object.entries(d.carnes)) {
    if (g > 0) carneItems.push({ name: carneLabels[corte] || corte, qty: kgStr(g) });
  }
  if (carneItems.length) sections.push({ title: '🥩 Carnes', items: carneItems });

  // Bebidas
  let bebItems = [];
  if (d.bebidas.cerveja)    bebItems.push({ name: 'Cerveja (latas 350 ml)', qty: d.bebidas.cerveja.latas + ' latas' });
  if (d.bebidas.caipirinha) {
    bebItems.push({ name: 'Limão', qty: d.bebidas.caipirinha.limoes + ' unid.' });
    bebItems.push({ name: 'Cachaça', qty: d.bebidas.caipirinha.cachaca + ' garrafa(s)' });
    bebItems.push({ name: 'Açúcar', qty: d.bebidas.caipirinha.acucar + ' g' });
  }
  if (d.bebidas.vinho)      bebItems.push({ name: 'Vinho', qty: d.bebidas.vinho.garrafas + ' garrafa(s)' });
  if (d.bebidas.refri)      bebItems.push({ name: 'Refrigerante (2 L)', qty: d.bebidas.refri.garrafas2L + ' garrafas' });
  if (d.bebidas.agua)       bebItems.push({ name: 'Água (500 ml)', qty: d.bebidas.agua.garrafas500 + ' garrafas' });
  bebItems.push({ name: 'Gelo', qty: d.bebidas.gelo.kg + ' kg' });
  if (bebItems.length) sections.push({ title: '🍺 Bebidas & Gelo', items: bebItems });

  // Acomp
  let aItems = [
    { name: 'Farofa', qty: kgStr(d.acomp.farofa) },
    { name: 'Maionese', qty: kgStr(d.acomp.maionese) },
    { name: 'Pão de alho', qty: d.acomp.paodeAlho + ' unid.' },
    { name: 'Tomate', qty: d.acomp.tomate + ' unid.' },
    { name: 'Cebola', qty: d.acomp.cebola + ' unid.' },
    { name: 'Coentro/cheiro-verde', qty: '1 maço' },
  ];
  if (d.acomp.arroz)    aItems.push({ name: 'Arroz', qty: kgStr(d.acomp.arroz) });
  if (d.acomp.mandioca) aItems.push({ name: 'Mandioca', qty: kgStr(d.acomp.mandioca) });
  sections.push({ title: '🥗 Acompanhamentos', items: aItems });

  // Carvão & utensílios
  sections.push({ title: '🪵 Carvão & Utensílios', items: [
    { name: 'Carvão vegetal', qty: d.carvao.sacos + ' saco(s) de 5 kg' },
    { name: 'Acendedor', qty: '1 unid.' },
    { name: 'Sal grosso', qty: '1 kg' },
    { name: 'Temperos (alho, pimenta…)', qty: 'a gosto' },
  ]});

  let html = '';
  sections.forEach(sec => {
    let rows = sec.items.map(i =>
      `<div class="sl-item"><span>${i.name}</span><span>${i.qty}</span></div>`
    ).join('');
    html += `<div class="sl-category"><h4>${sec.title}</h4>${rows}</div>`;
  });

  document.getElementById('shopping-list').innerHTML = html;
}

/* ----------------------------------------------------------------
   COMPARTILHAR NO WHATSAPP
----------------------------------------------------------------- */
function shareWhatsApp() {
  const d = resultData;
  if (!d.adultos) return;

  const totalKg = (d.totalCarneGramas / 1000).toFixed(1).replace('.', ',');
  const total = d.adultos + d.criancas;

  let lines = [
    `🔥 *CHURRASCÔMETRO* 🔥`,
    ``,
    `Churrasco para *${total} pessoas* (${d.duracao}h) — perfil *${d.perfil}*`,
    ``,
    `🥩 *Carnes:*`,
  ];

  const carneLabels = {
    picanha: 'Picanha', costela: 'Costela', frango: 'Frango',
    linguica: 'Linguiça', maminha: 'Maminha', queijocualho: 'Queijo Coalho',
    legumes: 'Legumes', halloumi: 'Halloumi',
  };

  for (const [corte, g] of Object.entries(d.carnes)) {
    if (g > 0) lines.push(`• ${carneLabels[corte] || corte}: ${kgStr(g)}`);
  }
  lines.push(`• *TOTAL: ${totalKg} kg*`);
  lines.push(``);

  const beb = d.bebidas;
  lines.push(`🍺 *Bebidas:*`);
  if (beb.cerveja)    lines.push(`• Cerveja: ${beb.cerveja.latas} latas`);
  if (beb.caipirinha) lines.push(`• Limão: ${beb.caipirinha.limoes} unid. · Cachaça: ${beb.caipirinha.cachaca} garrafa(s)`);
  if (beb.vinho)      lines.push(`• Vinho: ${beb.vinho.garrafas} garrafa(s)`);
  if (beb.refri)      lines.push(`• Refrigerante: ${beb.refri.garrafas2L} garrafa(s) 2L`);
  if (beb.agua)       lines.push(`• Água: ${beb.agua.garrafas500} garrafinhas`);
  lines.push(`• Gelo: ${beb.gelo.kg} kg`);
  lines.push(``);

  lines.push(`🪵 *Carvão:* ${d.carvao.kg} kg (${d.carvao.sacos} saco${d.carvao.sacos !== 1 ? 's' : ''})`);
  lines.push(`💰 *Estimativa:* ${fmtBRL(d.orcamento.min)} – ${fmtBRL(d.orcamento.max)}`);
  lines.push(``);
  lines.push(`Calculado no Churrascômetro 🔥`);

  const text = encodeURIComponent(lines.join('\n'));
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

/* ----------------------------------------------------------------
   COPIAR LISTA
----------------------------------------------------------------- */
function copyList() {
  const d = resultData;
  if (!d.adultos) return;

  const el = document.getElementById('shopping-list');
  const items = el.querySelectorAll('.sl-item');
  const cats  = el.querySelectorAll('.sl-category h4');

  let text = '🛒 LISTA DE COMPRAS – CHURRASCÔMETRO\n\n';
  let catIdx = 0;
  el.querySelectorAll('.sl-category').forEach(cat => {
    const h = cat.querySelector('h4');
    if (h) text += h.textContent + '\n';
    cat.querySelectorAll('.sl-item').forEach(row => {
      const spans = row.querySelectorAll('span');
      text += `• ${spans[0].textContent}: ${spans[1].textContent}\n`;
    });
    text += '\n';
  });

  text += `\nCalculado no Churrascômetro 🔥`;

  navigator.clipboard.writeText(text).then(() => {
    const toast = document.getElementById('copy-toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }).catch(() => {
    // Fallback para browsers mais antigos
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    const toast = document.getElementById('copy-toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  });
}

/* ----------------------------------------------------------------
   SMOOTH SCROLL para âncoras
----------------------------------------------------------------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
