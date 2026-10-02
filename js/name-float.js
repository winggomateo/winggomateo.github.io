// Floating name (home page)
// Each letter of the name drifts up and down and tilts very slightly, slowly
// and on its own rhythm, so the name floats along with the shapes.
// No mouse interaction. The movement itself is in the stylesheet
// (section 6, "Floating name"); this script only splits the name into
// letters and gives each one its own timing and amounts.
// Visitors with "reduce motion" turned on see the name still.

(() => {
    const h1 = document.querySelector(".home .header h1");
    if (!h1) return;

    const text = h1.textContent.trim();

    // A repeatable "random" number from 0 to 1 for each letter, so the
    // letters move differently from each other but the same on every visit
    const rand = (i, salt) => {
        const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
        return x - Math.floor(x);
    };

    // Screen readers read the full name once, not letter by letter
    h1.setAttribute("aria-label", text);
    h1.textContent = "";

    let i = 0;
    // Split into words (and after hyphens), so the name still only wraps
    // between words, the same as before
    text.split(" ").forEach((word, w) => {
        if (w > 0) h1.append(" ");
        word.split(/(?<=-)/).forEach((part) => {
            const group = document.createElement("span");
            group.className = "name-word";
            group.setAttribute("aria-hidden", "true");
            for (const ch of part) {
                const letter = document.createElement("span");
                letter.className = "name-letter";
                letter.textContent = ch;
                // How long each motion takes (seconds) and where it starts
                letter.style.setProperty("--bob-time", (7 + rand(i, 1) * 5).toFixed(2) + "s");
                letter.style.setProperty("--tilt-time", (9 + rand(i, 2) * 6).toFixed(2) + "s");
                letter.style.setProperty("--bob-start", (-rand(i, 3) * 12).toFixed(2) + "s");
                letter.style.setProperty("--tilt-start", (-rand(i, 4) * 15).toFixed(2) + "s");
                // How far it moves: some letters a little more, some a little less
                letter.style.setProperty("--bob", (0.6 + rand(i, 5) * 0.4).toFixed(2));
                letter.style.setProperty("--tilt", ((rand(i, 6) < 0.5 ? -1 : 1) * (0.6 + rand(i, 7) * 0.4)).toFixed(2));
                group.append(letter);
                i++;
            }
            h1.append(group);
        });
    });
})();
