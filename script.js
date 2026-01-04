gsap.registerPlugin(ScrollTrigger);

document.getElementById("year").textContent = new Date().getFullYear();

/* -----------------------------
   Lenis (stable sync with GSAP)
------------------------------ */
const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
window.addEventListener("load", () => ScrollTrigger.refresh());

/* Smooth anchor scroll via Lenis */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -10 });
  });
});

/* -----------------------------
   Cursor
------------------------------ */
const cursor = document.querySelector(".cursor");
const cursorDot = document.querySelector(".cursor-dot");
let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
let dotX = mouseX, dotY = mouseY;
let curX = mouseX, curY = mouseY;

addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });

(function loopCursor(){
  dotX += (mouseX - dotX) * 0.25;
  dotY += (mouseY - dotY) * 0.25;
  curX += (mouseX - curX) * 0.12;
  curY += (mouseY - curY) * 0.12;

  cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
  cursor.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;

  requestAnimationFrame(loopCursor);
})();

/* -----------------------------
   Magnetic (avoid tilt conflict)
------------------------------ */
document.querySelectorAll("[data-magnetic]:not(.tilt)").forEach((el) => {
  const strength = 18;
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
  });
  el.addEventListener("mouseleave", () => { el.style.transform = "translate(0,0)"; });
});

/* Tilt */
document.querySelectorAll(".tilt").forEach((card) => {
  const maxTilt = 10;
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -2 * maxTilt;
    const ry = (px - 0.5) *  2 * maxTilt;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = `perspective(900px) rotateX(0) rotateY(0) translateY(0)`;
  });
});

