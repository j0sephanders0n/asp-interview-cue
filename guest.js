import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getDatabase, ref, onValue
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const questionEl = document.querySelector("#question");
const timerEl = document.querySelector("#timer");
const timerLabelEl = document.querySelector("#timerLabel");
const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");

let live = null;

function fmt(seconds) {
  seconds = Math.max(0, Math.ceil(Number(seconds) || 0));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2,"0")}`;
}

function render() {
  if (!live || !live.active) {
    questionEl.textContent = "Waiting for the next question.";
    timerEl.textContent = "0:00";
    timerLabelEl.textContent = "WAITING";
    document.body.classList.remove("warning","finished");
    return;
  }

  questionEl.textContent = live.question || "—";

  const remainingMs = live.paused
    ? (live.remainingMs ?? 0)
    : (live.endsAt ?? Date.now()) - Date.now();

  const sec = Math.max(0, remainingMs / 1000);
  timerEl.textContent = fmt(sec);
  timerLabelEl.textContent = live.paused ? "PAUSED" : "TIME";

  document.body.classList.toggle("warning", sec > 0 && sec <= 10);
  document.body.classList.toggle("finished", sec <= 0);
}

onValue(ref(db, ".info/connected"), snap => {
  const connected = snap.val() === true;
  statusDot.classList.toggle("connected", connected);
  statusText.textContent = connected ? "Live" : "Connecting…";
});

onValue(ref(db, "live"), snap => {
  live = snap.val();
  render();
});

setInterval(render, 150);
render();
