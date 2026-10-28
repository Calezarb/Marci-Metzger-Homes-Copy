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
    toggle.setAttribute("aria-expanded", open);
}
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

/* ---------- gallery carousel ---------- */
const gallery = document.querySelector(".gallery");
const viewport = gallery.querySelector(".gallery__viewport");
const track = gallery.querySelector(".gallery__track");
const slides = [...gallery.querySelectorAll(".gallery__slide")];
const current = document.getElementById("current");
const total = document.getElementById("total");
const progress = gallery.querySelector(".gallery__progress span");
const playBtn = gallery.querySelector(".gallery__play");
const pad = (n) => String(n).padStart(2, "0");
const DELAY = 5000;

total.textContent = pad(slides.length);

let index = 0;
let timer = null;
let playing = !matchMedia("(prefers-reduced-motion: reduce)").matches; // no autoplay if the user asked for less motion
let paused = false; // temporary pause: hover / focus / off-screen

function show(i) {
    index = (i + slides.length) % slides.length; // loops at both ends
    const s = slides[index];
    const offset = viewport.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2);
    track.style.transform = `translateX(${offset}px)`; // centers the active slide
    slides.forEach((el, n) => el.classList.toggle("is-active", n === index));
    current.textContent = pad(index + 1);
    progress.style.setProperty("--p", (index + 1) / slides.length);
}

function schedule() {
    clearInterval(timer);
    if (playing && !paused && !document.hidden) timer = setInterval(() => show(index + 1), DELAY);
}

function go(i) {
    show(i);
    schedule(); // restart the timer after a manual change
}

function setPlaying(value) {
    playing = value;
    playBtn.textContent = value ? "Pause" : "Play";
    playBtn.setAttribute("aria-label", value ? "Pause slideshow" : "Play slideshow");
    schedule();
}

gallery.querySelector(".gallery__btn--prev").addEventListener("click", () => go(index - 1));
gallery.querySelector(".gallery__btn--next").addEventListener("click", () => go(index + 1));
playBtn.addEventListener("click", () => setPlaying(!playing));
if (!playing) setPlaying(false);

gallery.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(index - 1);
    if (e.key === "ArrowRight") go(index + 1);
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
    if (Math.abs(diff) > 50) go(diff < 0 ? index + 1 : index - 1);
}
viewport.addEventListener("pointerup", endDrag);
viewport.addEventListener("pointercancel", () => { dragging = false; viewport.classList.remove("is-dragging"); });

window.addEventListener("resize", () => show(index));
window.addEventListener("load", () => show(index)); // re-center once images have loaded
show(0);

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