/* Ambient floats */
gsap.to(".o1", { x: 40, y: -30, rotation: 6, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut" });
gsap.to(".o2", { x: -50, y: 40, rotation: -7, duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut" });
gsap.to(".o3", { x: 30, y: -40, rotation: 10, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut" });
gsap.to(".o4", { x: 15, y: 35, rotation: -10, duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut" });

/* Scroll CTA arrow bounce */
gsap.to(".scroll-cta__arrow", { y: 6, duration: 1.1, repeat: -1, yoyo: true, ease: "sine.inOut" });

/* Reveal animations */
gsap.to(".reveal", {
  opacity: 1,
  y: 0,
  duration: 0.9,
  ease: "power3.out",
  stagger: 0.06,
  delay: 0.12
});

document.querySelectorAll(".section .reveal, .section-soft .reveal").forEach((el) => {
  gsap.fromTo(el, { opacity: 0, y: 18 }, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 85%" }
  });
});

/* -----------------------------
   Sticky scroll indicator (hide after first scroll)
------------------------------ */
const scrollIndicator = document.getElementById("scrollIndicator");
const SCROLL_HIDE_KEY = "bond_scroll_hint_hidden";

function hideScrollIndicator() {
  scrollIndicator.classList.add("hidden");
  sessionStorage.setItem(SCROLL_HIDE_KEY, "1");
}

if (sessionStorage.getItem(SCROLL_HIDE_KEY) === "1") {
  scrollIndicator.classList.add("hidden");
} else {
  const onFirstScroll = () => {
    if (window.scrollY > 40) {
      hideScrollIndicator();
      window.removeEventListener("scroll", onFirstScroll);
    }
  };
  window.addEventListener("scroll", onFirstScroll, { passive: true });
}

scrollIndicator.addEventListener("click", () => {
  const target = document.querySelector("#highlights") || document.querySelector("#vibe");
  if (target) lenis.scrollTo(target, { offset: -10 });
  hideScrollIndicator();
});

/* -----------------------------
   Stories modal (Highlights)
------------------------------ */
const storyOverlay = document.getElementById("storyOverlay");
const storyClose = document.getElementById("storyClose");
const storyPrev = document.getElementById("storyPrev");
const storyNext = document.getElementById("storyNext");
const tapLeft = document.getElementById("tapLeft");
const tapRight = document.getElementById("tapRight");
const storyTitle = document.getElementById("storyTitle");
const storyBody = document.getElementById("storyBody");
const storyProgress = document.getElementById("storyProgress");

let activeStory = [];
let storyIndex = 0;
let storyTimer = null;
let progressTween = null;
const STORY_DURATION_MS = 3600;

function duoBackground(name) {
  // three duotone looks
  const maps = {
    duo1: `
      radial-gradient(900px 520px at 20% 20%, rgba(28,47,217,.18), transparent 60%),
      radial-gradient(800px 520px at 80% 55%, rgba(92,108,255,.14), transparent 60%),
      rgba(255,255,255,.58)
    `,
    duo2: `
      radial-gradient(900px 520px at 80% 18%, rgba(28,47,217,.16), transparent 60%),
      radial-gradient(800px 520px at 20% 70%, rgba(92,108,255,.14), transparent 60%),
      rgba(255,255,255,.58)
    `,
    duo3: `
      radial-gradient(900px 520px at 45% 25%, rgba(28,47,217,.15), transparent 60%),
      radial-gradient(800px 520px at 10% 80%, rgba(92,108,255,.12), transparent 60%),
      rgba(255,255,255,.58)
    `
  };
  return maps[name] || maps.duo1;
}

function renderProgressBars(count, current) {
  storyProgress.innerHTML = "";
  for (let i=0; i<count; i++) {
    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("div");
    fill.className = "fill";
    if (i < current) fill.style.width = "100%";
    bar.appendChild(fill);
    storyProgress.appendChild(bar);
  }
}

function renderStoryFrame(frame) {
  storyTitle.textContent = frame.title || "story";

  let backgroundHTML = "";

  if (frame.image) {
    backgroundHTML = `
      <img src="${frame.image}"
           alt=""
           class="story-img" />
    `;
  } else {
    backgroundHTML = `
      <div class="story-bg" style="background:${duoBackground(frame.bg)}"></div>
    `;
  }

  storyBody.innerHTML = `
    <div class="story-card">
      ${backgroundHTML}
      <div class="story-content">
        <div class="story-chip">
          <span style="width:10px;height:10px;border-radius:999px;background:var(--blue);display:inline-block;"></span>
          <span>${frame.title || "BOND"}</span>
        </div>
        <div class="story-text">${frame.text || ""}</div>
      </div>
    </div>
  `;

  gsap.fromTo(
    ".story-card",
    { scale: 0.98, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.25, ease: "power2.out" }
  );
}


function clearTimers() {
  if (storyTimer) { clearTimeout(storyTimer); storyTimer = null; }
  if (progressTween) { progressTween.kill(); progressTween = null; }
}

function startProgress() {
  clearTimers();
  const bars = storyProgress.querySelectorAll(".bar .fill");
  const activeFill = bars[storyIndex];
  if (!activeFill) return;

  activeFill.style.width = "0%";
  progressTween = gsap.to(activeFill, {
    width: "100%",
    duration: STORY_DURATION_MS / 1000,
    ease: "none"
  });

  storyTimer = setTimeout(() => {
    nextStory();
  }, STORY_DURATION_MS);
}

function openStory(storyArr, startIndex = 0) {
  activeStory = storyArr;
  storyIndex = startIndex;

  storyOverlay.classList.add("open");
  storyOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  renderProgressBars(activeStory.length, storyIndex);
  renderStoryFrame(activeStory[storyIndex]);
  startProgress();
}

function closeStory() {
  clearTimers();
  storyOverlay.classList.remove("open");
  storyOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function nextStory() {
  clearTimers();
  if (storyIndex < activeStory.length - 1) {
    storyIndex++;
    renderProgressBars(activeStory.length, storyIndex);
    renderStoryFrame(activeStory[storyIndex]);
    startProgress();
  } else {
    closeStory();
  }
}

function prevStory() {
  clearTimers();
  if (storyIndex > 0) {
    storyIndex--;
    renderProgressBars(activeStory.length, storyIndex);
    renderStoryFrame(activeStory[storyIndex]);
    startProgress();
  } else {
    // rewind current
    renderProgressBars(activeStory.length, storyIndex);
    renderStoryFrame(activeStory[storyIndex]);
    startProgress();
  }
}

/* Wire up highlight bubbles */
document.querySelectorAll(".bubble").forEach((b) => {
  b.addEventListener("click", () => {
    const json = b.getAttribute("data-story");
    if (!json) return;
    let storyArr = [];
    try { storyArr = JSON.parse(json); } catch { storyArr = []; }
    if (!storyArr.length) return;

    openStory(storyArr, 0);
  });
});

storyClose.addEventListener("click", closeStory);
storyNext.addEventListener("click", nextStory);
storyPrev.addEventListener("click", prevStory);
tapLeft.addEventListener("click", prevStory);
tapRight.addEventListener("click", nextStory);

/* close on overlay click */
storyOverlay.addEventListener("click", (e) => {
  if (e.target === storyOverlay) closeStory();
});

/* pause/resume on pointer down/up (nice IG feel) */
storyBody.addEventListener("pointerdown", () => {
  if (progressTween) progressTween.pause();
  if (storyTimer) { clearTimeout(storyTimer); storyTimer = null; }
});
storyBody.addEventListener("pointerup", () => {
  // resume: restart remaining isn't trivial; keep it simple: restart full frame
  startProgress();
});

/* -----------------------------
   Event modal
------------------------------ */
const eventOverlay = document.getElementById("eventOverlay");
const eventClose = document.getElementById("eventClose");
const eventTitle = document.getElementById("eventTitle");
const eventDesc = document.getElementById("eventDesc");
const eventWhen = document.getElementById("eventWhen");
const eventWhere = document.getElementById("eventWhere");
const eventChips = document.getElementById("eventChips");
const reserveForm = document.getElementById("reserveForm");
const reserveNote = document.getElementById("reserveNote");

let activeEventEl = null;

function openEventModal(el) {
  activeEventEl = el;

  const title = el.dataset.title || "Event";
  const day = el.dataset.day || "";
  const time = el.dataset.time || "";
  const type = el.dataset.type || "";
  const location = el.dataset.location || "";
  const desc = el.dataset.desc || "";

  eventTitle.textContent = title;
  eventDesc.textContent = desc;
  eventWhen.textContent = `${day} • ${time}`;
  eventWhere.textContent = location;

  eventChips.innerHTML = `
    <span class="meta-chip">${day} • ${time}</span>
    <span class="meta-chip ghost">${type}</span>
  `;

  eventOverlay.classList.add("open");
  eventOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  gsap.fromTo(".event-modal", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: "power2.out" });
}

function closeEventModal() {
  eventOverlay.classList.remove("open");
  eventOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  activeEventEl = null;
}

document.querySelectorAll("[data-event]").forEach((card) => {
  card.addEventListener("click", () => openEventModal(card));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openEventModal(card);
    }
  });
});

eventClose.addEventListener("click", closeEventModal);
eventOverlay.addEventListener("click", (e) => {
  if (e.target === eventOverlay) closeEventModal();
});

/* Fake reserve handler */
reserveForm.addEventListener("submit", (e) => {
  e.preventDefault();
  reserveNote.textContent = "Saved 💙 (koppel dit later aan je backend / Mailchimp)";
  gsap.fromTo(reserveNote, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" });
});

/* Global ESC to close whichever is open */
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (eventOverlay.classList.contains("open")) closeEventModal();
  if (storyOverlay.classList.contains("open")) closeStory();
});
