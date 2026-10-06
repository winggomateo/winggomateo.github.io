// About page: the shapes stuck around the portrait. Click one and it
// gives a quick spin and bounce (same as clicking a shape on the homepage).
// The slow turning is in css/style.css (section 7).

(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".sticker").forEach((el) => {
        el.draggable = false;
        el.addEventListener("click", () => {
            el.animate(
                [
                    { transform: "rotate(0deg) scale(1)" },
                    { transform: "rotate(200deg) scale(1.2)", offset: 0.45 },
                    { transform: "rotate(340deg) scale(0.92)", offset: 0.8 },
                    { transform: "rotate(360deg) scale(1)" },
                ],
                { duration: 900, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
            );
        });
    });
})();
