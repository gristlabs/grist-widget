function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

let questions = null;
let at = 0;

function getAnswerHTML(lst) {
  return "<ul>\n" +
    lst.map(v => `<li>${v}</li>`).join('\n') +
    "</ul>";
}

function goNext() {
  if (question.length === 0) { return; }
  at = at % questions.length;
  const qa = questions[at];
  store.set('flashcards-at', at);
  at++;
  document.getElementById('question').innerHTML = qa.Question;
  document.getElementById('answers').style.display = 'none';
  document.getElementById('answers').innerHTML = getAnswerHTML(qa.Answers);
  document.getElementById('show').style.display = 'block';
  document.getElementById('next').style.display = 'none';
}

function goShow() {
  document.getElementById('answers').style.display = 'block';
  document.getElementById('show').style.display = 'none';
  document.getElementById('next').style.display = 'block';
}

function goPrev() {
  at -= 2;
  if (at < 0) { at = 0; }
  goNext();
}

ready(function() {
  grist.ready();
  grist.onRecords(function(records) {
    at = parseInt(store.get('flashcards-at'), 10) || 0;
    questions = records;
    goNext();
  });
  document.getElementById('show').addEventListener('click', goShow);
  document.getElementById('next').addEventListener('click', goNext);
  document.addEventListener("keydown", function(event) {
    if (event.key === " " || event.key === "Enter" || event.key === "Right" || event.key === "ArrowRight") {
      if (document.getElementById('show').style.display !== 'none') {
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
