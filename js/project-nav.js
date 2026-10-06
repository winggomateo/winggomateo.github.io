// Project list (project pages, desktop only)
// The project index: a stack of short lines in the top-right corner of every
// project page, one per
// project. The line for the project you're on is longer and black, so you
// can see where you are at a glance. Hovering the lines opens them into a
// frosted glass panel with every project's name, so visitors can jump
// straight to another one.
//
// The lines are always visible (softened), with "02 / 13" above them, and
// become fully visible when the mouse comes near them.
//
// The line for the current project also works as a scroll bar: it fills in
// black as you scroll down the page. Hovering a name in the open list shows
// a small preview image of that project.
//
// To add, remove or reorder projects, edit the list below: page, name, and
// preview image (the same image as its card on the Design page). Keep it in
// the same order as the Design page.

const PROJECTS = [
    ["cmepPrints.html", "CMEP Prints & Signs", "design/cmepPrints.jpg"],
    ["mlkWeek.html", "MLK Week", "design/mlk2024.jpg"],
    ["twelveTwelve.html", "Twelve Twelve", "design/TwelveTwelve2.jpg"],
    ["bikingNYC.html", "Biking NYC", "design/bikingNYC.png"],
    ["futureFashion.html", "Future Fashion Group", "design/FutureFashion.jpg"],
    ["misMatch.html", "MisMatch", "design/misMatch.png"],
    ["alSadeem.html", "Al Sadeem", "design/alSadeem.png"],
    ["nameTag.html", "CMEP Name Tag", "design/cmepNameTag.png"],
    ["Calendar.html", "CMEP Calendar", "design/CalendarCover.jpg"],
    ["zacharyParker.html", "Zachary Parker", "design/ZacharyParker.jpg"],
    // "More work" list on the Design page
    ["PGIL.html", "PGIL Video Series", "design/PGIL.jpg"],
    ["BookCover.html", "On Writing Well", "design/BookCover.jpg"],
    ["vinyl.html", "Vinyl Playing Cards", "design/Vinyl.jpg"],
];

