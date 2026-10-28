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

/* ---------- gallery carousel ---------- */
const gallery = document.querySelector(".gallery");
const viewport = gallery.querySelector(".gallery__viewport");
const track = gallery.querySelector(".gallery__track");
const slides = [...gallery.querySelectorAll(".gallery__slide")];
const current = document.getElementById("current");
document.getElementById("total").textContent = slides.length;

let index = 0;

function show(i) {
    index = (i + slides.length) % slides.length; // loops at both ends
    const s = slides[index];
    const offset = viewport.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2);
    track.style.transform = `translateX(${offset}px)`; // centers the active slide
    slides.forEach((el, n) => el.classList.toggle("is-active", n === index));
    current.textContent = index + 1;
}

gallery.querySelector(".gallery__btn--prev").addEventListener("click", () => show(index - 1));
gallery.querySelector(".gallery__btn--next").addEventListener("click", () => show(index + 1));

gallery.addEventListener("keydown", (e) => {
    // arrow keys while focus is in the gallery
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
});

let startX = 0; // swipe on touch screens
viewport.addEventListener(
    "touchstart",
    (e) => {
        startX = e.touches[0].clientX;
    },
    { passive: true }
);
viewport.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) show(diff < 0 ? index + 1 : index - 1);
});

window.addEventListener("resize", () => show(index));
window.addEventListener("load", () => show(index)); // re-center once images have loaded
show(0);

/* ---------- office hours: bold today's row ---------- */
const today = new Date().getDay(); // 0 = Sunday ... 6 = Saturday
document.querySelector(`.hours__list [data-day="${today}"]`)?.classList.add("is-today");
