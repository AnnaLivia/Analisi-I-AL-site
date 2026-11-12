(function () {
  'use strict';

  var $ = function (selector) { return document.querySelector(selector); };
  var canvas = $('#singularity-canvas');
  var context = canvas ? canvas.getContext('2d') : null;
  var colors = { curve: '#326772', tangent: '#822433', grid: '#e7e3dc', axis: '#1b2027', point: '#b99345' };

  var models = {
    min: {
      formula: 'f(x)=x²',
      type: 'minimo locale',
      note: 'f′ passa da − a +; il punto è stazionario.',
      fn: function (x) { return x * x; },
      tangent: 'line',
      slope: 0,
      yMin: -1.5,
      yMax: 4
    },
    max: {
      formula: 'f(x)=−x²',
      type: 'massimo locale',
      note: 'f′ passa da + a −; il punto è stazionario.',
      fn: function (x) { return -x * x; },
      tangent: 'line',
      slope: 0,
      yMin: -4,
      yMax: 1.5
    },
    stationary: {
      formula: 'f(x)=x³',
      type: 'stazionario senza estremo',
      note: 'f′ è positiva ai due lati: la monotonia non cambia.',
      fn: function (x) { return x * x * x; },
      tangent: 'line',
      slope: 0,
      yMin: -7,
      yMax: 7
    },
    corner: {
      formula: 'f(x)=|x|',
      type: 'punto angoloso',
      note: 'f′₋(0)=−1 e f′₊(0)=+1: minimo angoloso.',
      fn: function (x) { return Math.abs(x); },
      tangent: 'rays',
      yMin: -1.5,
      yMax: 3
    },
    cusp: {
      formula: 'f(x)=|x|²ᐟ³',
      type: 'cuspide',
      note: 'Le pendenze laterali sono −∞ e +∞: cuspide in 0.',
      fn: function (x) { return Math.pow(Math.abs(x), 2 / 3); },
      tangent: 'vertical',
      yMin: -1.5,
      yMax: 3
    },
    vertical: {
      formula: 'f(x)=∛x',
      type: 'tangente verticale',
      note: 'Le pendenze laterali tendono entrambe a +∞.',
      fn: function (x) { return x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3); },
      tangent: 'vertical',
      yMin: -2,
      yMax: 2
    }
  };

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return rect;
  }

  function line(x1, y1, x2, y2, color, width, dash) {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = width;
    context.setLineDash(dash || []);
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.setLineDash([]);
  }

  function drawGraph() {
    if (!canvas || !context) return;
    var model = models[$('#shape-select').value];
    var rect = resize();
    var width = rect.width;
    var height = rect.height;
    var xMin = -2;
    var xMax = 2;
    var yMin = model.yMin;
    var yMax = model.yMax;
    var left = 48;
    var right = 18;
    var top = 18;
    var bottom = 32;
    var mapX = function (x) { return left + (x - xMin) / (xMax - xMin) * (width - left - right); };
    var mapY = function (y) { return top + (yMax - y) / (yMax - yMin) * (height - top - bottom); };

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fcfcfb';
    context.fillRect(0, 0, width, height);
    context.font = '11px ui-sans-serif, sans-serif';
    context.fillStyle = '#6c737a';
    for (var x = -2; x <= 2; x += 1) {
      line(mapX(x), top, mapX(x), height - bottom, colors.grid, 1);
      if (x !== 0) context.fillText(String(x), mapX(x) - 3, mapY(0) + 16);
    }
    var yStep = (yMax - yMin) > 8 ? 2 : 1;
    for (var y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      line(left, mapY(y), width - right, mapY(y), colors.grid, 1);
      if (Math.abs(y) > 1e-8) context.fillText(String(y), mapX(0) + 7, mapY(y) + 4);
    }
    line(left, mapY(0), width - right, mapY(0), colors.axis, 1.2);
    line(mapX(0), height - bottom, mapX(0), top, colors.axis, 1.2);
    context.fillStyle = colors.axis;
    context.fillText('x', width - right - 5, mapY(0) - 8);
    context.fillText('y', mapX(0) + 8, top + 6);

    context.beginPath();
    context.strokeStyle = colors.curve;
    context.lineWidth = 2.8;
    var drawing = false;
    for (var i = 0; i <= 520; i += 1) {
      var sampleX = xMin + (xMax - xMin) * i / 520;
      var sampleY = model.fn(sampleX);
      var valid = Number.isFinite(sampleY) && Math.abs(sampleY) < 100;
      if (!valid) {
        drawing = false;
        continue;
      }
      var px = mapX(sampleX);
      var py = mapY(sampleY);
      if (!drawing) {
        context.moveTo(px, py);
        drawing = true;
      } else {
        context.lineTo(px, py);
      }
    }
    context.stroke();

    if (model.tangent === 'line') {
      line(mapX(xMin), mapY(model.slope * xMin), mapX(xMax), mapY(model.slope * xMax), colors.tangent, 2.1, [7, 5]);
    } else if (model.tangent === 'rays') {
      line(mapX(-1.2), mapY(1.2), mapX(0), mapY(0), colors.tangent, 2.1, [7, 5]);
      line(mapX(0), mapY(0), mapX(1.2), mapY(1.2), colors.tangent, 2.1, [7, 5]);
    } else {
      line(mapX(0), top, mapX(0), height - bottom, colors.tangent, 2.1, [7, 5]);
    }
    context.fillStyle = colors.point;
    context.beginPath();
    context.arc(mapX(0), mapY(0), 5, 0, 2 * Math.PI);
    context.fill();
    context.fillStyle = colors.axis;
    context.fillText('x₀=0', mapX(0) + 8, mapY(0) - 10);

    $('#shape-formula').textContent = model.formula;
    $('#shape-type').textContent = model.type;
    $('#shape-note').textContent = model.note;
  }

  if (canvas) {
    $('#shape-select').addEventListener('input', drawGraph);
    $('#reset-shape').addEventListener('click', function () {
      $('#shape-select').value = 'min';
      drawGraph();
    });
    window.addEventListener('resize', drawGraph);
    drawGraph();
  }

  document.querySelectorAll('.quiz-card').forEach(function (card) {
    card.querySelectorAll('button').forEach(function (button) {
      button.addEventListener('click', function () {
        card.querySelectorAll('button').forEach(function (candidate) { candidate.classList.remove('selected', 'wrong'); });
        var feedback = card.querySelector('.quiz-feedback');
        button.classList.add('selected');
        if (button.dataset.choice === card.dataset.answer) {
          feedback.textContent = 'Corretto. ' + card.dataset.explanation;
          feedback.className = 'quiz-feedback correct';
        } else {
          button.classList.add('wrong');
          feedback.textContent = 'Conclusione non corretta: controlla la definizione e l’informazione laterale.';
          feedback.className = 'quiz-feedback';
        }
      });
    });
  });
}());
