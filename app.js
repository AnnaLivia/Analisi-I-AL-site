(function () {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const RED = '#822433';
  const GOLD = '#b99345';
  const INK = '#1b2027';
  const GRID = '#e8e5df';
  const MUTED = '#a9aeb4';

  const graphCanvas = $('#graph-canvas');
  const graphPanel = $('.canvas-wrap');
  const graphCtx = graphCanvas.getContext('2d');
  const graphState = { base: 'square', A: 1, B: 1, x0: 0, k: 0, scale: 34, xMin: -6, xMax: 6, yMin: -5, yMax: 5 };
  const baseFunctions = {
    square: { label: 'x²', fn: (x) => x * x },
    abs: { label: '|x|', fn: (x) => Math.abs(x) },
    sin: { label: 'sin x', fn: (x) => Math.sin(x) },
    reciprocal: { label: '1/x', fn: (x) => 1 / x }
  };

  function resizeCanvas(canvas, context) {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return rect;
  }

  function fmt(value) {
    if (Math.abs(value) < 0.005) return '0';
    return Number(value.toFixed(2)).toString().replace('-', '−');
  }

  function drawGraph() {
    if (!graphCanvas || !graphPanel) return;
    const rect = resizeCanvas(graphCanvas, graphCtx);
    const w = rect.width;
    const h = rect.height;
    const s = graphState.scale;
    const ox = w / 2;
    const oy = h / 2;
    const toPx = (x, y) => [ox + x * s, oy - y * s];
    const fn = baseFunctions[graphState.base].fn;
    const transformed = (x) => {
      const inner = graphState.B * (x - graphState.x0);
      const value = fn(inner);
      return graphState.A * value + graphState.k;
    };

    graphCtx.clearRect(0, 0, w, h);
    graphCtx.fillStyle = '#fcfcfb';
    graphCtx.fillRect(0, 0, w, h);
    graphCtx.lineWidth = 1;
    graphCtx.strokeStyle = GRID;
    graphCtx.fillStyle = '#848a91';
    graphCtx.font = '11px ui-sans-serif, sans-serif';
    for (let x = -10; x <= 10; x += 1) {
      const [px] = toPx(x, 0);
      graphCtx.beginPath(); graphCtx.moveTo(px, 0); graphCtx.lineTo(px, h); graphCtx.stroke();
      if (x !== 0 && px > 16 && px < w - 16) graphCtx.fillText(String(x), px - 3, oy + 17);
    }
    for (let y = -8; y <= 8; y += 1) {
      const [, py] = toPx(0, y);
      graphCtx.beginPath(); graphCtx.moveTo(0, py); graphCtx.lineTo(w, py); graphCtx.stroke();
      if (y !== 0 && py > 14 && py < h - 10) graphCtx.fillText(String(y), ox + 8, py + 4);
    }
    graphCtx.strokeStyle = INK;
    graphCtx.lineWidth = 1.3;
    graphCtx.beginPath(); graphCtx.moveTo(0, oy); graphCtx.lineTo(w - 7, oy); graphCtx.stroke();
    graphCtx.beginPath(); graphCtx.moveTo(ox, h); graphCtx.lineTo(ox, 7); graphCtx.stroke();
    graphCtx.fillStyle = INK; graphCtx.fillText('x', w - 14, oy - 8); graphCtx.fillText('y', ox + 8, 14);

    function drawCurve(curve, color, dashed) {
      graphCtx.beginPath(); graphCtx.strokeStyle = color; graphCtx.lineWidth = dashed ? 1.8 : 2.5;
      graphCtx.setLineDash(dashed ? [5, 5] : []);
      let drawing = false;
      for (let px = 0; px <= w; px += 1.5) {
        const x = (px - ox) / s;
        let y = curve(x);
        const [tx, ty] = toPx(x, y);
        const valid = Number.isFinite(y) && Math.abs(y) < 40;
        if (!valid) { drawing = false; continue; }
        if (!drawing) { graphCtx.moveTo(tx, ty); drawing = true; } else graphCtx.lineTo(tx, ty);
      }
      graphCtx.stroke(); graphCtx.setLineDash([]);
    }
    drawCurve(fn, MUTED, true);
    drawCurve(transformed, RED, false);
    graphCtx.fillStyle = RED;
    const [lastX, lastY] = toPx(5.6, transformed(5.6));
    if (Number.isFinite(lastY) && lastY > 15 && lastY < h - 15) graphCtx.fillText('g', lastX - 10, lastY - 8);
    return transformed;
  }

  function formulaText() {
    const base = baseFunctions[graphState.base].label;
    const A = graphState.A;
    const B = graphState.B;
    const x0 = graphState.x0;
    const k = graphState.k;
    const inner = B === 1 ? (x0 === 0 ? 'x' : `(x ${x0 > 0 ? '−' : '+'} ${Math.abs(x0)})`) : `${fmt(B)}(x ${x0 > 0 ? '−' : '+'} ${Math.abs(x0)})`;
    const outside = `${A === 1 ? '' : A === -1 ? '−' : fmt(A)}f(${inner})`;
    const shift = k === 0 ? '' : ` ${k > 0 ? '+' : '−'} ${Math.abs(k)}`;
    return `g(x) = ${outside}${shift}  ·  f(x) = ${base}`;
  }

  function updateGraph() {
    graphState.base = $('#base-function').value;
    graphState.A = Number($('#vertical-scale').value);
    graphState.B = Number($('#horizontal-scale').value);
    graphState.x0 = Number($('#horizontal-shift').value);
    graphState.k = Number($('#vertical-shift').value);
    $('#vertical-scale-value').textContent = fmt(graphState.A);
    $('#horizontal-scale-value').textContent = fmt(graphState.B);
    $('#horizontal-shift-value').textContent = fmt(graphState.x0);
    $('#vertical-shift-value').textContent = fmt(graphState.k);
    $('#transformed-formula').textContent = formulaText();
    drawGraph();
  }

  function graphPointer(event) {
    const rect = graphCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) - rect.width / 2) / graphState.scale;
    const transformed = drawGraph();
    const y = transformed(x);
    $('#graph-readout').textContent = Number.isFinite(y) ? `x = ${fmt(x)} · g(x) = ${fmt(y)}` : `x = ${fmt(x)} · g(x) non definita`;
  }

  if (graphCanvas) {
    ['base-function', 'vertical-scale', 'horizontal-scale', 'horizontal-shift', 'vertical-shift'].forEach((id) => $(
      `#${id}`).addEventListener('input', updateGraph));
    $('#reset-graph').addEventListener('click', () => {
      $('#base-function').value = 'square';
      $('#vertical-scale').value = 1; $('#horizontal-scale').value = 1; $('#horizontal-shift').value = 0; $('#vertical-shift').value = 0;
      updateGraph();
    });
    graphCanvas.addEventListener('mousemove', graphPointer);
    graphCanvas.addEventListener('mouseleave', () => { $('#graph-readout').textContent = 'x = 0.00 · g(x) = 0.00'; });
    window.addEventListener('resize', drawGraph);
    updateGraph();
  }

  const compositions = {
    'sqrt-square': {
      f: 'f(u) = √u', g: 'g(x) = x² − 1', result: '√(x² − 1)',
      domain: 'dominio: x ≤ −1 oppure x ≥ 1',
      forward: (x) => ({ inner: x * x - 1, value: Math.sqrt(x * x - 1), innerText: fmt(x * x - 1), valueText: `√${fmt(x * x - 1)} ≈ ${fmt(Math.sqrt(x * x - 1))}` }),
      reverse: { f: 'f(u) = u² − 1', g: 'g(x) = √x', result: 'x − 1', domain: 'dominio: x ≥ 0', calc: (x) => ({ inner: Math.sqrt(x), value: Math.sqrt(x) ** 2 - 1, innerText: `√${fmt(x)}`, valueText: `${fmt(x)} − 1 = ${fmt(x - 1)}` }) }
    },
    'square-shift': {
      f: 'f(u) = u²', g: 'g(x) = x + 1', result: '(x + 1)²', domain: 'dominio: ℝ',
      forward: (x) => ({ inner: x + 1, value: (x + 1) ** 2, innerText: fmt(x + 1), valueText: `(${fmt(x)} + 1)² = ${fmt((x + 1) ** 2)}` }),
      reverse: { f: 'f(u) = u + 1', g: 'g(x) = x²', result: 'x² + 1', domain: 'dominio: ℝ', calc: (x) => ({ inner: x * x, value: x * x + 1, innerText: fmt(x * x), valueText: `${fmt(x * x)} + 1 = ${fmt(x * x + 1)}` }) }
    },
    'abs-linear': {
      f: 'f(u) = |u|', g: 'g(x) = 2x − 3', result: '|2x − 3|', domain: 'dominio: ℝ',
      forward: (x) => ({ inner: 2 * x - 3, value: Math.abs(2 * x - 3), innerText: fmt(2 * x - 3), valueText: `|${fmt(2 * x - 3)}| = ${fmt(Math.abs(2 * x - 3))}` }),
      reverse: { f: 'f(u) = 2u − 3', g: 'g(x) = |x|', result: '2|x| − 3', domain: 'dominio: ℝ', calc: (x) => ({ inner: Math.abs(x), value: 2 * Math.abs(x) - 3, innerText: `|${fmt(x)}|`, valueText: `2 · ${fmt(Math.abs(x))} − 3 = ${fmt(2 * Math.abs(x) - 3)}` }) }
    }
  };
  let compositionSwapped = false;

  function renderComposition() {
    const data = compositions[$('#composition-example').value];
    const current = compositionSwapped ? data.reverse : data;
    $('#composition-f').textContent = current.f;
    $('#composition-g').textContent = current.g;
    $('#composition-result').textContent = current.result;
    $('#composition-domain').textContent = current.domain;
    updateCompositionOutput();
  }
  function updateCompositionOutput() {
    const data = compositions[$('#composition-example').value];
    const current = compositionSwapped ? data.reverse : data;
    const x = Number($('#composition-x').value);
    if (!Number.isFinite(x)) return;
    const calculated = compositionSwapped ? current.calc(x) : current.forward(x);
    if (!Number.isFinite(calculated.value)) {
      $('#composition-output').textContent = `${current.g.split(' = ')[0]}(${fmt(x)}) = ${calculated.innerText} · non appartiene al dominio di f`;
      return;
    }
    const gName = current.g.split(' = ')[0];
    const fName = current.f.split(' = ')[0];
    $('#composition-output').textContent = `${gName}(${fmt(x)}) = ${calculated.innerText} · ${fName}(${calculated.innerText}) = ${calculated.valueText}`;
  }
  if ($('#composition-example')) {
    $('#composition-example').addEventListener('change', () => { compositionSwapped = false; renderComposition(); });
    $('#swap-composition').addEventListener('click', () => { compositionSwapped = !compositionSwapped; renderComposition(); });
    $('#composition-x').addEventListener('input', updateCompositionOutput);
    renderComposition();
  }

  const numberCanvas = $('#number-line-canvas');
  const numberCtx = numberCanvas && numberCanvas.getContext('2d');
  function drawNumberLine() {
    if (!numberCanvas) return;
    const rect = resizeCanvas(numberCanvas, numberCtx);
    const w = rect.width; const h = rect.height;
    const a = Number($('#number-center').value); const r = Number($('#number-radius').value);
    const min = -6; const max = 6; const y = h * .55;
    const px = (value) => 22 + ((value - min) / (max - min)) * (w - 44);
    numberCtx.clearRect(0, 0, w, h);
    numberCtx.strokeStyle = INK; numberCtx.lineWidth = 1.3;
    numberCtx.beginPath(); numberCtx.moveTo(22, y); numberCtx.lineTo(w - 22, y); numberCtx.stroke();
    numberCtx.fillStyle = INK; numberCtx.font = '11px ui-sans-serif, sans-serif';
    for (let n = min; n <= max; n += 1) {
      const x = px(n); numberCtx.beginPath(); numberCtx.moveTo(x, y - 6); numberCtx.lineTo(x, y + 6); numberCtx.stroke();
      if (x > 15 && x < w - 15) numberCtx.fillText(String(n), x - 3, y + 25);
    }
    const left = Math.max(min, a - r); const right = Math.min(max, a + r);
    numberCtx.strokeStyle = 'rgba(130,36,51,.28)'; numberCtx.lineWidth = 11; numberCtx.lineCap = 'round';
    numberCtx.beginPath(); numberCtx.moveTo(px(left), y); numberCtx.lineTo(px(right), y); numberCtx.stroke();
    numberCtx.lineCap = 'butt'; numberCtx.strokeStyle = RED; numberCtx.lineWidth = 2.2;
    numberCtx.beginPath(); numberCtx.moveTo(px(left), y); numberCtx.lineTo(px(right), y); numberCtx.stroke();
    [left, right].forEach((point) => { numberCtx.fillStyle = RED; numberCtx.beginPath(); numberCtx.arc(px(point), y, 6, 0, Math.PI * 2); numberCtx.fill(); });
    numberCtx.fillStyle = GOLD; numberCtx.beginPath(); numberCtx.arc(px(a), y, 5, 0, Math.PI * 2); numberCtx.fill();
    $('#number-center-value').textContent = fmt(a); $('#number-radius-value').textContent = fmt(r);
    $('#number-interval').textContent = `⇔ x ∈ [${fmt(a - r)}, ${fmt(a + r)}]`;
    $('#fact-center').textContent = `a = ${fmt(a)}`; $('#fact-endpoints').textContent = `${fmt(a - r)} e ${fmt(a + r)}`; $('#fact-length').textContent = fmt(2 * r);
  }
  if (numberCanvas) {
    $('#number-center').addEventListener('input', drawNumberLine); $('#number-radius').addEventListener('input', drawNumberLine);
    window.addEventListener('resize', drawNumberLine); drawNumberLine();
  }

  $$('.quiz-card').forEach((card) => {
    $$('.quiz-options button', card).forEach((button) => button.addEventListener('click', () => {
      const answer = card.dataset.answer; const choice = button.dataset.choice; const feedback = $('.quiz-feedback', card);
      $$('.quiz-options button', card).forEach((candidate) => candidate.classList.remove('selected', 'wrong'));
      button.classList.add(choice === answer ? 'selected' : 'wrong');
      if (choice === answer) { feedback.textContent = 'Corretto. Risposta verificata.'; feedback.className = 'quiz-feedback correct'; }
      else { feedback.textContent = `Non ancora: la risposta corretta è ${answer.toUpperCase()}. Riprova guardando la definizione.`; feedback.className = 'quiz-feedback'; }
    }));
  });

  $$('.lesson-step[data-scroll]').forEach((button) => button.addEventListener('click', () => $(button.dataset.scroll).scrollIntoView({ behavior: 'smooth' })));
})();
