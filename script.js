(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Warm the cursor frames so the animation doesn't flicker on first loop.
  for (let i = 0; i < 18; i++) new Image().src = `assets/cursor/${i}.png`;

  /* ---------- viewmodel sway + idle bob ---------- */

  const vm = document.getElementById("viewmodel");
  const knife = document.getElementById("knife");
  let targetX = 0, targetY = 0, x = 0, y = 0;

  addEventListener("pointermove", (e) => {
    targetX = (e.clientX / innerWidth - 0.5) * 2;   // -1 .. 1
    targetY = (e.clientY / innerHeight - 0.5) * 2;
  });

  function frame(t) {
    x += (targetX - x) * 0.08;
    y += (targetY - y) * 0.08;
    const bob = reduceMotion ? 0 : Math.sin(t / 520);
    vm.style.setProperty("--sx", `${(-x * 22).toFixed(2)}px`);
    vm.style.setProperty("--sy", `${(y * 10 + bob * 5 + Math.abs(x) * 6).toFixed(2)}px`);
    vm.style.setProperty("--rot", `${(-x * 1.6 + bob * 0.3).toFixed(3)}deg`);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- attacks ---------- */

  let swing = 0;
  function attack(kind) {
    knife.classList.remove("slash-a", "slash-b", "stab");
    void knife.offsetWidth; // restart the animation
    knife.classList.add(kind);
  }
  knife.addEventListener("animationend", () => knife.classList.remove("slash-a", "slash-b", "stab"));

  addEventListener("pointerdown", (e) => {
    if (e.button === 0) attack(swing++ % 2 ? "slash-b" : "slash-a");
    else if (e.button === 2) attack("stab");
  });
  addEventListener("contextmenu", (e) => e.preventDefault());

  /* ---------- dancer hit -> kill feed + money ---------- */

  const dancer = document.getElementById("dancer");
  const feed = document.getElementById("killfeed");
  const moneyEl = document.getElementById("money");
  const knifeIcon =
    '<svg viewBox="0 0 64 20" aria-hidden="true"><path d="M2 12 L40 6 C50 5 58 7 62 10 C56 11 48 13 40 13 L40 15 L20 15 L18 18 L4 18 L6 14 Z"/></svg>';
  let money = 800;

  // Each hit shows the next line of lyrics.txt (lines starting with # are ignored).
  let lyrics = [];
  let lyricIndex = 0;
  fetch("lyrics.txt")
    .then((r) => (r.ok ? r.text() : ""))
    .then((text) => {
      lyrics = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    })
    .catch(() => {});
  function nextLyric() {
    if (!lyrics.length) return "Music Sounds Better With You";
    const line = lyrics[lyricIndex];
    lyricIndex = (lyricIndex + 1) % lyrics.length;
    return line;
  }

  dancer.addEventListener("pointerdown", (e) => {
    dancer.classList.add("hit");
    setTimeout(() => dancer.classList.remove("hit"), 140);

    const headshot = e.button === 2;
    const li = document.createElement("li");
    const victim = document.createElement("span");
    victim.className = "t";
    victim.textContent = nextLyric() + (headshot ? " ✦" : "");
    li.innerHTML = `<span class="ct">You</span>${knifeIcon}`;
    li.append(victim);
    feed.prepend(li);
    while (feed.children.length > 5) feed.lastElementChild.remove();
    li.addEventListener("animationend", (ev) => { if (ev.animationName === "feed-out") li.remove(); });

    money = Math.min(16000, money + 300);
    moneyEl.textContent = money;
    moneyEl.parentElement.classList.add("gain");
    setTimeout(() => moneyEl.parentElement.classList.remove("gain"), 400);
  });

  /* ---------- background music ---------- */

  // Browsers block audible autoplay, so try on load and fall back to the first interaction.
  const music = document.getElementById("music");
  const toggle = document.getElementById("musicToggle");
  let muted = false;
  music.volume = 0.6;

  function syncToggle() {
    toggle.setAttribute("aria-pressed", String(!music.paused));
    toggle.classList.toggle("off", music.paused);
  }
  music.addEventListener("play", syncToggle);
  music.addEventListener("pause", syncToggle);

  function tryPlay() {
    if (!muted) music.play().catch(() => {});
  }
  tryPlay();
  const unlock = (e) => {
    if (e.key === "m" || e.key === "M") return; // the M shortcut handles this itself
    tryPlay();
    removeEventListener("pointerdown", unlock);
    removeEventListener("keydown", unlock);
  };
  addEventListener("pointerdown", unlock);
  addEventListener("keydown", unlock);

  function setMuted(m) {
    muted = m;
    if (muted) music.pause(); else music.play().catch(() => {});
  }
  toggle.addEventListener("pointerdown", (e) => e.stopPropagation());
  toggle.addEventListener("click", () => setMuted(!music.paused));
  addEventListener("keydown", (e) => { if (e.key === "m" || e.key === "M") setMuted(!music.paused); });
  syncToggle();

  /* ---------- round timer ---------- */

  const timerEl = document.getElementById("timer");
  let left = 105;
  setInterval(() => {
    left = left > 0 ? left - 1 : 105;
    timerEl.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  }, 1000);
})();
