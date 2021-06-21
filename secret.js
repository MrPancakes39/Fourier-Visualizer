$("#switch-container").click(() => {
    let toggleContainer = $("#toggle-container");
    let toggleNumber = $(this).data("toggleNumber");

    toggleNumber = !toggleNumber;
    $(this).data("toggleNumber", toggleNumber);

    if (toggleNumber) {
        // Switches the highlighted part of the switch.
        toggleContainer.css("clipPath", "inset(0 0 0 50%)");
        toggleContainer.css("backgroundColor", "dodgerblue");

        $("#view-1").hide();
        $("#view-2").css("display", "flex");
    } else {
        // Switches the highlighted part of the switch.
        toggleContainer.css("clipPath", "inset(0 50% 0 0)");
        toggleContainer.css("backgroundColor", "dodgerblue");

        $("#view-2").hide();
        $("#view-1").show();
    }
});

let secret1 = new p5((p) => {
    p.preload = function() {
        sound = p.loadSound("test/MBB_Beach.mp3");
    }

    p.showAmp = false;

    p.setup = function() {
        p.width = 0.9 * p.windowWidth;
        let cnv = p.createCanvas(p.width, 400);
        cnv.parent("#secret1");
        fft = new p5.FFT();
        sound.amp(0.2);

        eventHandlers();
    }

    p.draw = function() {
        p.background(0);

        if (p.showAmp) {
            let spectrum = fft.analyze();
            p.noStroke();
            p.fill(255, 0, 255);
            for (let i = 0; i < spectrum.length; i++) {
                let x = p.map(i, 0, spectrum.length, 0, p.width);
                let h = -p.height + p.map(spectrum[i], 0, 255, p.height, 0);
                p.rect(x, p.height, p.width / spectrum.length, h)
            }
        }

        let waveform = fft.waveform();
        p.noFill();
        p.beginShape();
        p.stroke(255);
        for (let i = 0; i < waveform.length; i++) {
            let x = p.map(i, 0, waveform.length, 0, p.width);
            let y = p.map(waveform[i], -1, 1, 0, p.height);
            p.vertex(x, y);
        }
        p.endShape();
    }
});

function eventHandlers() {
    $("#play-sound").click(() => {
        if (sound.isPlaying()) {
            sound.pause();
        } else {
            sound.loop();
        }
    });

    $("#show-amps").click(() => secret1.showAmp = !secret1.showAmp);
}

class Complex {
    constructor(a, b) {
        this.re = a;
        this.im = b;
    }

    add(c) {
        return new Complex(this.re + c.re, this.im + c.im);
    }

    mult(c) {
        const re = this.re * c.re - this.im * c.im;
        const im = this.re * c.im + this.im * c.re;
        return new Complex(re, im);
    }
}

let secret2 = new p5((p) => {
    function dft(x) {
        const X = [];
        const N = x.length;
        for (let k = 0; k < N; k++) {
            let sum = new Complex(0, 0);
            for (let n = 0; n < N; n++) {
                const phi = (p.TWO_PI * k * n) / N;
                const c = new Complex(p.cos(phi), -p.sin(phi));
                sum = sum.add(x[n].mult(c));
            }
            sum.re = sum.re / N;
            sum.im = sum.im / N;

            let freq = k;
            let amp = p.sqrt(sum.re * sum.re + sum.im * sum.im);
            let phase = p.atan2(sum.im, sum.re);
            X[k] = { re: sum.re, im: sum.im, freq, amp, phase };
        }
        return X;
    }

    function epicycles(x, y, rot, fourier) {
        for (let k = 0; k < fourier.length; k++) {
            let prevx = x;
            let prevy = y;

            let { amp, freq, phase } = fourier[k];
            x += amp * p.sin(freq * p.local_t + phase + rot);
            y += amp * p.cos(freq * p.local_t + phase + rot);

            // draws the circles.
            p.push();
            p.noFill();
            p.strokeWeight(2);
            p.ellipseMode(p.RADIUS);
            p.circle(prevx, prevy, amp);
            p.pop();

            // draws the lines.
            p.push();
            p.strokeWeight(3);
            p.line(prevx, prevy, x, y);
            p.pop();
        }
        return { x, y };
    }

    let local_A, local_speed;
    let local_cx, local_cy;

    let st = [];
    p.local_t = 0;
    p.fourierS = [];
    p.path = [];

    p.setup = function() {
        p.width = 0.9 * p.windowWidth;
        let cnv = p.createCanvas(p.width, 600);
        cnv.parent("#secret2");

        local_t = 0;
        local_A = 80;
        local_cx = 200;
        local_cy = p.height / 2;

        let val = 0;
        for (let i = 0; val <= p.TWO_PI; i += 10) {
            st.push(new Complex(100 * p.cos(val), 100 * p.sin(val)));
            val += 0.08;
        }

        p.fourierS = dft(st);

        p.fourierS.sort((a, b) => b.amp - a.amp);

        $("#switch-container").click();
    };

    p.draw = function() {
        p.background(218);
        p.stroke(155);

        let v = epicycles(p.width / 2, p.height / 2, -p.HALF_PI, p.fourierS);
        p.path.unshift(v);

        p.stroke(0);
        // draws the wave.
        p.push();
        p.strokeWeight(2);
        p.noFill();
        p.beginShape();
        for (let i = 0; i < p.path.length; i++) {
            p.vertex(p.path[i].x, p.path[i].y);
        }
        p.endShape();
        p.pop();

        local_speed = p.TWO_PI / p.fourierS.length;
        p.local_t -= local_speed;
        if (p.local_t < -p.TWO_PI) {
            p.local_t = 0;
            p.path = [];
        }
    };
});