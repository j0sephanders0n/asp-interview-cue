(() => {
const cfg = window.INTERVIEW_CUE_CHANNEL;
const questionEl = document.querySelector("#question");
const timerEl = document.querySelector("#timer");
const timerLabelEl = document.querySelector("#timerLabel");
const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");

let live = null;
let client = null;

function fmt(seconds) {
  seconds = Math.max(0, Math.ceil(Number(seconds) || 0));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2,"0")}`;
}

function setConnection(isConnected) {
  statusDot.classList.toggle("connected", isConnected);
  statusText.textContent = isConnected ? "Live" : "Connecting…";
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

  const clientId = "asp-guest-" + Math.random().toString(16).slice(2,10);
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
      live = JSON.parse(message.toString());
      render();
    } catch {}
  });
}

setConnection(false);
render();
setInterval(render, 150);
connectRealtime();
})();