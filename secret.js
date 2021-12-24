const songs = ["solo", "multi", "voice"];

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

        songs.forEach(song => eval(`${song}Win.sound.pause()`));
        secret2.loop();
    } else {
        // Switches the highlighted part of the switch.
        toggleContainer.css("clipPath", "inset(0 50% 0 0)");
        toggleContainer.css("backgroundColor", "dodgerblue");

        $("#view-2").hide();
        $("#view-1").show();

        secret2.noLoop();
    }
});

function eventHandlers() {
    songs.forEach(song => {
        eval(`
        ${song}Win = $(".${song} iframe")[0].contentWindow;
        $(".${song} .play-sound").click(() => {
            if (${song}Win.sound.isPlaying()) {
                ${song}Win.sound.pause();
            } else {
                ${song}Win.sound.loop();
            }
        });
        `);
        eval(`$(".${song} .show-amps").click(() => ${song}Win.sketch.showAmp = !${song}Win.sketch.showAmp);`);
    });

    $("#play-once").click(() => {
        secret2.repeat = false;
        $("#play-once").attr("class", "button-primary");
        $("#play-forever").attr("class", "");
    });
    $("#play-forever").click(() => {
        secret2.repeat = true;
        secret2.loop();
        $("#play-once").attr("class", "");
        $("#play-forever").attr("class", "button-primary");
    });
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

    let local_speed;

    p.st = [];
    p.local_t = 0;
    p.fourierS = [];
    p.path = [];
    p.repeat = true;

    p.setup = function() {
        p.width = 0.9 * p.windowWidth;
        let cnv = p.createCanvas(p.width, 600);
        cnv.parent("#secret2");

        local_t = 0;
        local_A = 80;
        local_cx = 200;
        local_cy = p.height / 2;

        let drawWidth = drawingSize[0];
        let drawHeight = drawingSize[1];
        let drawScale = p.height / drawHeight;

        for (let i = 0; i < drawing.length; i += 3) {
            let x = -drawing[i].x + drawWidth / 2;
            let y = drawing[i].y - drawHeight / 2;
            p.st.unshift(new Complex(drawScale * x, drawScale * y));
        }
        let lastIndex = drawing.length - 1;
        let x = -drawing[lastIndex].x + drawWidth / 2;
        let y = drawing[lastIndex].y - drawHeight / 2;
        p.st.unshift(new Complex(drawScale * x, drawScale * y));

        p.fourierS = dft(p.st);

        p.fourierS.sort((a, b) => b.amp - a.amp);
        p.noLoop();
    };

    p.windowResized = function () {
        p.resizeCanvas(0.9 * p.windowWidth, 600);
    }

    p.draw = function() {
        p.background(218);
        p.stroke(155);

        let v = epicycles(p.width / 2, p.height / 2, -p.HALF_PI, p.fourierS);
        p.path.unshift(v);

        p.push();
        p.stroke(0);
        p.strokeWeight(2);
        p.noFill();
        p.beginShape();
        for (let i = 0; i < p.path.length; i++) {
            p.vertex(p.path[i].x, p.path[i].y);
        }
        p.endShape();
        p.pop();

        p.push();
        p.fill(0);
        p.noStroke();
        p.textSize(14);
        p.text("Logo Design By Danielle Salloum", p.width - 235, p.height - 5);
        p.pop();

        local_speed = p.TWO_PI / p.fourierS.length;
        p.local_t -= local_speed;
        if (p.local_t < -p.TWO_PI) {
            p.local_t = 0;
            p.path = [];
            if (!p.repeat)
                p.noLoop();
        }
    };
});