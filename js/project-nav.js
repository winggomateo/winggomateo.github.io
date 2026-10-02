// Project list (project pages, desktop only)
// A stack of short lines on the right edge of every project page, one per
// project. The line for the project you're on is longer and black, so you
// can see where you are at a glance. Hovering the lines opens them into a
// frosted glass panel with every project's name, so visitors can jump
// straight to another one.
//
// Like the shapes pill on the home page, the lines stay hidden until the
// mouse moves, show faintly while the mouse moves elsewhere, and become
// fully visible when the mouse comes near them.
//
// To add, remove or reorder projects, edit the list below
// (keep it in the same order as the Design page).

const PROJECTS = [
    ["cmepPrints.html", "CMEP Prints & Signs"],
    ["mlkWeek.html", "MLK Week"],
    ["twelveTwelve.html", "Twelve Twelve"],
    ["bikingNYC.html", "Biking NYC"],
    ["futureFashion.html", "Future Fashion Group"],
    ["misMatch.html", "MisMatch"],
    ["alSadeem.html", "Al Sadeem"],
    ["nameTag.html", "CMEP Name Tag"],
    ["Calendar.html", "CMEP Calendar"],
    ["PGIL.html", "PGIL"],
    ["vinyl.html", "Vinyl Playing Cards"],
    ["BookCover.html", "On Writing Well"],
    ["zacharyParker.html", "Zachary Parker"],
];

(() => {
    // Desktop with a mouse only (phones and tablets use the links at the bottom)
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    // Which project is this page?
    const page = decodeURIComponent(location.pathname.split("/").pop() || "");
    const current = PROJECTS.findIndex(([href]) => href.toLowerCase() === page.toLowerCase());
    if (current === -1) return;

    const pad = (n) => String(n).padStart(2, "0");

    // --- Build the lines and the list ---
    const nav = document.createElement("nav");
    nav.className = "project-list";
    nav.setAttribute("aria-label", "All projects");

    // "Projects 02 / 13", shown at the top once open
    const label = document.createElement("p");
    label.className = "project-list-label";
    label.setAttribute("aria-hidden", "true");
    label.innerHTML = `Projects <span><b>${pad(current + 1)}</b> / ${pad(PROJECTS.length)}</span>`;

    const list = document.createElement("ul");
    PROJECTS.forEach(([href, name], i) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = href;
        if (i === current) a.setAttribute("aria-current", "page");
        const text = document.createElement("span");
        text.className = "project-list-name";
        text.textContent = name;
        const tick = document.createElement("span");
        tick.className = "project-list-tick";
        tick.setAttribute("aria-hidden", "true");
        a.append(text, tick);
        li.append(a);
        list.append(li);
    });

    nav.append(label, list);
    document.body.append(nav);

    // --- Opening and closing ---
    // Opens on hover after a short pause (so passing the mouse through the
    // corner doesn't pop it open), closes a moment after the mouse leaves.
    const OPEN_DELAY_MS = 150;
    const CLOSE_DELAY_MS = 300;
    let openTimer;
    let closeTimer;

    const setOpen = (open) => {
        nav.classList.toggle("open", open);
        // Once closed, fade away as usual if the mouse stays still
        if (!open) {
            clearTimeout(hideTimer);
            hideTimer = setTimeout(rest, HIDE_AFTER_MS);
        }
    };

    nav.addEventListener("mouseenter", () => {
        clearTimeout(closeTimer);
        openTimer = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    });
    nav.addEventListener("mouseleave", () => {
        clearTimeout(openTimer);
        closeTimer = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
    });

    // Keyboard: tabbing onto the links opens it, tabbing out or Escape closes it
    nav.addEventListener("focusin", () => setOpen(true));
    nav.addEventListener("focusout", (e) => {
        if (!nav.contains(e.relatedTarget)) setOpen(false);
    });
    nav.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            setOpen(false);
            document.activeElement.blur();
        }
    });

    // --- Three states, like the shapes pill on the home page ---
    //   hidden: the mouse is resting (or off the page)
    //   dim:    the mouse is moving somewhere on the page
    //   active: the mouse is near the lines, or the list is open
    const HIDE_AFTER_MS = 1000; // mouse resting this long hides it
    const NEAR_PX = 120; // "near" = the mouse is within this distance of it

    let hideTimer;
    let lastX = null;
    let lastY = null;

    const isNear = (x, y) => {
        const r = nav.getBoundingClientRect();
        const dx = Math.max(r.left - x, 0, x - r.right);
        const dy = Math.max(r.top - y, 0, y - r.bottom);
        return Math.hypot(dx, dy) <= NEAR_PX;
    };

    const setState = (state) => {
        nav.classList.toggle("dim", state === "dim");
        nav.classList.toggle("active", state === "active");
    };

    const rest = () => {
        // Resting near it, or with the list open, keeps it visible
        if (nav.classList.contains("open")) return;
        if (lastX !== null && isNear(lastX, lastY)) return;
        setState("hidden");
    };

    document.addEventListener(
        "mousemove",
        (e) => {
            // Some browsers send a "move" when the page scrolls under a still
            // mouse; only count real movement
            if (e.clientX === lastX && e.clientY === lastY) return;
            lastX = e.clientX;
            lastY = e.clientY;
            setState(isNear(lastX, lastY) || nav.classList.contains("open") ? "active" : "dim");
            clearTimeout(hideTimer);
            hideTimer = setTimeout(rest, HIDE_AFTER_MS);
        },
        { passive: true },
    );

    document.addEventListener("mouseleave", () => {
        clearTimeout(hideTimer);
        if (!nav.classList.contains("open")) setState("hidden");
    });
})();
