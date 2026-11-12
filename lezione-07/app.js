(function () {
  'use strict';
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
          feedback.textContent = 'Conclusione non corretta: controlla ipotesi, segno della derivata e insieme dei candidati.';
          feedback.className = 'quiz-feedback';
        }
      });
    });
  });
}());
