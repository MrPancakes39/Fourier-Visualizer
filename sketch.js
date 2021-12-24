// ========================================================================================
let speed;
let cx, cy;
let A, t, n;
let wave = [];
let waveAmp = [];
let wavePhase = [];

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
let currentOption = options.val();
eq.text(eqs[currentOption]);

// The variables for custom curve options.
let customParms;
let customOption = false;

// ANCHOR: Start of the main sketch.
// ========================================================================================
function setup() {
    width = 0.9 * windowWidth;
    let canvas = createCanvas(width, 400);
    canvas.parent("#sketch-holder");

    makeSliders();
    eventHandlers();

    /*
     *  Positions view-2 div to the left of the screen,
     *  and sets the switch container to Fourier Series tab.
     */
    $("#view-2").css("left", $("#wrapper").width()).css("display", "flex");
    $("#switch-container").data("toggleNumber", false);
    $("#ft-phaseSketch").css("margin-left", "auto");

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
    let x = 0,
        y = 0;
    waveAmp = [];
    wavePhase = [];
    for (let k = 0; k < n; k++) {
        let prevx = x;
        let prevy = y;

        let amp, freq, phase;
        if (customOption) {
            // If they input custom curve use that instead of presets.
            try {
                amp = eval(customParms.amp);
                freq = eval(customParms.freq);
                phase = eval(customParms.phase);
            } catch (e) {
                console.error(e);
                alert("Something went wrong. Try again.");
                noLoop();
            }
        } else {
            // Otherwise use the preset selected.
            amp = eval(presets[currentOption][0]);
            freq = eval(presets[currentOption][1]);
            phase = eval(presets[currentOption][2]);
        }

        // Store The Amplitude and Phase.
        waveAmp[k] = amp;
        wavePhase[k] = phase;
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
    if (wave.length > 1100) {
        wave.pop(); // wave's max size is 1100.
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
    if (t < -TWO_PI) {
        t = 0;
    }
}
// ========================================================================================

// ANCHOR: Event Handlers Function.
// ========================================================================================
function eventHandlers() {
    // Activates when they press set preset button.
    $("#set-preset").click(() => {
        if (currentOption != options.val() || customOption) {
            wave = [];
            resetSliders();
            customOption = false;
            currentOption = options.val();
            eq.text(eqs[currentOption]);
            MathJax.typeset();
        }
    });

    // Activates when they submit custom curve.
    let form = document.querySelector("#custom-curves");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const amp = formData.get("amp");
        const freq = formData.get("freq");
        const phase = formData.get("phase");

        customParms = {
            amp,
            freq,
            phase
        };

        loop();
        wave = [];
        resetSliders();
        customOption = true;
        eq.text("\\(\\sum_{k=0}^{\\infty}Amp*\\sin(f*t+\\phi)\\)");
        MathJax.typeset();
    })

    // Play/Puases the main sketch.
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

    // Control Arrows that switch between view-1 and view-2 divs.
    $("#right-arrow").click(() => {
        $("#view-1").animate({ "left": -$("#wrapper").width() });
        $("#view-2").animate({ "left": 0 });
    });

    $("#left-arrow").click(() => {
        $("#view-2").animate({ "left": $("#wrapper").width() });
        $("#view-1").animate({ "left": 0 });
    });

    $("#switch-container").click(switchTabs);

    // Activates when you upload file.
    $("#ft-file-upload").change(() => {
        let file = $("#ft-file-upload").val();
        let filename = "Choose file...";
        if (file) {
            filename = file.match(/[\/\\]([\w\d\s\.\-\(\)]+)$/)[1];
        }
        $("#ft-file-text").attr("data-text", filename);
    });

    // Activates when you submit the custom path file.
    $("#ft-set-path").click(setFTPath);

    // Generates a new Noise Signal.
    $("#ft-gen").click(() => {
        let xt = [];
        genSignal(xt);
        ftSketch.fourierX = dft(xt);
        ftSketch.local_wave = [];
        ftSketch.local_t = 0;
        ftAmpSketch.loop();
        ftPhaseSketch.loop();
    });
}

// ========================================================================================
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
// ========================================================================================

