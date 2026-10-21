(function () {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const RED = '#822433';
  const GOLD = '#b99345';
  const INK = '#1b2027';
  const GRID = '#e8e5df';
  const MUTED = '#77808a';

  const fmt = (value, digits = 5) => {
    if (!Number.isFinite(value)) return 'non definito';
    if (Math.abs(value) < 0.0000005) return '0';
    return Number(value.toFixed(digits)).toString().replace('-', '−');
  };

  function resizeCanvas(canvas, context) {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return rect;
  }

  const partialSum = (term, n) => {
    let total = 0;
    for (let k = 1; k <= n; k += 1) total += term(k);
    return total;
  };

  const series = {
    harmonic: {
      term: (k) => 1 / k,
      sum: (n) => partialSum((k) => 1 / k, n),
      limit: null,
      formula: 's<sub>n</sub> = Σ<sub>k=1</sub><sup>n</sup> 1/k',
      limitLabel: 'nessun limite finito',
      note: 'Nella serie armonica le somme parziali crescono lentamente, ma non si avvicinano a un numero finito: la serie diverge.'
    },
    telescopic: {
      term: (k) => 1 / (k * (k + 1)),
      sum: (n) => n / (n + 1),
      limit: 1,
      formula: 's<sub>n</sub> = Σ<sub>k=1</sub><sup>n</sup> 1/[k(k+1)]',
      limitLabel: 'limite: 1',
      note: 'Le cancellazioni danno s<sub>n</sub> = n/(n+1): le somme parziali si avvicinano a 1.'
    },
    geometric: {
      term: (k) => 1 / (2 ** k),
      sum: (n) => 1 - 1 / (2 ** n),
      limit: 1,
      formula: 's<sub>n</sub> = Σ<sub>k=1</sub><sup>n</sup> 1/2<sup>k</sup>',
      limitLabel: 'limite: 1',
      note: 'Anche qui le somme parziali si avvicinano a 1: è una geometrica di ragione 1/2.'
    }
  };

  function drawPartials() {
    const canvas = $('#partials-canvas');
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const { width, height } = resizeCanvas(canvas, context);
    const n = Number($('#partials-n').value);
    const data = series[$('#series-select').value];
    const points = Array.from({ length: n }, (_, index) => ({ n: index + 1, value: data.sum(index + 1) }));
    const values = [0, ...points.map((point) => point.value)];
    if (Number.isFinite(data.limit)) values.push(data.limit);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const spread = Math.max(.06, rawMax - rawMin);
    const minY = Math.min(0, rawMin - spread * .12);
    const maxY = rawMax + spread * .16;
    const left = 52;
    const right = 20;
    const top = 22;
    const bottom = 34;
    const plotW = Math.max(1, width - left - right);
    const plotH = Math.max(1, height - top - bottom);
    const x = (index) => left + ((index - 1) / Math.max(1, n - 1)) * plotW;
    const y = (value) => top + ((maxY - value) / Math.max(.000001, maxY - minY)) * plotH;

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fcfcfb';
    context.fillRect(0, 0, width, height);
    context.strokeStyle = GRID;
    context.lineWidth = 1;
    context.font = '11px ui-sans-serif, sans-serif';
    context.fillStyle = MUTED;
    for (let step = 0; step <= 4; step += 1) {
      const value = minY + ((maxY - minY) * step) / 4;
      const py = y(value);
      context.beginPath(); context.moveTo(left, py); context.lineTo(width - right, py); context.stroke();
      context.fillText(fmt(value, 3), 5, py + 4);
    }

    const ticks = [1, Math.max(1, Math.round(n / 2)), n];
    ticks.forEach((tick) => {
      const px = x(tick);
      context.beginPath(); context.moveTo(px, top); context.lineTo(px, height - bottom); context.stroke();
      context.fillText(String(tick), px - 5, height - 12);
    });
    context.fillText('n', width - right - 3, height - 12);

    if (Number.isFinite(data.limit)) {
      const limitY = y(data.limit);
      context.save();
      context.strokeStyle = RED;
      context.lineWidth = 1.8;
      context.setLineDash([6, 5]);
      context.beginPath(); context.moveTo(left, limitY); context.lineTo(width - right, limitY); context.stroke();
      context.restore();
      context.fillStyle = RED;
      context.fillText(`limite = ${fmt(data.limit, 2)}`, left + 7, Math.max(15, limitY - 7));
    }

    context.strokeStyle = GOLD;
    context.lineWidth = 2.5;
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) context.moveTo(x(point.n), y(point.value));
      else context.lineTo(x(point.n), y(point.value));
    });
    context.stroke();
    points.forEach((point) => {
      context.fillStyle = point.n === n ? RED : GOLD;
      context.beginPath(); context.arc(x(point.n), y(point.value), point.n === n ? 4.6 : 2.2, 0, 2 * Math.PI); context.fill();
    });
  }

  function renderPartials() {
    const n = Number($('#partials-n').value);
    const data = series[$('#series-select').value];
    $('#partials-n-value').textContent = n;
    $('#series-formula').innerHTML = data.formula;
    $('#partials-value').innerHTML = `s<sub>${n}</sub> = ${fmt(data.sum(n))}`;
    $('#partials-limit').textContent = data.limitLabel;
    $('#partials-note').innerHTML = data.note;
    drawPartials();
  }

  if ($('#series-select')) {
    $('#series-select').addEventListener('change', renderPartials);
    $('#partials-n').addEventListener('input', renderPartials);
    window.addEventListener('resize', drawPartials);
    renderPartials();
  }

  $$('.quiz-card').forEach((card) => {
    const answer = card.dataset.answer;
    const feedback = $('.quiz-feedback', card);
    $$('.quiz-options button', card).forEach((button) => {
      button.addEventListener('click', () => {
        $$('.quiz-options button', card).forEach((option) => option.classList.remove('selected', 'wrong'));
        button.classList.add('selected');
        if (button.dataset.choice === answer) {
          feedback.textContent = 'Corretto: hai scelto il criterio giusto.';
          feedback.classList.add('correct');
        } else {
          button.classList.add('wrong');
          feedback.textContent = 'Non ancora: controlla il termine generale e la serie di confronto.';
          feedback.classList.remove('correct');
        }
      });
    });
  });
}());
