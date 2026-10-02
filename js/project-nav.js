// Project list (project pages, desktop only)
// A small frosted glass pill in the top-right corner that says which project
// you're on ("02 / 13 Projects"). Hovering it opens a list of every project,
// so visitors can jump straight to another one.
//
// Like the shapes pill on the home page, it stays hidden until the mouse
// moves, shows faintly while the mouse moves elsewhere, and becomes fully
// visible when the mouse comes near it.
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

    // --- Build the pill and the list ---
    const nav = document.createElement("nav");
    nav.className = "project-list";
    nav.setAttribute("aria-label", "All projects");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "project-list-btn";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "project-list-items");
    button.innerHTML =
        `<span class="project-list-count"><b>${pad(current + 1)}</b> / ${pad(PROJECTS.length)}</span>` +
        `<span class="project-list-title">Projects</span>` +
        `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>`;
    button.setAttribute("aria-label", `Project ${current + 1} of ${PROJECTS.length}. Show all projects`);

    const list = document.createElement("ul");
    list.id = "project-list-items";
    PROJECTS.forEach(([href, name], i) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = href;
        if (i === current) a.setAttribute("aria-current", "page");
        const num = document.createElement("span");
        num.className = "project-list-num";
        num.textContent = pad(i + 1);
        num.setAttribute("aria-hidden", "true");
        a.append(num, name);
        li.append(a);
        list.append(li);
    });

    nav.append(button, list);
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
        button.setAttribute("aria-expanded", String(open));
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

    // Clicking the pill (or Enter/Space on the keyboard) also opens and closes it
    button.addEventListener("click", () => {
        clearTimeout(openTimer);
        setOpen(!nav.classList.contains("open"));
    });

    // Escape closes it; tabbing out of it closes it
    nav.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && nav.classList.contains("open")) {
            setOpen(false);
            button.focus();
        }
    });
    nav.addEventListener("focusout", (e) => {
        if (!nav.contains(e.relatedTarget)) setOpen(false);
    });

    // --- Three states, like the shapes pill on the home page ---
    //   hidden: the mouse is resting (or off the page)
    //   dim:    the mouse is moving somewhere on the page
    //   active: the mouse is near the pill, or the list is open
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