// ANCHOR: Amplitude Sketch.
// ========================================================================================
let ampSketch = new p5((p) => {
    p.setup = function() {
        width = 0.9 * windowWidth;
        let canvas = p.createCanvas(width, 300);
        canvas.parent("#amp-sketch");
        canvas.style("margin-bottom", "1.5rem");
    };

    p.draw = function() {
        p.background(218);
        p.translate(20, 280);

        // Draw The Axis.
        p.push();
        p.line(0, 0, p.width - 35, 0);
        p.line(0, 0, 0, -270);
        p.fill(0);
        p.triangle(-10, -250, 0, -270, 10, -250);
        p.triangle(p.width - 55, 10, p.width - 35, 0, p.width - 55, -10);
        p.pop();

        // Draw The Units.
        p.push();
        p.textSize(18);
        p.text("2|C |", 15, -254);
        p.text("f", p.width - 56, -15);
        p.textSize(12);
        p.text("n", 46, -250);
        p.pop();

        // Draw The Amplitudes.
        p.push();
        p.strokeWeight(4);
        p.stroke(colors.blue);
        for (let i = 0; i < waveAmp.length; i++) {
            let x = p.map(i, 0, waveAmp.length, 0, p.width - 60);
            p.push();
            if (waveAmp[i] < 0) {
                waveAmp[i] *= -1;
                p.stroke(colors.red);
            }
            p.line(x + 10, 0, x + 10, -waveAmp[i]);
            p.pop();
        }
        p.pop();

        // Draw The Note.
        p.push();
        p.textSize(18);
        let str = "Note: This is the Amp = 2|Cn|";
        p.text(str, p.width - 10 * str.length, -260);
        p.pop();
    };
});
// ========================================================================================

// ANCHOR: Phase Sketch.
// ========================================================================================
let phaseSketch = new p5((p) => {
    p.setup = function() {
        width = 0.9 * windowWidth;
        let canvas = p.createCanvas(width, 300);
        canvas.parent("#phase-sketch");
    };

    p.draw = function() {
        p.background(218);
        p.translate(30, 280);

        // Draw The Axis.
        p.push();
        p.line(0, 0, p.width - 35, 0);
        p.line(0, 0, 0, -270);
        p.fill(0);
        p.triangle(-10, -250, 0, -270, 10, -250);
        p.triangle(p.width - 55, 10, p.width - 35, 0, p.width - 55, -10);
        p.pop();

        // Draw The Scale.
        p.push();
        p.line(0, -60, 5, -60);
        p.line(0, -120, 5, -120);
        p.line(0, -180, 5, -180);
        p.line(0, -240, 5, -240);

        p.textSize(18);
        p.text("π", -20, -65);
        p.text("_\n2", -20, -62);
        p.text("π", -20, -115);
        p.text("3", -25, -185);
        p.text("π", -13, -173);
        p.text("_\n2", -25, -182);
        p.text("2π", -25, -230);
        p.pop();

        // Draw The Units.
        p.push();
        p.textSize(18);
        p.text("ϕ", 15, -254);
        p.text("f", p.width - 56, -15);
        p.textSize(12);
        p.text("n", 28, -249);
        p.pop();

        // Draw The Phase Differences.
        p.push();
        p.strokeWeight(4);
        p.stroke(colors.blue);
        for (let i = 0; i < wavePhase.length; i++) {
            let x = p.map(i, 0, wavePhase.length, 0, p.width - 60);
            let y = p.map(wavePhase[i], 0, p.TWO_PI, 0, -240);
            p.line(x + 10, 0, x + 10, y);
        }
        p.pop();
    };
});

// ========================================================================================
function switchTabs() {
    let toggleContainer = $("#toggle-container");
    let toggleNumber = $(this).data("toggleNumber");

    toggleNumber = !toggleNumber;
    $(this).data("toggleNumber", toggleNumber);

    let fseries = $("#wrapper");
    let ftransform = $("#ftransform");

    if (toggleNumber) {
        // Switches the highlighted part of the switch.
        toggleContainer.css("clipPath", "inset(0 0 0 50%)");
        toggleContainer.css("backgroundColor", "dodgerblue");

        fseries.hide();
        ftransform.show();

        noLoop();
        ampSketch.noLoop();
        phaseSketch.noLoop();
        ftSketch.loop();
    } else {
        // Switches the highlighted part of the switch.
        toggleContainer.css("clipPath", "inset(0 50% 0 0)");
        toggleContainer.css("backgroundColor", "dodgerblue");

        fseries.show();
        ftransform.hide();

        loop();
        ampSketch.loop();
        phaseSketch.loop();
        ftSketch.noLoop();
    }
}
// ========================================================================================

