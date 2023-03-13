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

const ui = {
  questionCard: null,
  answerCard: null,
  showBtn: null,
  nextBtn: null,
};

function getAnswerHTML(answer) {
  if (!Array.isArray(answer)) {
    return answer;
  }
  return "<ul>\n" +
    answer.map(v => `<li>${v}</li>`).join('\n') +
    "</ul>";
}

function goNext() {
  if (question.length === 0) { return; }
  at = at % questions.length;
  const qa = questions[at];
  store.set('flashcards-at', at);
  at++;
  ui.questionCard.innerHTML = qa.Question;
  ui.answerCard.innerHTML = getAnswerHTML(qa.Answer);
  setState('Q');
}

function goShow() {
  setState('A');
}

function setState(nextState) {
  state = nextState;
  show(ui.answerCard, state === 'A');
  show(ui.showBtn, state === 'Q');
  show(ui.nextBtn, state === 'A');
}

function goPrev() {
  at -= 2;
  if (at < 0) { at = 0; }
  goNext();
}

ready(function() {
  ui.questionCard = document.getElementById('question');
  ui.answerCard = document.getElementById('answer');
  ui.showBtn = document.getElementById('show');
  ui.nextBtn = document.getElementById('next');
  grist.ready({
    columns: [
      { name: "Question", type: 'Text', title: "Question Column"},
      { name: "Answer", type: 'Text', title: "Answer Column"},
    ],
    requiredAccess: 'read table'
  });
  grist.ready();
  grist.onRecords(function(records, mappings) {
    records = grist.mapColumnNames(records, mappings);
    at = parseInt(store.get('flashcards-at'), 10) || 0;
    questions = records;
    goNext();
  });
  ui.showBtn.addEventListener('click', goShow);
  ui.nextBtn.addEventListener('click', goNext);
  document.addEventListener("keydown", function(event) {
    if (event.key === " " || event.key === "Enter" || event.key === "Right" || event.key === "ArrowRight") {
      if (state === 'Q') {
        goShow();
      } else {
        goNext();
      }
      event.preventDefault();
    }
    if (event.key === "Left" || event.key === "ArrowLeft") {
      goPrev();
      event.preventDefault();
    }
    return false;
  });
});

function show(elem, yesNo) {
  elem.style.display = yesNo ? '' : 'none';
}
