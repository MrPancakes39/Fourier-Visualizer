let speed;
let cx, cy;
let A, θ, n;
let wave = [];

let colors = {
    red: "#c74440",
    blue: "#2d70b3",
    yellow: "#cc9900",
    green: "#388c46",
    purple: "#6042a6",
    orange: "#fa7e19",
    black: "#000000"
}
let colorsList = Object.values(colors);

function setup() {
    width = 0.9 * windowWidth;
    let canvas = createCanvas(width, 400);
    canvas.parent("#sketch-holder");

    /*
     *   Creates the sliders.
     */
    numTerms = createP("Number of Terms:");
    termsSlider = createSlider(1, 100, 1, 1);
    numTerms.parent("#n_terms");
    termsSlider.parent("#n_terms");
    termsSlider.style("width", "100%");

    createP("Radius of Circle:").parent("#c_radius");
    radiusSlider = createSlider(50, 150, 100, 1);
    radiusSlider.parent("#c_radius");

    createP("Speed:").parent("#c_speed");
    speedSlider = createSlider(0.5, 5, 1, 0.1);
    speedSlider.parent("#c_speed");

    // Initializes some values.
    θ = 0;
    cx = 300;
    cy = height / 2;
}

function draw() {
    background(218);

    // Updates values based on sliders.
    n = termsSlider.value();
    A = radiusSlider.value();
    speed = speedSlider.value() / (5 * TWO_PI);
    numTerms.html(`Number of Terms: ${n}`);
    offset = 2 * A + 100;

    // Translate to center circle.
    translate(cx, cy);

    // Creates the sum.
    let [x, y] = [0, 0];
    for (let k = 0; k < n; k++) {
        let prevx = x;
        let prevy = y;

        let r = A * (4 / ((2 * k + 1) * PI));
        x += r * cos((2 * k + 1) * θ);
        y += r * sin((2 * k + 1) * θ);

        // Pickes the color for the circles.
        stroke(colorsList[k % colorsList.length]);

        // draws the circles.
        push();
        noFill();
        strokeWeight(2);
        ellipseMode(RADIUS);
        circle(prevx, prevy, r);
        pop();

        // draws the lines.
        push();
        strokeWeight(3);
        line(prevx, prevy, x, y);
        pop();

        // draws the final circle.
        if (k == n - 1) {
            push();
            fill(0);
            noStroke();
            circle(x, y, 8);
            pop();
        }
    }
    // appends the y value to list.
    wave.unshift(y);
    if (wave.length > 1200) {
        wave.pop(); // wave's max size is 1200.
    }

    // draws the wave.
    push();
    noFill();
    beginShape();
    for (let i = 0; i < wave.length; i++) {
        vertex(i + offset, wave[i]);
    }
    endShape();
    pop();

    // Draws the line connecting point with wave.
    stroke(0);
    line(x, y, offset, wave[0]);

    θ -= speed;
    θ %= TWO_PI;
}