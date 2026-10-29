document.documentElement.classList.add("js"); // lets CSS hide .reveal items only when JS runs

/* ---------- sticky header ---------- */
const header = document.getElementById("header");
const nav = document.getElementById("nav");
const toggle = document.querySelector(".header__toggle");

function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 60);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- mobile menu ---------- */
function setMenu(open) {
    nav.classList.toggle("is-open", open);
    header.classList.toggle("has-menu", open); // header takes the menu's white while it is open
    toggle.setAttribute("aria-expanded", open);
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
window.addEventListener("resize", () => { if (window.innerWidth > 800) setMenu(false); });
toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

/* ---------- scroll reveal ---------- */
const revealObserver = new IntersectionObserver(
    (entries) =>
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("is-visible");
            revealObserver.unobserve(e.target); // animate once
        }),
    { threshold: 0.2 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- gallery carousel (loops forward forever) ---------- */
const gallery = document.querySelector(".gallery");
const viewport = gallery.querySelector(".gallery__viewport");
const track = gallery.querySelector(".gallery__track");
const real = [...gallery.querySelectorAll(".gallery__slide")];
const n = real.length;
const CL = 2; // clones on each side, so the neighbours always have a photo to peek at
const current = document.getElementById("current");
const total = document.getElementById("total");
const progress = gallery.querySelector(".gallery__progress span");
const playBtn = gallery.querySelector(".gallery__play");
const pad = (num) => String(num).padStart(2, "0");
const DELAY = 5000;

total.textContent = pad(n);

// Copies of the last and first slides sit at the ends. Going 7 -> 1 slides onto a copy of 1,
// then we silently jump to the real 1, so the carousel never rewinds backwards.
const makeClone = (el) => {
    const c = el.cloneNode(true);
    ["role", "aria-label", "aria-roledescription"].forEach((a) => c.removeAttribute(a));
    c.setAttribute("aria-hidden", "true");
    return c;
};
track.prepend(...real.slice(-CL).map(makeClone));
track.append(...real.slice(0, CL).map(makeClone));
const slides = [...track.children];

// thumbnails that appear over the photo on hover
const thumbBox = document.createElement("div");
thumbBox.className = "gallery__thumbs";
thumbBox.setAttribute("role", "group");
thumbBox.setAttribute("aria-label", "Choose a photo");
const thumbs = real.map((el, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "gallery__thumb";
    b.setAttribute("aria-label", `Show photo ${i + 1}`);
    b.innerHTML = `<img src="${el.querySelector("img").getAttribute("src")}" alt="" loading="lazy">`;
    b.addEventListener("click", () => jump(i));
    thumbBox.append(b);
    return b;
});
viewport.append(thumbBox);

let index = 0; // which real photo (0 - 6)
let pos = CL; // position in the list that includes the clones
let locked = false; // true for a moment while we are on a clone
let timer = null;
let playing = !matchMedia("(prefers-reduced-motion: reduce)").matches; // no autoplay if the user asked for less motion
let paused = false; // temporary pause: hover / focus / off-screen

function place(animate) {
    const s = slides[pos];
    const offset = viewport.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2);
    track.classList.toggle("no-anim", !animate);
    track.style.transform = `translateX(${offset}px)`; // centers the active slide
    slides.forEach((el, k) => el.classList.toggle("is-active", k === pos));
    if (!animate) {
        void track.offsetWidth; // apply the instant move before animations come back
        track.classList.remove("no-anim");
    }
    index = (((pos - CL) % n) + n) % n;
    current.textContent = pad(index + 1);
    progress.style.setProperty("--p", (index + 1) / n);
    thumbs.forEach((t, k) => t.setAttribute("aria-current", k === index));
}

function step(delta) {
    if (locked) return;
    pos += delta;
    place(true);
    if (pos < CL || pos >= CL + n) {
        // we are on a clone: once the slide animation ends, jump to its real twin
        locked = true;
        setTimeout(() => {
            pos = CL + (((pos - CL) % n) + n) % n;
            place(false);
            locked = false;
        }, 650);
    }
}

function schedule() {
    clearInterval(timer);
    if (playing && !paused && !document.hidden) timer = setInterval(() => step(1), DELAY);
}

function go(delta) {
    step(delta);
    schedule(); // restart the timer after a manual change
}

function jump(i) {
    if (locked) return;
    pos = CL + i;
    place(true);
    schedule();
}

function setPlaying(value) {
    playing = value;
    playBtn.textContent = value ? "Pause" : "Play";
    playBtn.setAttribute("aria-label", value ? "Pause slideshow" : "Play slideshow");
    schedule();
}

gallery.querySelector(".gallery__btn--prev").addEventListener("click", () => go(-1));
gallery.querySelector(".gallery__btn--next").addEventListener("click", () => go(1));
playBtn.addEventListener("click", () => setPlaying(!playing));
if (!playing) setPlaying(false);

gallery.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
});

// pause while the user is interacting, or when the gallery is off screen
const setPaused = (v) => { paused = v; schedule(); };
gallery.addEventListener("mouseenter", () => setPaused(true));
gallery.addEventListener("mouseleave", () => setPaused(false));
gallery.addEventListener("focusin", () => setPaused(true));
gallery.addEventListener("focusout", () => setPaused(false));
document.addEventListener("visibilitychange", schedule);
new IntersectionObserver(([e]) => setPaused(!e.isIntersecting), { threshold: 0.3 }).observe(gallery);

// drag with mouse, swipe with touch (pointer events cover both)
let startX = 0;
let dragging = false;
viewport.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    dragging = true;
    startX = e.clientX;
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add("is-dragging");
});
function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove("is-dragging");
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 50) go(diff < 0 ? 1 : -1);
}
viewport.addEventListener("pointerup", endDrag);
viewport.addEventListener("pointercancel", () => { dragging = false; viewport.classList.remove("is-dragging"); });

window.addEventListener("resize", () => place(false));
window.addEventListener("load", () => place(false)); // re-center once images have loaded
place(false);

/* ---------- reviews carousel ---------- */
const rTrack = document.querySelector(".reviews__track");
const rPrev = document.querySelector(".reviews__btn--prev");
const rNext = document.querySelector(".reviews__btn--next");
const rBehavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

function rStep() {
    const gap = parseFloat(getComputedStyle(rTrack).columnGap) || 24;
    return rTrack.querySelector(".review").offsetWidth + gap; // one card at a time
}
function rUpdate() {
    rPrev.disabled = rTrack.scrollLeft <= 2;
    rNext.disabled = rTrack.scrollLeft >= rTrack.scrollWidth - rTrack.clientWidth - 2;
}
rPrev.addEventListener("click", () => rTrack.scrollBy({ left: -rStep(), behavior: rBehavior }));
rNext.addEventListener("click", () => rTrack.scrollBy({ left: rStep(), behavior: rBehavior }));
rTrack.addEventListener("scroll", rUpdate, { passive: true });
window.addEventListener("resize", rUpdate);
rUpdate();

/* ---------- office hours: bold today's row ---------- */
const today = new Date().getDay(); // 0 = Sunday ... 6 = Saturday
document.querySelector(`.hours__list [data-day="${today}"]`)?.classList.add("is-today");