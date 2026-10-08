(function () {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const RED = '#822433';
  const GOLD = '#b99345';
  const INK = '#1b2027';
  const GRID = '#e8e5df';
  const MUTED = '#77808a';

  function fmt(value, digits = 4) {
    if (!Number.isFinite(value)) return 'non definito';
    if (Math.abs(value) < 0.00005) return '0';
    return Number(value.toFixed(digits)).toString().replace('-', '−');
  }

  const frac = (numerator, denominator) => `<span class="fraction"><span>${numerator}</span><span>${denominator}</span></span>`;

  function resizeCanvas(canvas, context) {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return rect;
  }

  const sequences = {
    inverse: {
      fn: (n) => 1 + 3 / n,
      limit: 1,
      formula: `a<sub>n</sub> = 1 + ${frac('3', 'n')}`,
      label: 'limite: 1',
      note: `I termini si avvicinano a 1: la distanza dal limite è circa ${frac('3', 'n')}.`
    },
    ratio: {
      fn: (n) => (2 * n + 1) / (n + 3),
      limit: 2,
      formula: `a<sub>n</sub> = ${frac('2n + 1', 'n + 3')}`,
      label: 'limite: 2',
      note: 'Dividendo numeratore e denominatore per n, restano i coefficienti dei termini dominanti.'
    },
    radical: {
      fn: (n) => n / (Math.sqrt(n * n + n) + n),
      limit: 0.5,
      formula: 'a<sub>n</sub> = √(n² + n) − n',
      label: `limite: ${frac('1', '2')}`,
      note: 'La razionalizzazione trasforma la differenza di infiniti in un quoziente semplice.'
    },
    oscillating: {
      fn: (n) => (n % 2 === 0 ? 1 : -1),
      limit: null,
      formula: 'a<sub>n</sub> = (−1)ⁿ',
      label: 'limite: non esiste',
      note: 'I termini pari valgono 1 e quelli dispari −1: la successione oscilla e non si avvicina a un unico numero.'
    }
  };

  function drawSequence() {
    const canvas = $('#sequence-canvas');
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const rect = resizeCanvas(canvas, context);
    const width = rect.width;
    const height = rect.height;
    const n = Number($('#sequence-n').value);
    const sequence = sequences[$('#sequence-select').value];
    const end = Math.max(40, n);
    const start = Math.max(1, end - 69);
    const points = [];
    for (let index = start; index <= end; index += 1) points.push({ n: index, value: sequence.fn(index) });

    const values = points.map((point) => point.value);
    if (Number.isFinite(sequence.limit)) values.push(sequence.limit);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (Math.abs(max - min) < 0.001) { min -= 1; max += 1; }
    const padding = Math.max((max - min) * 0.16, 0.1);
    min -= padding;
    max += padding;
    const left = 48;
    const right = 18;
    const top = 22;
    const bottom = 32;
    const x = (index) => left + ((index - start) / Math.max(1, end - start)) * (width - left - right);
    const y = (value) => top + ((max - value) / (max - min)) * (height - top - bottom);

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fcfcfb';
    context.fillRect(0, 0, width, height);
    context.font = '11px ui-sans-serif, sans-serif';
    context.fillStyle = MUTED;
    context.strokeStyle = GRID;
    context.lineWidth = 1;
    for (let step = 0; step <= 4; step += 1) {
      const value = min + ((max - min) * step) / 4;
      const py = y(value);
      context.beginPath(); context.moveTo(left, py); context.lineTo(width - right, py); context.stroke();
      context.fillText(fmt(value, 2), 7, py + 4);
    }
    context.strokeStyle = INK;
    context.beginPath(); context.moveTo(left, height - bottom); context.lineTo(width - right, height - bottom); context.stroke();
    context.fillText(`n = ${start}`, left, height - 10);
    context.fillText(`n = ${end}`, Math.max(left, width - right - 42), height - 10);

    if (Number.isFinite(sequence.limit)) {
      const limitY = y(sequence.limit);
      context.save();
      context.setLineDash([6, 5]);
      context.strokeStyle = RED;
      context.beginPath(); context.moveTo(left, limitY); context.lineTo(width - right, limitY); context.stroke();
      context.restore();
      context.fillStyle = RED;
      context.fillText(`ℓ = ${fmt(sequence.limit)}`, width - right - 62, limitY - 8);
    }

    context.strokeStyle = GOLD;
    context.lineWidth = 2;
    context.beginPath();
    points.forEach((point, index) => {
      const px = x(point.n);
      const py = y(point.value);
      if (index === 0) context.moveTo(px, py); else context.lineTo(px, py);
    });
    context.stroke();
    points.forEach((point) => {
      context.fillStyle = point.n === n ? RED : GOLD;
      context.beginPath(); context.arc(x(point.n), y(point.value), point.n === n ? 5 : 2.5, 0, 2 * Math.PI); context.fill();
    });
  }

  function renderSequence() {
    const sequence = sequences[$('#sequence-select').value];
    const n = Number($('#sequence-n').value);
    const value = sequence.fn(n);
    const indexLabel = String(n);
    $('#sequence-formula').innerHTML = sequence.formula;
    $('#sequence-n-value').textContent = n;
    $('#sequence-value').innerHTML = `a<sub>${indexLabel}</sub> = ${fmt(value)}`;
    $('#sequence-limit').innerHTML = sequence.label;
    $('#sequence-note').innerHTML = sequence.note;
    drawSequence();
  }

  if ($('#sequence-select')) {
    $('#sequence-select').addEventListener('change', renderSequence);
    $('#sequence-n').addEventListener('input', renderSequence);
    window.addEventListener('resize', drawSequence);
    renderSequence();
  }

  const indeterminateForms = {
    'infinity-over-infinity': {
      badge: frac('∞', '∞'),
      title: 'Un quoziente di infiniti',
      expression: `lim<sub>n→∞</sub> ${frac('3n² + 1', 'n² − 2')}`,
      steps: ['Metti in evidenza n² al numeratore e al denominatore.', `Semplifica il fattore n²: ${frac(`3 + ${frac('1', 'n²')}`, `1 − ${frac('2', 'n²')}`)}.`, 'Passa al limite: 3.'],
      result: 'Risultato: 3',
      note: 'La potenza dominante è n²: i termini di grado inferiore diventano trascurabili.'
    },
    'infinity-minus-infinity': {
      badge: '∞ − ∞',
      title: 'Una differenza di infiniti',
      expression: 'lim<sub>n→∞</sub> (√(n² + n) − n)',
      steps: ['Moltiplica e dividi per il coniugato.', `Ottieni ${frac('n', '√(n²+n) + n')}.`, `Raccogli n al denominatore: ${frac('1', `√(1 + ${frac('1', 'n')}) + 1`)} → ${frac('1', '2')}.`],
      result: `Risultato: ${frac('1', '2')}`,
      note: 'La razionalizzazione elimina la differenza e rende visibile il limite.'
    },
    'zero-over-zero': {
      badge: frac('0', '0'),
      title: 'Un quoziente di infinitesimi',
      expression: `lim<sub>n→∞</sub> ${frac(`sin(${frac('1', 'n')})`, frac('1', 'n'))}`,
      steps: [`Poni t = ${frac('1', 'n')}: allora t → 0.`, `Riconosci il limite fondamentale ${frac('sin t', 't')}.`, 'Concludi: il limite vale 1.'],
      result: 'Risultato: 1',
      note: `La forma ${frac('0', '0')} non è il risultato: qui si riconduce al limite fondamentale del seno.`
    },
    'zero-times-infinity': {
      badge: '0 · ∞',
      title: 'Un prodotto tra zero e infinito',
      expression: `lim<sub>n→∞</sub> n · sin(${frac('1', 'n²')})`,
      steps: ['Usa |sin u| ≤ |u|.', `Quindi |n · sin(${frac('1', 'n²')})| ≤ ${frac('1', 'n')}.`, 'Per il teorema del confronto, il limite è 0.'],
      result: 'Risultato: 0',
      note: 'Il prodotto è indeterminato, ma una stima semplice lo confronta con una successione che tende a zero.'
    }
  };

  function renderForm() {
    const form = indeterminateForms[$('#form-select').value];
    $('#form-badge').innerHTML = form.badge;
    $('#form-title').textContent = form.title;
    $('#form-expression').innerHTML = form.expression;
    $('#form-steps').innerHTML = form.steps.map((step) => `<li>${step}</li>`).join('');
    $('#form-result').innerHTML = form.result;
    $('#form-note').innerHTML = form.note;
  }

  if ($('#form-select')) {
    $('#form-select').addEventListener('change', renderForm);
    renderForm();
  }

  const hierarchyFunctions = [
    { key: 'log', label: 'log n', color: RED, fn: (x) => Math.log(x) },
    { key: 'linear', label: 'n', color: GOLD, fn: (x) => x },
    { key: 'exp', label: '2^n', labelHtml: '2<sup>n</sup>', color: '#356a52', fn: (x) => 2 ** x },
    { key: 'factorial', label: 'n!', color: '#315a85', fn: (x) => { let result = 1; for (let index = 2; index <= x; index += 1) result *= index; return result; } }
  ];

  function formatPlotValue(value) {
    if (value === 0) return '0';
    if (Math.abs(value) >= 1000) return value.toExponential(2);
    return fmt(value, 2);
  }

  function drawHierarchyChart(n) {
    const canvas = $('#hierarchy-canvas');
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const rect = resizeCanvas(canvas, context);
    const width = rect.width;
    const height = rect.height;
    const xMin = 2;
    const xMax = Math.max(xMin, n);
    const left = 52;
    const right = width < 520 ? 142 : 184;
    const top = 24;
    const bottom = 42;
    const yMin = -1;
    const rawMax = Math.max(...hierarchyFunctions.map((entry) => Math.log10(entry.fn(xMax))));
    const yMax = Math.max(4, Math.ceil(rawMax / 4) * 4);
    const toX = (x) => left + ((x - xMin) / Math.max(1, xMax - xMin)) * (width - left - right);
    const toY = (logValue) => top + ((yMax - logValue) / (yMax - yMin)) * (height - top - bottom);

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fcfcfb';
    context.fillRect(0, 0, width, height);
    context.font = '11px ui-sans-serif, sans-serif';
    context.fillStyle = MUTED;
    context.strokeStyle = GRID;
    context.lineWidth = 1;
    const tickStep = yMax <= 8 ? 2 : 4;
    for (let exponent = 0; exponent <= yMax; exponent += tickStep) {
      const py = toY(exponent);
      context.beginPath(); context.moveTo(left, py); context.lineTo(width - right, py); context.stroke();
      context.fillText(`10^${exponent}`, 7, py + 4);
    }
    context.fillText('10^-1', 7, toY(yMin) + 4);
    context.strokeStyle = INK;
    context.beginPath(); context.moveTo(left, toY(yMin)); context.lineTo(width - right, toY(yMin)); context.stroke();
    context.beginPath(); context.moveTo(left, toY(yMin)); context.lineTo(left, top); context.stroke();
    context.fillStyle = MUTED;
    context.fillText('n', width - right - 8, height - 11);
    context.fillText('f(n), scala log10', 7, 14);
    context.fillText(String(xMin), left - 3, height - 11);
    if (xMax > xMin) context.fillText(String(Math.round((xMin + xMax) / 2)), toX((xMin + xMax) / 2) - 5, height - 11);
    context.fillText(String(xMax), width - right - 12, height - 11);

    const series = hierarchyFunctions.map((entry) => ({
      ...entry,
      values: Array.from({ length: xMax - xMin + 1 }, (_, index) => {
        const x = xMin + index;
        return { x, value: entry.fn(x), logValue: Math.log10(entry.fn(x)) };
      })
    }));

    series.forEach((entry) => {
      context.strokeStyle = entry.color;
      context.lineWidth = 2.4;
      context.beginPath();
      entry.values.forEach((point, index) => {
        const px = toX(point.x);
        const py = toY(point.logValue);
        if (index === 0) context.moveTo(px, py); else context.lineTo(px, py);
      });
      context.stroke();
    });

    const labelX = width - right + 10;
    const labelStep = Math.min(28, (height - top - bottom - 20) / 3);
    series.forEach((entry, index) => {
      const point = entry.values[entry.values.length - 1];
      const markerX = toX(point.x);
      const markerY = toY(point.logValue);
      const labelY = top + 16 + index * labelStep;
      context.strokeStyle = entry.color;
      context.lineWidth = 1;
      context.beginPath(); context.moveTo(markerX, markerY); context.lineTo(labelX - 5, labelY - 4); context.stroke();
      context.fillStyle = entry.color;
      context.beginPath(); context.arc(markerX, markerY, 4.5, 0, 2 * Math.PI); context.fill();
      context.fillText(`${entry.label} = ${formatPlotValue(point.value)}`, labelX, labelY);
    });
  }

  function renderHierarchy() {
    const n = Number($('#hierarchy-n').value);
    const entries = hierarchyFunctions.map((entry) => ({ label: entry.label, value: entry.fn(n) }));
    $('#hierarchy-n-value').textContent = n;
    $('#hierarchy-n-inline').textContent = n;
    $('#hierarchy-rows').innerHTML = entries.map((entry) => {
      return `<div class="hierarchy-row"><span class="hierarchy-label">${entry.labelHtml || entry.label}</span><span class="hierarchy-value">${formatPlotValue(entry.value)}</span></div>`;
    }).join('');
    drawHierarchyChart(n);
  }

  if ($('#hierarchy-n')) {
    $('#hierarchy-n').addEventListener('input', renderHierarchy);
    window.addEventListener('resize', renderHierarchy);
    renderHierarchy();
  }

  $$('.quiz-card').forEach((card) => {
    const answer = card.dataset.answer;
    const feedback = $('.quiz-feedback', card);
    $$('.quiz-options button', card).forEach((button) => {
      button.addEventListener('click', () => {
        $$('.quiz-options button', card).forEach((option) => option.classList.remove('selected', 'wrong'));
        button.classList.add('selected');
        if (button.dataset.choice === answer) {
          feedback.textContent = 'Corretto: hai individuato il passaggio giusto.';
          feedback.classList.add('correct');
        } else {
          button.classList.add('wrong');
          feedback.textContent = 'Non ancora: rileggi la definizione e riprova.';
          feedback.classList.remove('correct');
        }
      });
    });
  });
}());
