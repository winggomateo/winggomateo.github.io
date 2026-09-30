// Section indicator (desktop only)
// Two short lines on the right edge: the top one stands for the intro (your
// name), the bottom one for the projects. The one for the section you're in
// is black. As you scroll from the intro into the projects, the black
// "drains" out of the top line and flows into the bottom one.
// Click a line to jump to that section.

(() => {
    const nav = document.querySelector(".section-nav");
    const intro = document.querySelector(".block1");
    const work = document.getElementById("work");
    if (!nav || !intro || !work) return;

    const [topFill, bottomFill] = nav.querySelectorAll(".fill");
    const [topBtn, bottomBtn] = nav.querySelectorAll("button");

    // The page can scroll on <body> or on the window depending on the browser
    const scrollPos = () => Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);

    // How far through the switch we are: 0 = at the top, 1 = projects reached.
    // SWITCH_POINT: the switch finishes after scrolling this share of the intro.
    const SWITCH_POINT = 0.75;

    const update = () => {
        const p = Math.min(Math.max(scrollPos() / (intro.offsetHeight * SWITCH_POINT), 0), 1);
        // top line: black drains away from its top edge
        topFill.style.clipPath = `inset(${p * 100}% 0 0 0)`;
        // bottom line: black fills in from its top edge
        bottomFill.style.clipPath = `inset(0 0 ${(1 - p) * 100}% 0)`;
        nav.classList.toggle("in-work", p >= 0.5);
    };

    const goTo = (y) => {
        document.body.scrollTo({ top: y, behavior: "smooth" });
        window.scrollTo({ top: y, behavior: "smooth" });
    };
    topBtn.addEventListener("click", () => goTo(0));
    bottomBtn.addEventListener("click", () => work.scrollIntoView({ behavior: "smooth" }));

    let ticking = false;
    document.addEventListener(
        "scroll",
        () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                update();
                ticking = false;
            });
        },
        { capture: true, passive: true },
    );
    window.addEventListener("resize", update);
    update();
})();