// Extras that help people notice the list (set to false to turn one off):
// Peek: the first time someone opens a project page, the list unfolds on its
// own for a moment, then folds back into lines (once per visit).
const PEEK_ON_FIRST_VISIT = true;
// Next nudge: when you reach the bottom of a project, the next project's line
// turns teal and its name slides out ("Next: Twelve Twelve").
const NEXT_NUDGE = true;

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

    // "02 / 13" above the lines ("Projects 02 / 13" once open)
    const label = document.createElement("p");
    label.className = "project-list-label";
    label.setAttribute("aria-hidden", "true");
    label.innerHTML =
        `<span class="project-list-word">Projects</span>` +
        `<span class="project-list-count"><b>${pad(current + 1)}</b> / ${pad(PROJECTS.length)}</span>`;

    const list = document.createElement("ul");
    let fill;
    PROJECTS.forEach(([href, name], i) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = href;
        a.style.setProperty("--i", i); // used to unfold the names one after another
        a.dataset.preview = PROJECTS[i][2];
        if (i === current) a.setAttribute("aria-current", "page");
        if (i === (current + 1) % PROJECTS.length) a.classList.add("next");
        const text = document.createElement("span");
        text.className = "project-list-name";
        text.textContent = name;
        const tick = document.createElement("span");
        tick.className = "project-list-tick";
        tick.setAttribute("aria-hidden", "true");
        if (i === current) {
            // The black part that grows as you scroll down this page
            fill = document.createElement("span");
            fill.className = "project-list-fill";
            tick.append(fill);
        }
        a.append(text, tick);
        li.append(a);
        list.append(li);
    });

    // Preview image shown beside the open list
    const preview = document.createElement("div");
    preview.className = "project-list-preview";
    preview.setAttribute("aria-hidden", "true");
    const previewImg = document.createElement("img");
    previewImg.alt = "";
    preview.append(previewImg);

    nav.append(label, list, preview);
    document.body.append(nav);

    // --- Scroll progress on the current project's line ---
    // The page can scroll on <body> or on the window depending on the
    // browser, so check both.
    const scrollAmount = () => Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);
    const scrollRoom = () =>
        Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight;
    const hasNextCard = document.querySelector(".case-end") !== null;
    let ticking = false;
    const updateFill = () => {
        const progress = Math.min(1, Math.max(0, scrollAmount() / Math.max(1, scrollRoom())));
        fill.style.transform = `scaleX(${progress})`;
        // Next nudge: at the bottom of a page that actually scrolls
        // (skipped on pages that already end with a "Next project" card)
        if (NEXT_NUDGE && !hasNextCard) nav.classList.toggle("nudge", progress >= 0.98 && scrollRoom() > 100);
        ticking = false;
    };
    document.addEventListener(
        "scroll",
        () => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(updateFill);
            }
        },
        { capture: true, passive: true },
    );
    window.addEventListener("resize", updateFill);
    window.addEventListener("load", updateFill);
    updateFill();

    // --- Preview images ---
    let previewsLoaded = false;
    const loadPreviews = () => {
        // Fetch the preview images the first time the list opens
        if (previewsLoaded) return;
        previewsLoaded = true;
        PROJECTS.forEach(([, , img]) => {
            new Image().src = img;
        });
    };

    const showPreview = (a) => {
        if (!nav.classList.contains("open")) return;
        previewImg.src = a.dataset.preview;
        // Line the preview up with the name, keeping it inside the panel's height
        const navBox = nav.getBoundingClientRect();
        const rowBox = a.getBoundingClientRect();
        const h = preview.offsetHeight;
        const top = rowBox.top + rowBox.height / 2 - navBox.top - h / 2;
        preview.style.top = `${Math.min(Math.max(top, 0), navBox.height - h)}px`;
        preview.classList.add("show");
    };
    const hidePreview = () => preview.classList.remove("show");

    list.querySelectorAll("a").forEach((a) => {
        a.addEventListener("mouseenter", () => showPreview(a));
        a.addEventListener("focus", () => setTimeout(() => showPreview(a))); // after the list has opened
    });
    list.addEventListener("mouseleave", hidePreview);

    // --- Opening and closing ---
    // Opens on hover after a short pause (so passing the mouse through the
    // corner doesn't pop it open), closes a moment after the mouse leaves.
    const OPEN_DELAY_MS = 150;
    const CLOSE_DELAY_MS = 300;
    let openTimer;
    let closeTimer;

    const setOpen = (open) => {
        nav.classList.toggle("open", open);
        if (open) loadPreviews();
        else hidePreview();
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

    // --- States, like the shapes pill on the home page (minus hiding) ---
    //   dim:    softened (the default, and while the mouse is elsewhere)
    //   active: the mouse is near the lines, or the list is open
    const HIDE_AFTER_MS = 1000; // mouse resting this long softens it again
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
        setState("dim");
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
        if (!nav.classList.contains("open")) setState("dim");
    });

    // --- Peek on the first visit ---
    const PEEK_AFTER_MS = 1500; // wait this long after the page opens
    const PEEK_FOR_MS = 2200; // stay open this long
    let peeked = true;
    try {
        peeked = sessionStorage.getItem("projectListPeeked") === "1";
        sessionStorage.setItem("projectListPeeked", "1");
    } catch (e) {}
    if (PEEK_ON_FIRST_VISIT && !peeked) {
        setTimeout(() => {
            if (nav.classList.contains("open")) return;
            nav.classList.add("peek");
            setState("active");
            setOpen(true);
            setTimeout(() => {
                nav.classList.remove("peek");
                // Leave it open if the visitor has moved onto it meanwhile
                if (!nav.matches(":hover") && !nav.contains(document.activeElement)) setOpen(false);
            }, PEEK_FOR_MS);
        }, PEEK_AFTER_MS);
    }
})();
