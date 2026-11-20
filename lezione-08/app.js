(function () {
  'use strict';

  var checklistKey = 'analisi1-lezione08-checklist';
  var items = Array.prototype.slice.call(document.querySelectorAll('.check-item'));
  var progressValue = document.getElementById('progress-value');
  var progressBar = document.getElementById('progress-bar');
  var progressNote = document.getElementById('progress-note');
  var resetButton = document.getElementById('reset-checklist');

  function readState() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(checklistKey));
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function writeState(state) {
    try {
      window.localStorage.setItem(checklistKey, JSON.stringify(state));
    } catch (error) {
      /* La checklist resta utilizzabile anche quando il salvataggio locale è disabilitato. */
    }
  }

  function updateProgress() {
    var completed = items.filter(function (item) {
      return item.querySelector('input').checked;
    }).length;
    var percentage = Math.round(completed / items.length * 100);
    progressValue.textContent = completed + ' / ' + items.length;
    progressBar.style.width = percentage + '%';
    if (completed === 0) {
      progressNote.textContent = 'Lo schema è ancora vuoto: iniziare dal dominio.';
    } else if (completed < items.length) {
      progressNote.textContent = 'Procedere in ordine e registrare il risultato di ogni fase.';
    } else {
      progressNote.textContent = 'Checklist completata: verificare la coerenza globale del grafico.';
    }
    items.forEach(function (item) {
      item.classList.toggle('is-complete', item.querySelector('input').checked);
    });
  }

  function saveChecklist() {
    var state = items.map(function (item) {
      return item.querySelector('input').checked;
    });
    writeState(state);
    updateProgress();
  }

  var savedState = readState();
  items.forEach(function (item, index) {
    var checkbox = item.querySelector('input');
    checkbox.checked = Boolean(savedState[index]);
    checkbox.addEventListener('change', saveChecklist);
  });
  updateProgress();

  if (resetButton) {
    resetButton.addEventListener('click', function () {
      items.forEach(function (item) {
        item.querySelector('input').checked = false;
      });
      saveChecklist();
    });
  }

  var studyCanvas = document.getElementById('study-canvas');
  var studyContext = studyCanvas ? studyCanvas.getContext('2d') : null;
  var stageButtons = Array.prototype.slice.call(document.querySelectorAll('.walk-step'));
  var stageTitle = document.getElementById('walk-stage-title');
  var stageNote = document.getElementById('walk-stage-note');
  var stageCaption = document.getElementById('walk-caption');
  var stageReadout = document.getElementById('walk-readout');
  var currentStage = 1;
  var stageInformation = {
    1: {
      title: 'Dominio',
      note: 'La funzione è definita per x ≠ −2, 2.',
      caption: 'I punti esclusi dal dominio sono marcati sull’asse delle ascisse.'
    },
    2: {
      title: 'Segno e intersezioni',
      note: 'Gli zeri sono x = −1, 1; f(0) = 1/4.',
      caption: 'Gli zeri e l’intersezione con l’asse y fissano i primi punti del grafico.'
    },
    3: {
      title: 'Limiti e asintoti',
      note: 'Asintoti verticali x = ±2 e orizzontale y = 1.',
      caption: 'I limiti agli estremi del dominio delimitano il comportamento delle tre componenti.'
    },
    4: {
      title: 'Derivabilità',
      note: 'La funzione è derivabile in ogni punto del dominio.',
      caption: 'La regolarità viene registrata sul piano: non vi sono punti angolosi, cuspidi o tangenti verticali in D.'
    },
    5: {
      title: 'Monotonia ed estremi',
      note: 'f′(x) = −6x/(x²−4)²: massimo locale in (0, 1/4).',
      caption: 'Il segno di f′ orienta le frecce di monotonia e individua il massimo locale.'
    },
    6: {
      title: 'Concavità e grafico',
      note: 'f″ > 0 per |x| > 2 e f″ < 0 per |x| < 2; gli asintoti non sono punti di flesso.',
      caption: 'Dopo l’ultima fase viene tracciato il grafico completo della funzione guida.'
    }
  };

  function resizeStudyCanvas() {
    var rect = studyCanvas.getBoundingClientRect();
    var ratio = Math.max(1, window.devicePixelRatio || 1);
    studyCanvas.width = Math.floor(rect.width * ratio);
    studyCanvas.height = Math.floor(rect.height * ratio);
    studyContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    return rect;
  }

  function studyLine(x1, y1, x2, y2, color, width, dash) {
    studyContext.beginPath();
    studyContext.strokeStyle = color;
    studyContext.lineWidth = width;
    studyContext.setLineDash(dash || []);
    studyContext.moveTo(x1, y1);
    studyContext.lineTo(x2, y2);
    studyContext.stroke();
    studyContext.setLineDash([]);
  }

  function studyText(text, x, y, color, size, align) {
    studyContext.fillStyle = color;
    studyContext.font = (size || 11) + 'px ui-sans-serif, sans-serif';
    studyContext.textAlign = align || 'left';
    studyContext.fillText(text, x, y);
  }

  function studyPoint(x, y, mapX, mapY, label, color, hollow) {
    var px = mapX(x);
    var py = mapY(y);
    studyContext.beginPath();
    studyContext.arc(px, py, 5, 0, 2 * Math.PI);
    studyContext.fillStyle = hollow ? '#fcfcfb' : color;
    studyContext.fill();
    studyContext.lineWidth = 2;
    studyContext.strokeStyle = color;
    studyContext.stroke();
    if (label) studyText(label, px + 8, py - 8, color, 11);
  }

  function studyArrow(x1, y1, x2, y2, color, mapX, mapY) {
    var px1 = mapX(x1);
    var py1 = mapY(y1);
    var px2 = mapX(x2);
    var py2 = mapY(y2);
    var angle = Math.atan2(py2 - py1, px2 - px1);
    studyLine(px1, py1, px2, py2, color, 2.2);
    studyLine(px2, py2, px2 - 8 * Math.cos(angle - Math.PI / 6), py2 - 8 * Math.sin(angle - Math.PI / 6), color, 2.2);
    studyLine(px2, py2, px2 - 8 * Math.cos(angle + Math.PI / 6), py2 - 8 * Math.sin(angle + Math.PI / 6), color, 2.2);
  }

  function studyLabel(text, x, y, mapX, mapY, color) {
    var px = mapX(x);
    var py = mapY(y);
    studyContext.font = '11px ui-sans-serif, sans-serif';
    var width = studyContext.measureText(text).width + 14;
    studyContext.fillStyle = 'rgba(255,255,255,.9)';
    studyContext.fillRect(px - 5, py - 14, width, 20);
    studyContext.fillStyle = color;
    studyContext.fillText(text, px + 2, py);
  }

  function drawStudyCurve(mapX, mapY, yMin, yMax, left, right, top, bottom) {
    var fn = function (x) { return (x * x - 1) / (x * x - 4); };
    studyContext.beginPath();
    studyContext.strokeStyle = '#326772';
    studyContext.lineWidth = 3.2;
    var drawing = false;
    for (var i = 0; i <= 1400; i += 1) {
      var x = -4 + 8 * i / 1400;
      var denominator = x * x - 4;
      var y = denominator === 0 ? NaN : fn(x);
      var valid = Number.isFinite(y) && Math.abs(denominator) > .035 && y > yMin - .15 && y < yMax + .15;
      if (!valid) {
        drawing = false;
        continue;
      }
      var px = mapX(x);
      var py = mapY(y);
      if (!drawing) {
        studyContext.moveTo(px, py);
        drawing = true;
      } else {
        studyContext.lineTo(px, py);
      }
    }
    studyContext.stroke();
    studyLabel('convessa', -3.65, 1.85, mapX, mapY, '#326772');
    studyLabel('concava', -.9, -1.7, mapX, mapY, '#822433');
    studyLabel('convessa', 2.75, 1.85, mapX, mapY, '#326772');
  }

  function drawStudyGraph() {
    if (!studyCanvas || !studyContext) return;
    var rect = resizeStudyCanvas();
    var width = rect.width;
    var height = rect.height;
    var xMin = -4;
    var xMax = 4;
    var yMin = -3.5;
    var yMax = 3.5;
    var left = 50;
    var right = 22;
    var top = 24;
    var bottom = 38;
    var mapX = function (x) { return left + (x - xMin) / (xMax - xMin) * (width - left - right); };
    var mapY = function (y) { return top + (yMax - y) / (yMax - yMin) * (height - top - bottom); };

    studyContext.clearRect(0, 0, width, height);
    studyContext.fillStyle = '#fcfcfb';
    studyContext.fillRect(0, 0, width, height);
    studyContext.font = '11px ui-sans-serif, sans-serif';
    for (var x = -4; x <= 4; x += 1) {
      studyLine(mapX(x), top, mapX(x), height - bottom, '#e7e3dc', 1);
      if (x !== 0) studyText(String(x), mapX(x) - 3, mapY(0) + 17, '#6c737a', 11);
    }
    for (var y = -3; y <= 3; y += 1) {
      studyLine(left, mapY(y), width - right, mapY(y), '#e7e3dc', 1);
      if (y !== 0) studyText(String(y), mapX(0) + 7, mapY(y) + 4, '#6c737a', 11);
    }
    studyLine(left, mapY(0), width - right, mapY(0), '#1b2027', 1.2);
    studyLine(mapX(0), height - bottom, mapX(0), top, '#1b2027', 1.2);
    studyText('x', width - right - 7, mapY(0) - 8, '#1b2027', 11);
    studyText('y', mapX(0) + 8, top + 7, '#1b2027', 11);

    if (currentStage >= 1) {
      studyPoint(-2, 0, mapX, mapY, '−2', '#822433', true);
      studyPoint(2, 0, mapX, mapY, '2', '#822433', true);
      studyLabel('x ≠ −2, 2', -3.7, -2.8, mapX, mapY, '#822433');
    }
    if (currentStage >= 2) {
      studyPoint(-1, 0, mapX, mapY, '−1', '#b99345', false);
      studyPoint(1, 0, mapX, mapY, '1', '#b99345', false);
      studyPoint(0, .25, mapX, mapY, '(0,1/4)', '#b99345', false);
      studyText('+', mapX(-3), mapY(0) - 12, '#326772', 13, 'center');
      studyText('−', mapX(-1.5), mapY(0) - 12, '#822433', 13, 'center');
      studyText('+', mapX(0), mapY(0) - 12, '#326772', 13, 'center');
      studyText('−', mapX(1.5), mapY(0) - 12, '#822433', 13, 'center');
      studyText('+', mapX(3), mapY(0) - 12, '#326772', 13, 'center');
    }
    if (currentStage >= 3) {
      studyLine(mapX(-2), top, mapX(-2), height - bottom, '#822433', 1.8, [7, 5]);
      studyLine(mapX(2), top, mapX(2), height - bottom, '#822433', 1.8, [7, 5]);
      studyLine(left, mapY(1), width - right, mapY(1), '#b99345', 1.8, [7, 5]);
      studyLabel('x = −2', -3.72, 3.05, mapX, mapY, '#822433');
      studyLabel('x = 2', 2.05, 3.05, mapX, mapY, '#822433');
      studyLabel('y = 1', 2.8, 1.18, mapX, mapY, '#b99345');
    }
    if (currentStage >= 4) {
      studyLabel('f derivabile su D', -3.65, -2.25, mapX, mapY, '#326772');
    }
    if (currentStage >= 5) {
      studyArrow(-3.25, 1.5, -2.65, 2.25, '#326772', mapX, mapY);
      studyArrow(-1.55, -.85, -.7, .1, '#326772', mapX, mapY);
      studyArrow(.7, .1, 1.55, -.85, '#822433', mapX, mapY);
      studyArrow(2.65, 2.25, 3.25, 1.5, '#822433', mapX, mapY);
      studyPoint(0, .25, mapX, mapY, '', '#822433', false);
      studyLabel('max locale', -1.25, .62, mapX, mapY, '#822433');
      studyLine(mapX(-.65), mapY(.25), mapX(.65), mapY(.25), '#822433', 1.8, [6, 4]);
    }
    if (currentStage >= 6) {
      drawStudyCurve(mapX, mapY, yMin, yMax, left, right, top, bottom);
      studyPoint(-1, 0, mapX, mapY, '−1', '#b99345', false);
      studyPoint(1, 0, mapX, mapY, '1', '#b99345', false);
      studyPoint(0, .25, mapX, mapY, '', '#822433', false);
    }
  }

  function selectStudyStage(stage) {
    currentStage = stage;
    stageButtons.forEach(function (button) {
      var active = Number(button.dataset.stage) === stage;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    stageTitle.textContent = stageInformation[stage].title;
    stageNote.textContent = stageInformation[stage].note;
    stageCaption.textContent = stageInformation[stage].caption;
    stageReadout.textContent = 'Fase ' + stage + ' di 6';
    drawStudyGraph();
  }

  if (studyCanvas && studyContext) {
    stageButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        selectStudyStage(Number(button.dataset.stage));
      });
    });
    window.addEventListener('resize', drawStudyGraph);
    drawStudyGraph();
  }

  document.querySelectorAll('.quiz-card').forEach(function (card) {
    card.querySelectorAll('button').forEach(function (button) {
      button.addEventListener('click', function () {
        card.querySelectorAll('button').forEach(function (candidate) {
          candidate.classList.remove('selected', 'wrong');
        });
        var feedback = card.querySelector('.quiz-feedback');
        button.classList.add('selected');
        if (button.dataset.choice === card.dataset.answer) {
          feedback.textContent = 'Corretto. ' + card.dataset.explanation;
          feedback.className = 'quiz-feedback correct';
        } else {
          button.classList.add('wrong');
          feedback.textContent = 'Conclusione non corretta: ricontrollare la funzione della fase indicata.';
          feedback.className = 'quiz-feedback';
        }
      });
    });
  });
}());
