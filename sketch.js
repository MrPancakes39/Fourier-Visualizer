let speed;
let cx, cy;
let A, t, n;
let wave = [];

// Colors used for the circles.
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

// The preset fourier series curves with their equations.
let eq = $("#eq");
let options = $("#presets");
let presets = {
    "square": ["( 4*A ) / ( (2*k+1) * PI )", "(2*k+1)", "0"],
    "sawtooth": ["( 2*A ) / ( (k+1) * PI )", "(k+1) * PI", "0"],
    "triangle": ["( 8*A ) / ( pow((2*k+1), 2) * pow(PI, 2) )", "(2*k+1)", "HALF_PI"]
};
let eqs = {
    "square": ["\\(\\sum_{k=0}^{\\infty}\\frac{4A}{(2k+1)\\pi}\\sin((2k+1)t)\\)"],
    "sawtooth": ["\\(\\sum_{k=0}^{\\infty}\\frac{2A}{(k+1)\\pi}\\sin((k+1)\\pi t)\\)"],
    "triangle": ["\\(\\sum_{k=0}^{\\infty}\\frac{8A}{(2k+1)^2 \\pi^2}\\cos((2k+1)t)\\)"],
};
let option = options.val();
eq.text(eqs[option]);

function setup() {
    width = 0.9 * windowWidth;
    let canvas = createCanvas(width, 400);
    canvas.parent("#sketch-holder");

    makeSliders();
    eventHandlers();

    // Initializes some values.
    t = 0;
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

        let amp = eval(presets[option][0]);
        let freq = eval(presets[option][1]);
        let phase = eval(presets[option][2]);

        x += amp * cos(freq * t + phase);
        y += amp * sin(freq * t + phase);

        // Pickes the color for the circles.
        stroke(colorsList[k % colorsList.length]);

        // draws the circles.
        push();
        noFill();
        strokeWeight(2);
        ellipseMode(RADIUS);
        circle(prevx, prevy, amp);
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

    t -= speed;
}

function eventHandlers() {
    options.change(() => {
        wave = [];
        resetSliders();
        option = options.val();
        eq.text(eqs[option]);
        MathJax.typeset();
    });

    let playBtn = $("#play");
    playBtn.click(() => {
        if (playBtn.hasClass(".active")) {
            loop();
            playBtn.text("Pause");
        } else {
            noLoop();
            playBtn.text("Play");
        }
        playBtn.toggleClass(".active");
    });

    $("#reset").click(resetSliders);
}

function makeSliders() {
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
}

function resetSliders() {
    termsSlider.value(1);
    radiusSlider.value(100);
    speedSlider.value(1);
}