// ANCHOR: Fourier Transform Sketch. 
// ========================================================================================
let ftSketch = new p5((p) => {
    let local_A, local_speed;
    let local_cx, local_cy;

    let xt = [];
    p.local_t = 0;
    p.fourierX = [];
    p.local_wave = [];

    p.setup = function() {
        width = 0.9 * windowWidth;
        let canvas = p.createCanvas(width, 300);
        canvas.parent("#ft-sketch");
        canvas.style("margin-bottom", "1rem");

        local_t = 0;
        local_A = 80;
        local_cx = 200;
        local_cy = p.height / 2;

        let val = 0;
        for (let i = 0; i < 238; i++) {
            xt[i] = 100 * cos(val);
            val += 0.08;
        }
        p.fourierX = dft(xt);
        p.noLoop();
    };

    p.draw = function() {
        p.background(0);
        p.stroke(255);

        // Translate to center circle.
        p.translate(local_cx, local_cy);

        let [x, y] = [0, 0];
        for (let k = 0; k < p.fourierX.length; k++) {
            let prevx = x;
            let prevy = y;

            let { amp, freq, phase } = p.fourierX[k];
            x += amp * p.sin(freq * p.local_t + phase);
            y += amp * p.cos(freq * p.local_t + phase);

            // draws the circles.
            p.push();
            p.noFill();
            p.strokeWeight(2);
            p.ellipseMode(RADIUS);
            p.circle(prevx, prevy, amp);
            p.pop();

            // draws the lines.
            p.push();
            p.strokeWeight(3);
            p.line(prevx, prevy, x, y);
            p.pop();
        }

        // appends the y value to list.
        p.local_wave.unshift(y);
        if (p.local_wave.length > 1200) {
            p.local_wave.pop(); // wave's max size is 1200.
        }

        let offset = 2 * local_A + 100;

        // draws the wave.
        p.push();
        p.noFill();
        p.line(x, y, offset, y);
        p.beginShape();
        for (let i = 0; i < p.local_wave.length; i++) {
            p.vertex(i + offset, p.local_wave[i]);
        }
        p.endShape();
        p.pop();

        local_speed = p.TWO_PI / p.fourierX.length;
        p.local_t -= local_speed;
        if (p.local_t < -TWO_PI) {
            p.local_t = 0;
        }
    };
});
// ========================================================================================

function genSignal(xt) {
    noiseSeed(Math.floor(Date.now() / 1000) % 10000);
    let val = random(0, 1000);
    for (let i = 0; i < 300; i++) {
        xt[i] = map(noise(val), 0, 1, -100, 200);
        val += 0.05;
    }
}

// Computes the Discrete Fourier Transform of an Array.
function dft(x) {
    let X = [];
    let N = x.length;
    for (let k = 0; k < N; k++) {
        let re = 0;
        let im = 0;
        for (let n = 0; n < N; n++) {
            let phi = (TWO_PI * k * n) / N;
            re += x[n] * cos(phi);
            im -= x[n] * sin(phi);
        }
        re = re / N;
        im = im / N;

        let freq = k;
        let amp = sqrt(re * re + im * im);
        let phase = atan2(im, re);
        X[k] = { re, im, freq, amp, phase };
    }
    return X;
}

// Sets The Current Path to Custom Upload Path.
function setFTPath() {
    let input = $("#ft-file-upload")[0];
    let file = input.files[0];
    let fr = new FileReader();

    if (!file) {
        alert("Please select a file before clicking 'Set Path'.");
    } else if (file.type != "application/json") {
        alert("Please select a JSON file.");
    } else {
        fr.onload = receivedData;
        fr.readAsText(file);
    }

    function receivedData() {
        let drawing = JSON.parse(fr.result);
        ftSketch.fourierX = dft(drawing);
        ftSketch.local_wave = [];
        ftSketch.local_t = 0;
        ftAmpSketch.loop();
        ftPhaseSketch.loop();
    }
}
// ========================================================================================

