(function () {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const canvas = $('#tangent-canvas');
  const context = canvas.getContext('2d');
  const COLORS = { curve: '#326772', secant: '#b99345', tangent: '#822433', ink: '#1b2027', grid: '#e7e3dc' };
  const functions = {
    quadratic: { fn: (x) => x * x - x - 1, derivative: (x) => 2 * x - 1 },
    sine: { fn: (x) => Math.sin(x), derivative: (x) => Math.cos(x) },
    exponential: { fn: (x) => Math.exp(x) - 1, derivative: (x) => Math.exp(x) },
    cubic: { fn: (x) => x * x * x - 3 * x, derivative: (x) => 3 * x * x - 3 }
  };
  function format(value) { return (Math.abs(value) < 1e-9 ? 0 : value).toFixed(2).replace('.', ','); }
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * ratio); canvas.height = Math.floor(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0); return rect;
  }
  function line(x1, y1, x2, y2, style, width, dash) {
    context.beginPath(); context.strokeStyle = style; context.lineWidth = width; context.setLineDash(dash || []);
    context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke(); context.setLineDash([]);
  }
  function draw() {
    const spec = functions[$('#function-select').value];
    const x0 = Number($('#x0').value); const hValue = Number($('#h').value);
    const h = hValue === 0 ? 0.0001 : hValue;
    const x1 = x0 + h; const f0 = spec.fn(x0); const f1 = spec.fn(x1);
    const secant = (f1 - f0) / h; const derivative = spec.derivative(x0);
    $('#x0-value').textContent = format(x0); $('#h-value').textContent = format(hValue);
    $('#secant-slope').textContent = format(secant); $('#derivative-value').textContent = format(derivative);
    $('#secant-expression').textContent = hValue === 0 ? 'lim h→0⁺ [f(x₀+h)−f(x₀)]/h ≈ ' + format(secant) : '[f(' + format(x1) + ') − f(' + format(x0) + ')] / ' + format(h) + ' = ' + format(secant);
    const intercept = f0 - derivative * x0;
    $('#tangent-formula').textContent = 't(x) = ' + format(derivative) + 'x ' + (intercept < 0 ? '−' : '+') + ' ' + format(Math.abs(intercept));
    const t1AtX1 = f0 + derivative * h; const e1AtX1 = f1 - t1AtX1;
    $('#t1-numeric').textContent = 'T₁(' + format(x1) + ') = ' + format(t1AtX1);
    $('#e1-numeric').textContent = 'E₁(' + format(x1) + ') = ' + format(e1AtX1) + ';  E₁/h ≈ ' + format(e1AtX1 / h);
    const rect = resizeCanvas(); const width = rect.width; const height = rect.height;
    const xMin = -4, xMax = 4, samples = Array.from({ length: 250 }, (_, i) => xMin + i * (xMax - xMin) / 249);
    const values = samples.map(spec.fn).concat([f0, f1, f0 + derivative * (xMin - x0), f0 + derivative * (xMax - x0)]);
    let yMin = Math.min(...values), yMax = Math.max(...values);
    const margin = Math.max(1.5, (yMax - yMin) * .15); yMin -= margin; yMax += margin;
    const left = 46, right = 18, top = 18, bottom = 34;
    const mapX = (x) => left + (x - xMin) / (xMax - xMin) * (width - left - right);
    const mapY = (y) => top + (yMax - y) / (yMax - yMin) * (height - top - bottom);
    context.clearRect(0, 0, width, height); context.fillStyle = '#fcfcfb'; context.fillRect(0, 0, width, height);
    context.font = '11px ui-sans-serif, sans-serif'; context.fillStyle = '#6c737a';
    for (let x = -4; x <= 4; x += 1) { line(mapX(x), top, mapX(x), height - bottom, COLORS.grid, 1); if (x !== 0) context.fillText(String(x), mapX(x) - 3, mapY(0) + 16); }
    const step = Math.max(1, Math.ceil((yMax - yMin) / 6));
    for (let y = Math.ceil(yMin / step) * step; y <= yMax; y += step) { line(left, mapY(y), width - right, mapY(y), COLORS.grid, 1); if (Math.abs(y) > 1e-7) context.fillText(String(y), mapX(0) + 7, mapY(y) + 4); }
    line(left, mapY(0), width - right, mapY(0), COLORS.ink, 1.2); line(mapX(0), height - bottom, mapX(0), top, COLORS.ink, 1.2);
    context.fillStyle = COLORS.ink; context.fillText('x', width - right - 5, mapY(0) - 8); context.fillText('y', mapX(0) + 8, top + 6);
    context.beginPath(); context.strokeStyle = COLORS.curve; context.lineWidth = 2.6;
    samples.forEach((x, i) => { const px = mapX(x), py = mapY(spec.fn(x)); if (i === 0) context.moveTo(px, py); else context.lineTo(px, py); }); context.stroke();
    const secantIntercept = f0 - secant * x0;
    line(mapX(xMin), mapY(secant * xMin + secantIntercept), mapX(xMax), mapY(secant * xMax + secantIntercept), COLORS.secant, 2.2, [6, 5]);
    line(mapX(xMin), mapY(f0 + derivative * (xMin - x0)), mapX(xMax), mapY(f0 + derivative * (xMax - x0)), COLORS.tangent, 2.1);
    [[x0, f0, 'P₀'], [x1, f1, 'Pₕ']].forEach((point) => { context.fillStyle = COLORS.ink; context.beginPath(); context.arc(mapX(point[0]), mapY(point[1]), 4.5, 0, 2 * Math.PI); context.fill(); context.fillText(point[2], mapX(point[0]) + 7, mapY(point[1]) - 8); });
  }
  ['function-select', 'x0', 'h'].forEach((id) => $('#' + id).addEventListener('input', draw));
  $('#reset-tangent').addEventListener('click', () => { $('#function-select').value = 'quadratic'; $('#x0').value = 1; $('#h').value = 1; draw(); });
  window.addEventListener('resize', draw);
  document.querySelectorAll('.quiz-card').forEach((card) => card.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    card.querySelectorAll('button').forEach((candidate) => candidate.classList.remove('selected', 'wrong'));
    const feedback = card.querySelector('.quiz-feedback'); button.classList.add('selected');
    if (button.dataset.choice === card.dataset.answer) { feedback.textContent = 'Corretto. ' + card.dataset.explanation; feedback.className = 'quiz-feedback correct'; }
    else { button.classList.add('wrong'); feedback.textContent = 'Conclusione non corretta: ricondurre il quesito alla formula e alle sue condizioni di validità.'; feedback.className = 'quiz-feedback'; }
  })));
  draw();
}());
