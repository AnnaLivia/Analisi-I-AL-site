(function () {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const COLORS = { log: '#822433', power: '#b99345', exponential: '#326772', factorial: '#425a84', selfPower: '#1b2027' };
  const labels = { log: 'log x', power: 'x^α', exponential: 'a^x', factorial: 'x!', selfPower: 'x^x' };

  function resizeCanvas(canvas, context) {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return rect;
  }

  function logGamma(z) {
    const coefficients = [0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 0.000009984369578019572, 0.00000015056327351493116];
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    const shifted = z - 1;
    const accumulator = coefficients.slice(1).reduce((sum, coefficient, index) => sum + coefficient / (shifted + index + 1), coefficients[0]);
    const t = shifted + 7.5;
    return .5 * Math.log(2 * Math.PI) + (shifted + .5) * Math.log(t) - t + Math.log(accumulator);
  }

  const factorial = (x) => Math.exp(logGamma(x + 1));
  const formatNumber = (value) => {
    if (value >= 100000 || value < .001) return value.toExponential(3).replace('.', ',').replace('e+', '·10^');
    return new Intl.NumberFormat('it-IT', { maximumSignificantDigits: 5 }).format(value);
  };
  const formatDecimal = (value) => Number(value).toFixed(1).replace('.', ',');

  function currentParameters() {
    return { x0: Number($('#x0').value), alpha: Number($('#alpha').value), base: Number($('#base').value) };
  }

  function valuesAt(x, alpha, base) {
    return {
      log: Math.log(x),
      power: x ** alpha,
      exponential: base ** x,
      factorial: factorial(x),
      selfPower: x ** x
    };
  }

  function drawHierarchy() {
    const canvas = $('#hierarchy-canvas');
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const { width, height } = resizeCanvas(canvas, context);
    const { x0, alpha, base } = currentParameters();
    const left = 58;
    const right = 22;
    const top = 26;
    const bottom = 38;
    const plotWidth = Math.max(1, width - left - right);
    const plotHeight = Math.max(1, height - top - bottom);
    const xMin = 1.15;
    const xMax = 8.5;
    const sampleCount = 140;
    const keys = Object.keys(labels);
    const samples = Array.from({ length: sampleCount }, (_, index) => xMin + (index / (sampleCount - 1)) * (xMax - xMin));
    const curves = Object.fromEntries(keys.map((key) => [key, samples.map((x) => ({ x, y: Math.log10(Math.max(valuesAt(x, alpha, base)[key], 1e-8)) }))]));
    const yValues = keys.flatMap((key) => curves[key].map((point) => point.y));
    const minY = Math.floor(Math.min(...yValues) - .25);
    const maxY = Math.ceil(Math.max(...yValues) + .25);
    const mapX = (x) => left + ((x - xMin) / (xMax - xMin)) * plotWidth;
    const mapY = (y) => top + ((maxY - y) / Math.max(.0001, maxY - minY)) * plotHeight;

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fcfcfb';
    context.fillRect(0, 0, width, height);
    context.strokeStyle = '#e8e5df';
    context.lineWidth = 1;
    context.font = '11px ui-sans-serif, sans-serif';
    context.fillStyle = '#77808a';

    for (let y = minY; y <= maxY; y += 1) {
      const screenY = mapY(y);
      context.beginPath(); context.moveTo(left, screenY); context.lineTo(width - right, screenY); context.stroke();
      context.fillText(y === 0 ? '1' : `10^${y}`, 10, screenY + 4);
    }
    [2, 4, 6, 8].forEach((x) => {
      const screenX = mapX(x);
      context.beginPath(); context.moveTo(screenX, top); context.lineTo(screenX, height - bottom); context.stroke();
      context.fillText(String(x), screenX - 3, height - 17);
    });
    context.fillText('x', width - right - 4, height - 7);
    context.save(); context.translate(15, top + plotHeight / 2); context.rotate(-Math.PI / 2); context.fillText('scala: log₁₀ f(x)', 0, 0); context.restore();

    const markerX = mapX(x0);
    context.setLineDash([5, 4]);
    context.strokeStyle = '#822433';
    context.lineWidth = 1.3;
    context.beginPath(); context.moveTo(markerX, top); context.lineTo(markerX, height - bottom); context.stroke();
    context.setLineDash([]);
    context.fillStyle = '#822433';
    context.fillText(`x₀ = ${x0}`, Math.min(markerX + 6, width - 66), top + 14);

    keys.forEach((key) => {
      const curve = curves[key];
      context.strokeStyle = COLORS[key];
      context.lineWidth = 2.4;
      context.beginPath();
      curve.forEach((point, index) => {
        const screenX = mapX(point.x);
        const screenY = mapY(point.y);
        if (index === 0) context.moveTo(screenX, screenY); else context.lineTo(screenX, screenY);
      });
      context.stroke();
      const local = Math.log10(Math.max(valuesAt(x0, alpha, base)[key], 1e-8));
      context.fillStyle = COLORS[key];
      context.beginPath(); context.arc(markerX, mapY(local), 4.2, 0, 2 * Math.PI); context.fill();
    });

    const legendX = left + 10;
    const legendY = top + 17;
    keys.forEach((key, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = legendX + col * 106;
      const y = legendY + row * 18;
      context.fillStyle = COLORS[key]; context.fillRect(x, y - 8, 10, 3);
      context.fillStyle = '#3e4853'; context.fillText(labels[key], x + 15, y - 4);
    });
  }

  function updateComparison() {
    const { x0, alpha, base } = currentParameters();
    $('#x0-value').textContent = x0;
    $('#alpha-value').textContent = formatDecimal(alpha);
    $('#base-value').textContent = formatDecimal(base);
    const values = valuesAt(x0, alpha, base);
    const ordered = Object.entries(values).sort(([, first], [, second]) => first - second);
    $('#local-values').innerHTML = ordered.map(([key, value]) => `<li><span>${labels[key]}</span><strong>${formatNumber(value)}</strong></li>`).join('');
    $('#local-order').textContent = `Ordinamento in x₀: ${ordered.map(([key]) => labels[key]).join(' ≤ ')}.`;
    $('#asymptotic-result').innerHTML = `log x = o(x<sup>${formatDecimal(alpha)}</sup>); x<sup>${formatDecimal(alpha)}</sup> = o(${formatDecimal(base)}<sup>x</sup>); ${formatDecimal(base)}<sup>x</sup> = o(x!); x! = o(x<sup>x</sup>)`;
    drawHierarchy();
  }

  ['#x0', '#alpha', '#base'].forEach((selector) => $(selector).addEventListener('input', updateComparison));
  window.addEventListener('resize', drawHierarchy);
  updateComparison();

  $$('.quiz-card').forEach((card) => {
    const answer = card.dataset.answer;
    const feedback = $('.quiz-feedback', card);
    $$('.quiz-options button', card).forEach((button) => {
      button.addEventListener('click', () => {
        $$('.quiz-options button', card).forEach((option) => option.classList.remove('selected', 'wrong'));
        button.classList.add('selected');
        if (button.dataset.choice === answer) {
          feedback.textContent = `Conclusione corretta. ${card.dataset.explanation}`;
          feedback.classList.add('correct');
        } else {
          button.classList.add('wrong');
          feedback.textContent = 'Conclusione non corretta: ricondurre il quesito al limite di un rapporto.';
          feedback.classList.remove('correct');
        }
      });
    });
  });
}());
