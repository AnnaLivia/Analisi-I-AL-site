(function () {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const RED = '#822433';
  const GOLD = '#b99345';
  const INK = '#1b2027';
  const GRID = '#e8e5df';
  const MUTED = '#77808a';

  const fmt = (value, digits = 6) => {
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

  const sequences = {
    sine: {
      fn: (n) => Math.sin(3 / n) / (3 / n),
      limit: 1,
      formula: 'sin(3/n) / (3/n)',
      valueFormula: (n) => `a<sub>${n}</sub> = sin(3/${n}) / (3/${n})`,
      note: 'Il rapporto tende a 1: perciò <span class="math">sin(3/n)∼3/n</span>.'
    },
    cosine: {
      fn: (n) => n * n * (1 - Math.cos(2 / n)),
      limit: 2,
      formula: 'n² · [1 − cos(2/n)]',
      valueFormula: (n) => `a<sub>${n}</sub> = ${n}<sup>2</sup> · [1 − cos(2/${n})]`,
      note: 'Poiché <span class="math">1−cos(2/n)∼(2/n)²/2</span>, il prodotto tende a 2.'
    },
    tangent: {
      fn: (n) => n * Math.tan(1 / n),
      limit: 1,
      formula: 'n · tan(1/n)',
      valueFormula: (n) => `a<sub>${n}</sub> = ${n} · tan(1/${n})`,
      note: 'Poiché <span class="math">tan(1/n)∼1/n</span>, il prodotto tende a 1.'
    }
  };

  function drawTrigGraph() {
    const canvas = $('#trig-canvas');
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const { width: w, height: h } = resizeCanvas(canvas, context);
    const key = $('#trig-sequence-select').value;
    const data = sequences[key];
    const upper = Number($('#trig-n').value);
    const lower = Math.max(2, upper - 48);
    const values = Array.from({ length: upper - lower + 1 }, (_, i) => ({ n: lower + i, value: data.fn(lower + i) }));
    const rawMin = Math.min(data.limit, ...values.map((item) => item.value));
    const rawMax = Math.max(data.limit, ...values.map((item) => item.value));
    const spread = Math.max(.015, rawMax - rawMin);
    const minY = rawMin - spread * .34;
    const maxY = rawMax + spread * .34;
    const left = 52; const right = 18; const top = 20; const bottom = 34;
    const plotW = Math.max(1, w - left - right); const plotH = Math.max(1, h - top - bottom);
    const x = (n) => left + ((n - lower) / Math.max(1, upper - lower)) * plotW;
    const y = (value) => top + ((maxY - value) / Math.max(.000001, maxY - minY)) * plotH;

    context.clearRect(0, 0, w, h);
    context.fillStyle = '#fcfcfb'; context.fillRect(0, 0, w, h);
    context.strokeStyle = GRID; context.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const py = top + (plotH * i) / 4;
      context.beginPath(); context.moveTo(left, py); context.lineTo(w - right, py); context.stroke();
    }
    const xTicks = [lower, Math.round((lower + upper) / 2), upper];
    xTicks.forEach((tick) => {
      const px = x(tick); context.beginPath(); context.moveTo(px, top); context.lineTo(px, h - bottom); context.stroke();
    });
    context.strokeStyle = GOLD; context.lineWidth = 1.8; context.setLineDash([6, 5]);
    context.beginPath(); context.moveTo(left, y(data.limit)); context.lineTo(w - right, y(data.limit)); context.stroke(); context.setLineDash([]);
    context.strokeStyle = RED; context.lineWidth = 2.5; context.beginPath();
    values.forEach((item, index) => { if (index === 0) context.moveTo(x(item.n), y(item.value)); else context.lineTo(x(item.n), y(item.value)); });
    context.stroke();
    const current = values[values.length - 1];
    context.fillStyle = RED; context.beginPath(); context.arc(x(current.n), y(current.value), 4, 0, 2 * Math.PI); context.fill();
    context.fillStyle = MUTED; context.font = '11px ui-sans-serif, sans-serif';
    context.fillText('n', w - right - 4, h - 11);
    context.fillText(`limite = ${fmt(data.limit, 3)}`, left + 5, Math.max(14, y(data.limit) - 7));
    context.fillText(fmt(maxY, 4), 4, top + 4);
    context.fillText(fmt(minY, 4), 4, h - bottom + 4);
    xTicks.forEach((tick) => context.fillText(String(tick), x(tick) - 7, h - 12));
  }

  function updateTrigLab() {
    const key = $('#trig-sequence-select').value;
    const n = Number($('#trig-n').value);
    const data = sequences[key];
    $('#trig-n-value').textContent = n;
    $('#trig-formula').textContent = data.formula;
    $('#trig-value').innerHTML = data.valueFormula(n).replace(/ = /, ' = ') + ` ≈ ${fmt(data.fn(n))}`;
    $('#trig-limit').textContent = `limite: ${fmt(data.limit, 3)}`;
    $('#trig-note').innerHTML = data.note;
    drawTrigGraph();
  }

  if ($('#trig-sequence-select')) {
    $('#trig-sequence-select').addEventListener('change', updateTrigLab);
    $('#trig-n').addEventListener('input', updateTrigLab);
    window.addEventListener('resize', drawTrigGraph);
    updateTrigLab();
  }

  const workedExamples = {
    'sine-over': {
      expression: 'lim<sub>n→∞</sub> n · sin(1/n)',
      context: 'È il caso diretto del limite fondamentale del seno con <span class="math">a<sub>n</sub>=1/n</span>.',
      steps: ['Scrivi <span class="math">n = 1/(1/n)</span>.', 'Ottieni <span class="math">sin(1/n)/(1/n)</span>.', 'L’argomento <span class="math">1/n</span> tende a 0, quindi il rapporto tende a 1.'],
      result: 'Risultato: <span class="math">1</span>.'
    },
    cosine: {
      expression: 'lim<sub>n→∞</sub> n<sup>2</sup> · [1 − cos(3/n)]',
      context: 'Il coseno va usato al secondo ordine: la quantità rilevante è <span class="math">(3/n)²/2</span>.',
      steps: ['Poni <span class="math">a<sub>n</sub>=3/n→0</span>.', 'Usa <span class="math">1−cos a<sub>n</sub>∼a<sub>n</sub>²/2</span>.', 'Allora <span class="math">n²[1−cos(3/n)]∼n²·9/(2n²)</span>.'],
      result: 'Risultato: <span class="math">9/2</span>.'
    },
    quotient: {
      expression: 'lim<sub>n→∞</sub> <span class="fraction"><span>sin(4/n)</span><span>1/n<sup>2</sup> − 1/n</span></span>',
      context: 'È l’Esempio 4.64(ii) dopo la sostituzione <span class="math">x=1/n</span>.',
      steps: ['Al numeratore, <span class="math">sin(4/n)∼4/n</span>.', 'Al denominatore, <span class="math">1/n²−1/n=(1/n)(1/n−1)∼−1/n</span>.', 'Dividi gli equivalenti: <span class="math">(4/n)/(−1/n)</span>.'],
      result: 'Risultato: <span class="math">−4</span>.'
    },
    'tan-minus-sin': {
      expression: 'lim<sub>n→∞</sub> <span class="fraction"><span>tan(1/n) − sin(1/n)</span><span>(1/n)<sup>3</sup></span></span>',
      context: 'La differenza si trasforma senza usare Taylor: basta un’identità trigonometrica.',
      steps: ['Poni <span class="math">u=1/n</span> e raccogli: <span class="math">tan u−sin u=sin u(1/cos u−1)</span>.', 'Sostituisci <span class="math">1/cos u−1=(1−cos u)/cos u</span>.', 'Il rapporto diventa <span class="math">(sin u/u)·((1−cos u)/u²)·(1/cos u)</span>.'],
      result: 'Risultato: <span class="math">1·(1/2)·1=1/2</span>.'
    },
    'shifted-tan': {
      expression: 'lim<sub>n→∞</sub> <span class="fraction"><span>1</span><span>n</span></span> · tan<span class="math">(π/2 − π/(2n))</span>',
      context: 'L’argomento non tende a zero, ma si riconduce a zero con la relazione tra tangente e cotangente.',
      steps: ['Usa <span class="math">tan(π/2−v)=1/tan v</span>, con <span class="math">v=π/(2n)</span>.', 'L’espressione diventa <span class="math">(1/n)/tan(π/(2n))</span>.', 'Scrivi <span class="math">(1/n)/(π/(2n)) · (π/(2n))/tan(π/(2n))</span>.'],
      result: 'Risultato: <span class="math">(2/π)·1=2/π</span>.'
    }
  };

  function updateWorkedExample() {
    const example = workedExamples[$('#worked-select').value];
    $('#worked-expression').innerHTML = example.expression;
    $('#worked-context').innerHTML = example.context;
    $('#worked-steps').innerHTML = example.steps.map((step) => `<li>${step}</li>`).join('');
    $('#worked-result').innerHTML = example.result;
  }

  if ($('#worked-select')) {
    $('#worked-select').addEventListener('change', updateWorkedExample);
    updateWorkedExample();
  }

  $$('.quiz-card').forEach((card) => {
    const answer = card.dataset.answer;
    const feedback = $('.quiz-feedback', card);
    $$('.quiz-options button', card).forEach((button) => {
      button.addEventListener('click', () => {
        $$('.quiz-options button', card).forEach((candidate) => candidate.classList.remove('selected', 'wrong'));
        if (button.dataset.choice === answer) {
          button.classList.add('selected');
          feedback.textContent = 'Corretto: hai riconosciuto la condizione o l’equivalente giusto.';
          feedback.className = 'quiz-feedback correct';
        } else {
          button.classList.add('wrong');
          feedback.textContent = 'Non ancora: verifica prima quale argomento tende a zero.';
          feedback.className = 'quiz-feedback';
        }
      });
    });
  });
}());