// ANCHOR: FT Amplitude Sketch. 
// ========================================================================================
let ftAmpSketch = new p5((p) => {
    p.setup = function() {
        width = 0.425 * windowWidth;
        let canvas = p.createCanvas(width, 250);
        canvas.parent("#ft-ampSketch");
        canvas.style("margin-bottom", "1rem");
    };
    p.draw = function() {
        p.background(0);
        p.translate(p.width / 2, p.height - 20);
        p.stroke(255);

        // Draw The Axis.
        p.push();
        p.strokeWeight(2);
        p.line(-p.width / 2, 0, p.width / 2, 0);
        p.line(0, 0, 0, -p.height + 30);
        p.line(-10, -p.height + 45, 0, -p.height + 30);
        p.line(+10, -p.height + 45, 0, -p.height + 30);
        p.pop();

        let amps = ftSketch.fourierX.map(elt => elt.amp);
        let minAmp = min(amps);
        let maxAmp = max(amps);

        // Draw The Amplitudes.
        p.push();
        p.strokeWeight(4);
        p.stroke("#FF41FF");
        for (let i = 1; i < amps.length / 2; i++) {
            let x = p.map(i, 1, amps.length, 0, p.width - 25);
            let y = p.map(amps[i], minAmp, maxAmp, 0, p.height - 100);
            p.line(x, 0, x, -y);
        }
        for (let i = amps.length / 2; i < amps.length; i++){
            let x = p.map(i, 1, amps.length, -p.width + 25,0);
            let y = p.map(amps[i], minAmp, maxAmp, 0, p.height - 100);
            p.line(x, 0, x, -y);
        }
        let initial = p.map(amps[0], minAmp, maxAmp, 0, p.height - 100);
        p.line(0, 0, 0, -initial);
        p.pop();

        p.noLoop();
    }
});
// ========================================================================================

// ANCHOR: FT Phase Sketch. 
// ========================================================================================
let ftPhaseSketch = new p5((p) => {
    p.setup = function() {
        width = 0.425 * windowWidth;
        let canvas = p.createCanvas(width, 250);
        canvas.parent("#ft-phaseSketch");
    };
    p.draw = function() {
        p.background(0);
        p.translate(p.width / 2, p.height / 2);
        p.stroke(255);

        // Draw The Axis.
        p.push();
        p.strokeWeight(2);
        p.line(-(p.width / 2), 0, (p.width / 2), 0);
        p.line(0, (p.height / 2), 0, -(p.height / 2));
        p.line(p.width - 35, -10, p.width - 25, 0);
        p.line(p.width - 35, +10, p.width - 25, 0);
        p.pop();

        // Draw The Scale.
        p.push();
        p.line(0, -(p.height / 8), 5, -(p.height / 8));
        p.line(0, -(p.height / 4), 5, -(p.height / 4));
        p.line(0, -(3 * p.height / 8), 5, -(3 * p.height / 8));

        p.line(0, (p.height / 8), 5, (p.height / 8));
        p.line(0, (p.height / 4), 5, (p.height / 4));
        p.line(0, (3 * p.height / 8), 5, (3 * p.height / 8));
        p.pop();

        let phases = ftSketch.fourierX.map(elt => elt.phase);

        p.push();
        p.strokeWeight(4);
        p.stroke(colors.blue);
        for (let i = 0; i < phases.length / 2; i++) {
            let x = p.map(i, 0, phases.length, 0, p.width - 25);
            let y = p.map(phases[i], 0, p.TWO_PI, 0, -(p.height / 2));
            p.line(x, 0, x, y);
        }
        for (let i = phases.length / 2; i < phases.length; i++) {
            let x = p.map(i, 0, phases.length, -p.width + 25, 0);
            let y = p.map(phases[i], 0, p.TWO_PI, 0, -(p.height / 2));
            p.line(x, 0, x, y);
        }
        p.pop();

        p.noLoop();
    }
});
// ========================================================================================