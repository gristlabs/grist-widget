function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

let questions = null;
let at = 0;
let state = 'Q';  // Can be 'Q' when question is shown, or 'A' when answer is shown.
let isShuffled = false;
let sourceRecords = [];

const ui = {
  questionCard: null,
  answerCard: null,
  showBtn: null,
  nextBtn: null,
  backBtn: null,
  restartBtn: null,
  shuffleBtn: null,
  progressBarFilled: null,
  progressText: null,
};

function getAnswerHTML(answer) {
  if (!Array.isArray(answer)) {
    return answer;
  }
  return "<ul>\n" +
    answer.map(v => `<li>${v}</li>`).join('\n') +
    "</ul>";
}

function goNext(step) {
  if (question.length === 0) { return; }
  if (step === 'start') {
    at = 0;
  } else {
    at += step;
    if (at < 0) { at = 0; }
  }
  at = at % questions.length;
  ui.progressBarFilled.style.width = (at * 100 / questions.length) + "%";
  ui.progressText.textContent = (at + 1) + " of " + questions.length;
  const qa = questions[at];
  // Store rowId, so we come back to the same card if possible, and restart if not.
  store.set('flashcards-rowid', qa.id);
  ui.questionCard.innerHTML = qa.Question;
  ui.answerCard.innerHTML = getAnswerHTML(qa.Answer);
  setState('Q');
}

function goShow() {
  setState('A');
  ui.progressBarFilled.style.width = ((at + 1) * 100 / questions.length) + "%";
}

function setState(nextState) {
  state = nextState;
  show(ui.answerCard, state === 'A');
  show(ui.showBtn, state === 'Q');
  show(ui.nextBtn, state === 'A');
}

function shuffleCards(yesNo) {
  if (yesNo !== null) {
    isShuffled = yesNo;
  } else {
    isShuffled = !isShuffled;
  }
  if (isShuffled) {
    questions = sourceRecords.map(val => [Math.random(), val])
      .sort((a, b) => a[0] - b[0])
      .map(a => a[1]);
  } else {
    questions = sourceRecords;
  }
  ui.shuffleBtn.classList.toggle("disabled", !isShuffled)
}

ready(function() {
  ui.questionCard = document.getElementById('question');
  ui.answerCard = document.getElementById('answer');
  ui.showBtn = document.getElementById('show');
  ui.nextBtn = document.getElementById('next');
  ui.backBtn = document.getElementById('back');
  ui.restartBtn = document.getElementById('restart');
  ui.shuffleBtn = document.getElementById('shuffle');
  ui.progressBarFilled = document.getElementById('progress-bar-filled');
  ui.progressText = document.getElementById('progress-text');
  grist.ready({
    columns: [
      { name: "Question", type: 'Text', title: "Question Column"},
      { name: "Answer", type: 'Text', title: "Answer Column"},
    ],
    requiredAccess: 'read table'
  });
  grist.ready();
  grist.onRecords(function(records, mappings) {
    sourceRecords = grist.mapColumnNames(records, mappings);
    shuffleCards(isShuffled);
    const storedRowId = parseInt(store.get('flashcards-rowid'), 10);
    at = questions.findIndex(qa => qa.id === storedRowId);
    goNext(0);
  });
  ui.showBtn.addEventListener('click', goShow);
  ui.nextBtn.addEventListener('click', () => goNext(1));
  ui.backBtn.addEventListener('click', () => goNext(-1));
  ui.restartBtn.addEventListener('click', () => goNext('start'));
  ui.shuffleBtn.addEventListener('click', () => { shuffleCards(null); goNext('start'); });
  document.addEventListener("keydown", function(event) {
    if (event.key === " " || event.key === "Enter" || event.key === "Right" || event.key === "ArrowRight") {
      if (state === 'Q') {
        goShow();
      } else {
        goNext(1);
      }
      event.preventDefault();
    }
    if (event.key === "Left" || event.key === "ArrowLeft") {
      goNext(-1);
      event.preventDefault();
    }
    return false;
  });
});

function show(elem, yesNo) {
  elem.style.display = yesNo ? '' : 'none';
}
