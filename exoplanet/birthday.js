var $$ = document.getElementById.bind(document);

function suffix(i) {
  var j = i % 10;
  var k = i % 100;
  if (j === 1 && k !== 11) {
    return i + "st";
  }
  if (j === 2 && k !== 12) {
    return i + "nd";
  }
  if (j === 3 && k !== 13) {
    return i + "rd";
  }
  return i + "th";
}

function greeting(data) {
  var name = data.planet;
  var age = data.age;
  if (typeof age !== 'number') { return ""; }
  return "happy " + suffix(age) + " birthday on " + name + "!";
}

function showTable(data) {
  var msg = greeting(data);
  $$('greeting').innerHTML = msg;
  if (msg) {
    $$('cake').style.display = 'block';
  } else {
    $$('cake').style.display = 'none';
  }
}

function start() {
  grist.ready();
  grist.onRecord(showTable);
}

function ready(fn) {
  if (document.attachEvent ? document.readyState === "complete" :
      document.readyState !== "loading"){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(start);
