// Project card outline
// When you hover a project card, a teal line draws itself around the card,
// starting at the top-left corner and flowing clockwise until the whole
// outline is teal. Moving the mouse away rewinds it.
// This script adds the outline to every card automatically, so new cards
// get it too. The look and speed are set in css/style.css (section 9).

(() => {
    const cards = document.querySelectorAll(".project-card");
    if (!cards.length) return;

    const SVG = "http://www.w3.org/2000/svg";

    // Add an invisible outline (drawn with SVG) to each card
    cards.forEach((card) => {
        const svg = document.createElementNS(SVG, "svg");
        svg.classList.add("card-outline");
        svg.setAttribute("aria-hidden", "true");

        const rect = document.createElementNS(SVG, "rect");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        rect.setAttribute("width", "100%");
        rect.setAttribute("height", "100%");

        svg.append(rect);
        card.append(svg);
    });

    // The drawing effect needs to know how long the outline is, which
    // depends on the card's size, so measure it (and again when it changes)
    const measure = (card) => {
        const perimeter = 2 * (card.offsetWidth + card.offsetHeight);
        card.style.setProperty("--perimeter", `${perimeter}px`);
    };

    const observer = new ResizeObserver((entries) => entries.forEach((entry) => measure(entry.target)));
    cards.forEach((card) => {
        measure(card);
        observer.observe(card);
    });
})();
