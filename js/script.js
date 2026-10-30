document.documentElement.classList.add("js");

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
    header.classList.toggle("has-menu", open);
    toggle.setAttribute("aria-expanded", open);
}
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
});
window.addEventListener("resize", () => {
    if (window.innerWidth > 800) setMenu(false);
});
toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

/* ---------- scroll reveal ---------- */
const revealObserver = new IntersectionObserver(
    (entries) =>
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("is-visible");
            revealObserver.unobserve(e.target);
        }),
    { threshold: 0.2 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- mobile search drawer ---------- */
const heroBlock = document.querySelector(".hero-block");
const searchToggle = document.querySelector(".search-toggle");

function setSearchOpen(open) {
    heroBlock.classList.toggle("is-search-open", open);
    searchToggle.setAttribute("aria-expanded", open);
}

function showHero() {
    heroBlock.scrollIntoView({ behavior: "smooth", block: "start" });
}

searchToggle.addEventListener("click", () => {
    const open = !heroBlock.classList.contains("is-search-open");
    setSearchOpen(open);
    if (open) showHero();
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 800) setSearchOpen(false);
});

document.querySelectorAll('a[href="#listings"]').forEach((link) => {
    link.addEventListener("click", (e) => {
        if (window.innerWidth > 800) return;
        e.preventDefault();
        setSearchOpen(true);
        showHero();
    });
});

/* ---------- gallery slideshow (cross-fade: after photo 7 it simply fades to photo 1) ---------- */
const slides = [...document.querySelectorAll(".gallery__slide")];
const thumbs = [...document.querySelectorAll(".gallery__thumb")];
const thumbList = document.querySelector(".gallery__thumbs");
const galleryCurrent = document.getElementById("gallery-current");
document.getElementById("gallery-total").textContent = slides.length;

const SLIDE_DELAY = 5000;
const autoplay = !matchMedia("(prefers-reduced-motion: reduce)").matches;
let current = 0;
let slideTimer = null;

function showSlide(i) {
    current = (i + slides.length) % slides.length; // wraps 7 -> 1 without rewinding
    slides.forEach((s, n) => s.classList.toggle("is-active", n === current));
    thumbs.forEach((t, n) => {
        t.classList.toggle("is-active", n === current);
        t.setAttribute("aria-current", n === current ? "true" : "false");
    });
    galleryCurrent.textContent = current + 1;

    // keep the active thumbnail visible inside its own scroller (never scrolls the page)
    const li = thumbs[current].parentElement;
    thumbList.scrollTo({
        top: li.offsetTop - (thumbList.clientHeight - li.offsetHeight) / 2,
        left: li.offsetLeft - (thumbList.clientWidth - li.offsetWidth) / 2,
        behavior: "smooth",
    });
}

function startSlideshow() {
    clearInterval(slideTimer);
    if (!autoplay) return;
    slideTimer = setInterval(() => {
        if (!document.hidden) showSlide(current + 1);
    }, SLIDE_DELAY);
}

thumbs.forEach((btn, n) =>
    btn.addEventListener("click", () => {
        showSlide(n);
        startSlideshow(); // restart the timer so the photo you picked is not skipped right away
    })
);
startSlideshow();

/* ---------- reviews carousel ---------- */
const rTrack = document.querySelector(".reviews__track");
const rPrev = document.querySelector(".reviews__btn--prev");
const rNext = document.querySelector(".reviews__btn--next");
const rBehavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

function rStep() {
    const gap = parseFloat(getComputedStyle(rTrack).columnGap) || 24;
    return rTrack.querySelector(".review").offsetWidth + gap;
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
const today = new Date().getDay();
document.querySelector(`.hours__list [data-day="${today}"]`)?.classList.add("is-today");