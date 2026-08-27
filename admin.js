(() => {
const PRESETS = [15, 30, 45, 60, 90];
const cfg = window.INTERVIEW_CUE_CHANNEL;

const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");
const questionList = document.querySelector("#questionList");
const questionCount = document.querySelector("#questionCount");
const queueList = document.querySelector("#queueList");
const queueCount = document.querySelector("#queueCount");
const searchInput = document.querySelector("#searchInput");
const addQuestionForm = document.querySelector("#addQuestionForm");
const newQuestionInput = document.querySelector("#newQuestionInput");
const autoPlayToggle = document.querySelector("#autoPlayToggle");
const startQueueBtn = document.querySelector("#startQueueBtn");
const deploySelectedBtn = document.querySelector("#deploySelectedBtn");
const clearQueueBtn = document.querySelector("#clearQueueBtn");
const clearBtn = document.querySelector("#clearBtn");
const pauseBtn = document.querySelector("#pauseBtn");
const resumeBtn = document.querySelector("#resumeBtn");
const nextBtn = document.querySelector("#nextBtn");
const liveQuestion = document.querySelector("#liveQuestion");
const liveTimer = document.querySelector("#liveTimer");

let questions = [];
let queue = [];
let currentLive = null;
let selectedQueueId = null;
let newQuestionSeconds = 60;
let autoAdvanceLock = false;
let client = null;
let connected = false;

const STORAGE = {
  questions: "interviewCue.questions.v5",
  queue: "interviewCue.queue.v5",
  live: "interviewCue.live.v5",
  autoPlay: "interviewCue.autoPlay.v5"
};

function uid(prefix="id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
}

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function fmt(seconds) {
  seconds = Math.max(0, Math.ceil(Number(seconds) || 0));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2,"0")}`;
}

function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("show"), 1700);
}

function setConnection(isConnected) {
  connected = isConnected;
  statusDot.classList.toggle("connected", isConnected);
  statusText.textContent = isConnected ? "Cross-device live" : "Connecting…";
}

function normalizeQuestion(item) {
  return {
    id: item.id || uid("q"),
    text: String(item.text || "").trim(),
    seconds: PRESETS.includes(Number(item.seconds)) ? Number(item.seconds) : 60,
    createdAt: Number(item.createdAt) || Date.now()
  };
}

function renderQuestions() {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = questions.filter(item => !q || item.text.toLowerCase().includes(q));
  questionCount.textContent = questions.length;
  questionList.innerHTML = "";

  filtered.forEach(item => {
    const card = document.createElement("article");
    card.className = "question-card";

    const copy = document.createElement("div");
    copy.className = "question-card-copy";

    const text = document.createElement("p");
    text.className = "question-card-text";
    text.textContent = item.text;

    const meta = document.createElement("div");
    meta.className = "question-card-meta";
    meta.textContent = fmt(item.seconds);

    copy.append(text, meta);

    const actions = document.createElement("div");
    actions.className = "question-card-actions";

    const queueBtn = document.createElement("button");
    queueBtn.className = "icon-btn";
    queueBtn.type = "button";
    queueBtn.title = "Add to queue";
    queueBtn.textContent = "+";
    queueBtn.addEventListener("click", () => addToQueue(item));

    const deployBtn = document.createElement("button");
    deployBtn.className = "icon-btn";
    deployBtn.type = "button";
    deployBtn.title = "Deploy now";
    deployBtn.textContent = "↑";
    deployBtn.addEventListener("click", () => deployQuestion(item));

    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn";
    delBtn.type = "button";
    delBtn.title = "Delete";
    delBtn.textContent = "×";
    delBtn.addEventListener("click", () => {
      questions = questions.filter(q => q.id !== item.id);
      writeLocal(STORAGE.questions, questions);
      renderQuestions();
      toast("Question deleted");
    });

    actions.append(queueBtn, deployBtn, delBtn);
    card.append(copy, actions);
    questionList.appendChild(card);
  });

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "queue-empty";
    empty.textContent = "No questions yet.";
    questionList.appendChild(empty);
  }
}

function renderQueue() {
  queueCount.textContent = queue.length;
  queueList.innerHTML = "";

  if (!queue.length) {
    const empty = document.createElement("div");
    empty.className = "queue-empty";
    empty.textContent = "Add questions from the bank to build the interview.";
    queueList.appendChild(empty);
    return;
  }

  queue.forEach((item, index) => {
    const row = document.createElement("article");
    row.className = "queue-item" + (item.id === selectedQueueId ? " selected" : "");

    const indexEl = document.createElement("div");
    indexEl.className = "queue-index";
    indexEl.textContent = index + 1;

    const copy = document.createElement("div");
    copy.className = "queue-copy";
    copy.addEventListener("click", () => {
      selectedQueueId = item.id;
      renderQueue();
    });

    const text = document.createElement("p");
    text.className = "queue-text";
    text.textContent = item.text;

    const time = document.createElement("div");
    time.className = "queue-time";
    time.textContent = fmt(item.seconds);

    copy.append(text, time);

    const actions = document.createElement("div");
    actions.className = "queue-actions";

    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "↑";
    up.title = "Move up";
    up.disabled = index === 0;
    up.addEventListener("click", () => moveQueue(index, index - 1));

    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "↓";
    down.title = "Move down";
    down.disabled = index === queue.length - 1;
    down.addEventListener("click", () => moveQueue(index, index + 1));

    const deploy = document.createElement("button");
    deploy.type = "button";
    deploy.textContent = "▶";
    deploy.title = "Deploy";
    deploy.addEventListener("click", () => deployQueueItem(item));

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "×";
    del.title = "Remove";
    del.addEventListener("click", () => removeQueueItem(item.id));

    actions.append(up, down, deploy, del);
    row.append(indexEl, copy, actions);
    queueList.appendChild(row);
  });
}

function addToQueue(question) {
  const item = {
    id: uid("queue"),
    sourceId: question.id,
    text: question.text,
    seconds: question.seconds
  };
  queue.push(item);
  selectedQueueId = item.id;
  writeLocal(STORAGE.queue, queue);
  renderQueue();
  toast("Added to queue");
}

function moveQueue(from, to) {
  if (to < 0 || to >= queue.length) return;
  [queue[from], queue[to]] = [queue[to], queue[from]];
  writeLocal(STORAGE.queue, queue);
  renderQueue();
}

function removeQueueItem(id) {
  queue = queue.filter(x => x.id !== id);
  if (selectedQueueId === id) selectedQueueId = null;
  writeLocal(STORAGE.queue, queue);
  renderQueue();
}

function publishLive(payload) {
  currentLive = payload;
  writeLocal(STORAGE.live, currentLive);
  renderLive();

  if (!client || !connected) {
    toast("Not connected yet");
    return;
  }

  client.publish(cfg.liveTopic, JSON.stringify(payload), {
    qos: 1,
    retain: true
  }, err => {
    if (err) {
      console.error(err);
      toast("Send failed");
    }
  });
}

function deployQuestion(item, queueId=null) {
  const now = Date.now();
  publishLive({
    active: true,
    question: item.text,
    seconds: item.seconds,
    durationMs: item.seconds * 1000,
    startedAt: now,
    endsAt: now + item.seconds * 1000,
    paused: false,
    remainingMs: null,
    queueId,
    sentAt: now
  });
}

function deployQueueItem(item) {
  selectedQueueId = item.id;
  renderQueue();
  deployQuestion(item, item.id);
  toast("Deployed");
}

function deployNextInQueue() {
  if (!queue.length) {
    toast("Queue is empty");
    return;
  }

  let idx = -1;
  if (currentLive?.queueId) idx = queue.findIndex(q => q.id === currentLive.queueId);

  const next = queue[idx + 1] || (idx === -1 ? queue[0] : null);

  if (!next) {
    publishLive({
      active:false,
      question:"",
      paused:false,
      endsAt:null,
      remainingMs:null,
      queueId:null,
      sentAt:Date.now()
    });
    toast("Queue complete");
    return;
  }

  deployQueueItem(next);
}

function renderLive() {
  if (!currentLive || !currentLive.active) {
    liveQuestion.textContent = "Nothing deployed yet.";
    liveTimer.textContent = "00:00";
    return;
  }

  liveQuestion.textContent = currentLive.question || "—";
  const remainingMs = currentLive.paused
    ? (currentLive.remainingMs ?? 0)
    : (currentLive.endsAt ?? Date.now()) - Date.now();

  liveTimer.textContent = fmt(Math.max(0, remainingMs / 1000));
}

function maybeAutoAdvance() {
  if (!autoPlayToggle.checked || autoAdvanceLock) return;
  if (!currentLive?.active || currentLive.paused || !currentLive.queueId) return;

  const remaining = (currentLive.endsAt ?? Date.now()) - Date.now();
  if (remaining > 0) return;

  autoAdvanceLock = true;
  try { deployNextInQueue(); }
  finally { setTimeout(() => { autoAdvanceLock = false; }, 800); }
}

function connectRealtime() {
  if (!window.mqtt) {
    statusText.textContent = "MQTT library failed to load";
    console.error("MQTT.js is missing. Check the CDN request in DevTools > Network.");
    return;
  }
  if (!cfg) {
    statusText.textContent = "Channel config missing";
    console.error("window.INTERVIEW_CUE_CHANNEL is missing.");
    return;
  }

  const clientId = "asp-admin-" + Math.random().toString(16).slice(2,10);
  client = mqtt.connect(cfg.broker, {
    clientId,
    clean: true,
    reconnectPeriod: 1500,
    connectTimeout: 10000,
    keepalive: 30
  });

  client.on("connect", () => {
    setConnection(true);
    client.subscribe(cfg.liveTopic, { qos: 1 });
  });

  client.on("reconnect", () => setConnection(false));
  client.on("offline", () => setConnection(false));
  client.on("close", () => setConnection(false));
  client.on("error", err => {
    console.error("MQTT error", err);
    setConnection(false);
    statusText.textContent = "Connection error";
  });

  client.on("message", (topic, message) => {
    if (topic !== cfg.liveTopic) return;
    try {
      currentLive = JSON.parse(message.toString());
      writeLocal(STORAGE.live, currentLive);
      renderLive();
    } catch {}
  });
}

// load admin-only content locally
questions = readLocal(STORAGE.questions, []).map(normalizeQuestion).filter(q => q.text);
queue = readLocal(STORAGE.queue, []);
currentLive = readLocal(STORAGE.live, null);
autoPlayToggle.checked = readLocal(STORAGE.autoPlay, false);

renderQuestions();
renderQueue();
renderLive();
setConnection(false);

document.querySelectorAll("[data-new-seconds]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-new-seconds]").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    newQuestionSeconds = Number(btn.dataset.newSeconds);
  });
});

addQuestionForm.addEventListener("submit", e => {
  e.preventDefault();

  const text = newQuestionInput.value.trim();
  if (!text) {
    newQuestionInput.focus();
    return;
  }

  const question = normalizeQuestion({
    id: uid("q"),
    text,
    seconds: newQuestionSeconds,
    createdAt: Date.now()
  });

  questions.push(question);
  writeLocal(STORAGE.questions, questions);
  newQuestionInput.value = "";
  renderQuestions();
  toast("Question added");
});

searchInput.addEventListener("input", renderQuestions);

autoPlayToggle.addEventListener("change", () => {
  writeLocal(STORAGE.autoPlay, autoPlayToggle.checked);
});

startQueueBtn.addEventListener("click", () => {
  if (!queue.length) {
    toast("Queue is empty");
    return;
  }
  deployQueueItem(queue[0]);
});

deploySelectedBtn.addEventListener("click", () => {
  const item = queue.find(q => q.id === selectedQueueId);
  if (!item) {
    toast("Select a queue item");
    return;
  }
  deployQueueItem(item);
});

clearQueueBtn.addEventListener("click", () => {
  queue = [];
  selectedQueueId = null;
  writeLocal(STORAGE.queue, queue);
  renderQueue();
  toast("Queue cleared");
});

nextBtn.addEventListener("click", deployNextInQueue);

clearBtn.addEventListener("click", () => {
  publishLive({
    active:false,
    question:"",
    paused:false,
    remainingMs:null,
    startedAt:null,
    endsAt:null,
    durationMs:0,
    queueId:null,
    sentAt:Date.now()
  });
});

pauseBtn.addEventListener("click", () => {
  if (!currentLive?.active || currentLive.paused) return;
  publishLive({
    ...currentLive,
    paused:true,
    remainingMs:Math.max(0, (currentLive.endsAt ?? Date.now()) - Date.now()),
    endsAt:null,
    sentAt:Date.now()
  });
});

resumeBtn.addEventListener("click", () => {
  if (!currentLive?.active || !currentLive.paused) return;
  const remainingMs = Math.max(0, currentLive.remainingMs ?? 0);
  const now = Date.now();
  publishLive({
    ...currentLive,
    paused:false,
    startedAt:now,
    endsAt:now + remainingMs,
    remainingMs:null,
    sentAt:now
  });
});

setInterval(() => {
  renderLive();
  maybeAutoAdvance();
}, 200);

connectRealtime();
})();