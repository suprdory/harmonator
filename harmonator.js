Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
}
let log = console.log;
class Oscillator {
    constructor(a, f, p, d) {
        this.a = a; // amplitude
        this.f = f; // frequency (integer)
        this.df = 0; // frequency (delta)
        this.p = p; // phase
        this.d = d; // decay rate
        this.autop = false; // auto phase
        this.z = 0 // dc offset
    }
    val(t) {
        return baseAmp * this.a * Math.sin((this.f + this.df) * t + this.p * 6.28318530718) * Math.exp(-this.d * t);
    }
    valNoBaseAmp(t) {
        return this.z + this.a * Math.sin((this.f + this.df) * t + this.p * 6.28318530718) * Math.exp(-this.d * t);
    }
    phaseBound() {
        if (this.p > 1) {
            this.p = this.p - 1;
        }
        else if (this.p < 0) {
            this.p = this.p + 1
        }
    }
    zBound() {
        if (this.z > 360) {
            this.z = this.z - 360;
        }
        else if (this.z < 0) {
            this.z = this.z + 360
        }
    }
    update() {
        if (this.autop) {
            this.p = this.p + 0.001;
        }
    }
    toggleAuto() {
        this.autop = !this.autop;
    }
    toSSobj() {
        let ss = {};
        ss.a = this.a;
        ss.p = this.p;
        ss.f = this.f;
        ss.df = this.df;
        ss.d = this.d;
        ss.z = this.z;
        ss.autop = this.autop;
        return ss;
    }
    fromSSobj(ss) {
        // log(ss)

        this.a = ss.a;
        this.p = ss.p;
        this.f = ss.f;
        this.df = ss.df;
        this.d = ss.d;
        this.z = ss.z;
        this.autop = ss.autop;
    }
}
class Point {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        this.hue = hue;
    }
}
class Panel {
    constructor(x, py, w, ph, txt) {
        this.active = true;
        this.color = hg.color;
        this.x = x + uiBorder;
        this.y = py + uiBorder;
        this.w = w - 2 * uiBorder;
        this.h = ph - 2 * uiBorder;
        this.py = this.y;
        this.ph = this.h;
        this.anyClickActivates = false;
        this.overlay = false;
        this.buttonArray = [];
        this.wait = false;
        this.titH = txtSize / 2;
        this.txt = txt;
        if (txt) {
            this.y = this.py + this.titH;
            this.h = this.ph - this.titH;
        }

    }
    draw() {
        if (this.active) {
            if (this.overlay) {
                // darken background
                ctx.fillStyle = bgFillStyleAlpha;
                ctx.fillRect(0, 0, X, Y);
                ctx.fillStyle = bgFillStyle;
                ctx.fillRect(this.x, this.py, this.w, this.ph)
            }
            // transparent panel background
            ctx.fillStyle = bgFillStyleAlpha;
            ctx.fillRect(this.x, this.py, this.w, this.ph);

            // draw title
            if (this.txt) {
                ctx.beginPath();
                ctx.strokeStyle = this.color;
                ctx.lineWidth = baseLW * 2.0;
                ctx.rect(this.x, this.py, this.w, this.titH)
                ctx.stroke();
                ctx.fillStyle = uiTextColor;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.font = txtSize / 4 + 'px sans-serif';
                // console.log(this.txt, this.x + this.w / 2, this.py + this.titH / 2)
                ctx.fillText(this.txt, this.x + this.w / 2, this.py + this.titH / 2);
            }
            //main border
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = baseLW * 2;
            ctx.rect(this.x, this.py, this.w, this.ph)
            ctx.stroke();
            ctx.lineWidth = baseLW * 1;

            if (!this.wait) {
                this.buttonArray.forEach(button => button.draw());
            }
            else {
                ctx.fillStyle = uiTextColor;
                ctx.fillText('Please wait...', this.x + this.w / 2, this.y + this.h / 2);
            }
        }
    }
    pointerDoubleClick(x, y) {
        if (this.active) {
            this.buttonArray.forEach(button => button.pointerDoubleClick(x, y))
        }
    }
    pointerDown(x, y) {
        if (this.active) {
            this.buttonArray.forEach(button => button.pointerDown(x, y))
        }
        if (this.active & x > this.x & x < this.x + this.w & y > this.py & y < this.py + this.ph) {
            // console.log("pointer down in panel")
            return true;
        }
        else {
            // console.log("pointer down not in panel")
            return false;
        }
    }

    pointerUp(x, y) {
        if (this.active) {
            this.buttonArray.forEach(button => button.pointerUp(x, y))


        }
    }
    pointerMove(x, y) {
        if (this.active) {
            this.buttonArray.forEach(button => button.pointerMove(x, y))
        }
    }

}
function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}
function addPointerListeners() {
    window.addEventListener("resize", () => {
        setSize()
        if (!hg.auto) { requestAnimationFrame(anim); }
    }
    );
    if (isTouchDevice()) {
        canvas.addEventListener("touchstart", e => {
            e.preventDefault();
            // This event is cached to support 2-finger gestures
            // console.log("pointerDown", e);
            pointerDownHandler(e.touches[0].clientX, e.touches[0].clientY, e.touches.length);

        },
            { passive: false }
        );
        canvas.addEventListener("touchmove", e => {
            e.preventDefault();
            if (e.touches.length == 1) {
                pointerMoveHandler(e.touches[0].clientX, e.touches[0].clientY)
            }
            // If two pointers are down, check for pinch gestures
            if (e.touches.length == 2) {
                curDiff = Math.abs(e.touches[0].clientX - e.touches[1].clientX) +
                    Math.abs(e.touches[0].clientY - e.touches[1].clientY);
                if (prevDiff > 0) {
                    dDiff = curDiff - prevDiff;
                    zoomHandler(
                        0.0025 * dDiff,
                        (e.touches[0].clientX + e.touches[1].clientX) / 2,
                        (e.touches[0].clientY + e.touches[1].clientY) / 2)
                }
                prevDiff = curDiff;
                if (!hg.auto) { requestAnimationFrame(anim); }
            }

        },
            { passive: false }
        );
        canvas.addEventListener("touchend", e => {
            e.preventDefault();
            prevDiff = -1;
            pointerUpHandler(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
        },
            { passive: false }
        );
    }
    else {
        addEventListener("mousedown", e => {
            // e.preventDefault();
            // pointerDownHandler(e.offsetX, e.offsetY);
            pointerDownHandler(e.clientX, e.clientY)
            mouseDown = true
        },
            // { passive: false }
        );
        addEventListener('mousemove', e => {
            if (mouseDown) {
                pointerMoveHandler(e.clientX, e.clientY)
            }
        });
        addEventListener('mouseup', e => {
            mouseDown = false
            pointerUpHandler(e.clientX, e.clientY);

        });
        addEventListener('wheel', e => {
            // console.log(e)
            pointerWheelHandler(-0.0005 * e.deltaY, e.clientX, e.clientY);

        })
    }
}
function pointerWheelHandler(dW, xc, yc) {
    if (!showDocs & !showgalleryForm) {
        zoomHandler(dW, xc, yc);
        if (!hg.auto) { requestAnimationFrame(anim); }
    }
}
function pointerDownHandler(xc, yc, n = 1) {
    x = xc * pixRat;
    y = yc * pixRat;

    if (!showgalleryForm & !showDocs) {
        let now = new Date().getTime();
        let timeSince = now - lastTouch;
        if (timeSince < 300 & n < 2) {
            //double touch
            doubleClickHandler(x, y);
        }
        else {
            panelArray.forEach(panel => panel.pointerDown(x, y))
        }
        lastTouch = now;
    }

    xt = (x - xOff) / (scl)
    yt = (y - yOff) / (scl)


    if (
        // !isLandscape & topPanel.active & (y < (Y - uiY) & y > uiY) ||
        // isLandscape & topPanel.active & (x > uiX) ||
        // !topPanel.active
        !isLandscape & topPanel.active & (y < (Y - uiY) & y > uiY) ||
        !topPanel.active || isLandscape & x > uiX
    ) {
        mselect = "pan";
        y0 = y;
        x0 = x;
        xOff0 = xOff;
        yOff0 = yOff;
    }
    else {
        mselect = null;
    }
    if (!hg.auto) { requestAnimationFrame(anim); }
}
function pointerMoveHandler(xc, yc) {
    x = xc * pixRat;
    y = yc * pixRat;
    xt = (x - xOff) / scl
    yt = (y - yOff) / scl

    panelArray.forEach(panel => panel.pointerMove(x, y));

    if (mselect == "pan") {
        xOff = xOff0 + (x - x0);
        yOff = yOff0 + (y - y0);
    }
    if (!hg.auto) { requestAnimationFrame(anim); }

}
function pointerUpHandler(xc, yc) {
    x = xc * pixRat;
    y = yc * pixRat;

    showWheelsOverride = false;
    // pair.fixed.color = wheelColor;
    // pair.moving.color = wheelColor;
    mselect = null;

    panelArray.forEach(panel => panel.pointerUp(x, y))
    if (!hg.auto) { requestAnimationFrame(anim); }

    // console.log("pointer up in active panel, saving state to local storage")
    let stateJSON = state2json()
    localStorage.setItem("so", stateJSON)
    
    // if (urlArgMode) {
    //     log('updating url')
    //     const url = new URL(location);
    //     url.searchParams.set("so", stateJSON);
    //     history.pushState({}, "", url);
    // }
    const url = new URL(location);
    url.searchParams.delete('skey')
    history.pushState({}, "",url);


}
function doubleClickHandler(x, y) {
    panelArray.forEach(panel => panel.pointerDoubleClick(x, y))
    topPanel.active = true;
    timePanel.active = true;
    oscXpanel.active = true;
    oscYpanel.active = true;
    oscRpanel.active = true;
    colPanel.active = true;
    oscLpanel.active = true;

}
function zoomHandler(dW, xc, yc) {

    y = yc * pixRat;
    x = xc * pixRat;
    xt = (x - xOff) / scl
    yt = (y - yOff) / scl

    scl = Math.min(10, Math.max(scl * (1 + dW), 0.05));
    xOff = x - xt * scl
    yOff = y - yt * scl


}
function calcLCM(a, b) { //lowest common multiple
    let min = (a > b) ? a : b;
    while (min < 1000000) {
        if (min % a == 0 && min % b == 0) {
            return (min);
        }
        min++;
    }
}
function drawSquareFullImage(n = 1920) {
    // pair.penUp();
    let baseLWtemp = baseLW;
    baseLW = galleryLW * baseLW;
    let tracesBounds = hg.getBounds();
    let size = (shareBorderfrac + 1) * Math.max(
        tracesBounds.xmax - tracesBounds.xmin,
        tracesBounds.ymax - tracesBounds.ymin
    )
    let imscl = n / size;
    let xoff = imscl * (-tracesBounds.xmin + (size - (tracesBounds.xmax - tracesBounds.xmin)) / 2);
    let yoff = imscl * (- tracesBounds.ymin + (size - (tracesBounds.ymax - tracesBounds.ymin)) / 2);

    // console.log(size, xoff, yoff, imscl);
    var canvasSh = document.createElement('canvas');
    canvasSh.width = n;
    canvasSh.height = n;
    var ctxSh = canvasSh.getContext('2d');
    ctxSh.fillStyle = bgFillStyle;
    // canvasSh.style.backgroundColor=bgFillStyle
    // canvasSh.style.backgroundColor = bgFillStyle
    ctxSh.fillRect(0, 0, canvasSh.width, canvasSh.height);
    ctxSh.setTransform(imscl, 0, 0, imscl, xoff, yoff);
    // ctxSh.lineCap="round";
    hg.highQuality = true;
    hg.draw(ctxSh);
    hg.highQuality = false;
    baseLW = baseLWtemp;
    return (canvasSh)
}
function shareImage() {
    if (hg.points.length > 1) {
        sharePanel.wait = true;
        canvasSq = drawSquareFullImage(shareRes);
        canvasSq.toBlob(function (blob) {
            const filesArray = [
                new File(
                    [blob],
                    "canvas.png",
                    {
                        type: "image/png",
                        lastModified: new Date().getTime()
                    }
                )
            ];
            const shareData = {
                files: filesArray,
            };
            navigator.share(shareData)
            sharePanel.wait = false;
            if (!hg.auto) { requestAnimationFrame(anim); }
        })
    }
}
function downloadImage() {
    if (hg.points.length > 0) {
        let date = new Date().toJSON();
        // console.log(date); // 2022-06-17T11:06:50.369Z
        sharePanel.wait = true;
        canvasSq = drawSquareFullImage(shareRes);
        canvasSq.toBlob(function (blob) {
            const filesArray = [
                new File(
                    [blob],
                    "harmonator-" + date + ".png",
                    {
                        type: "image/png",
                        lastModified: new Date().getTime()
                    }
                )
            ];
            const shareData = {
                files: filesArray,
            };

            downloadFile(shareData['files'][0]);
            sharePanel.wait = false;
            anim()
        })
    }
}
function downloadFile(file) {
    // Create a link and set the URL using `createObjectURL`
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = URL.createObjectURL(file);
    link.download = file.name;

    // It needs to be added to the DOM so it can be clicked
    document.body.appendChild(link);
    link.click();

    // To make this work on Firefox we need to wait
    // a little while before removing it.
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
        link.parentNode.removeChild(link);
    }, 0);
}
function uploadImage(name, comment) {
    if (hg.points.length > 0) {
        console.log('wait')
        sharePanel.wait = true;
        if (!hg.auto) { requestAnimationFrame(anim); }
        canvasSq = drawSquareFullImage(galleryRes);
        canvasSq.toBlob(function (blob) {
            imgFile = new File(
                [blob],
                "canvas.png",
                {
                    type: "image/png",
                    lastModified: new Date().getTime()
                }
            )
            let formData = new FormData();
            formData.append('name', name);
            formData.append('comment', comment);
            formData.append('file', imgFile, "upload.png");
            console.log(formData)

            fetch(galleryAPIurl + '/upload_image', {
                method: 'POST',
                // WARNING!!!! DO NOT set Content Type!
                // headers: { 'Content-Type': 'multipart/form-data' },
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    console.log('unwait')
                    sharePanel.wait = false;
                    if (!hg.auto) { requestAnimationFrame(anim); }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    sharePanel.wait = false;
                    if (!hg.auto) { requestAnimationFrame(anim); }
                });
        })
    }
}
function createSharePanel() {
    let xsize = 200 * pixRat;
    let ysize = 400 * pixRat;
    let panel = new Panel((X - xsize) / 2, (Y - ysize) / 2, xsize, ysize);
    panel.overlay = true;
    panel.wait = false;
    panel.active = false;
    panel.buttonArray.push(
        new PButton(panel, 0.0, 0, 1, 0.083, ["Close"],
            function () { panel.active = false; })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.1, 0.1666, .8, 0.083, ["Share URL"],
            function () { shareURL(); })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.1, .3333, .8, 0.083, ["Share Image"],
            function () { shareImage(); })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.1, .5000, .8, 0.083, ["Download Image"],
            function () { downloadImage(); })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.1, .6666, .8, 0.083, ["Upload to Gallery"],
            function () { toggleGalleryForm() })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.1, .83333, .8, 0.083, ["View Gallery"],
            function () { window.location.href = 'gallery.html' })
    );

    return (panel);

}
function createTopPanel(oSx, oSy) {
    w = Math.min(1 * panelWidth, .5 * uiX * 1 / 5);
    let panel = new Panel(oSx, oSy, w, uiY);
    panel.anyClickActivates = true;
    panel.buttonArray.push(
        new PButton(panel, 0.0, 0.0, 1, 0.25, "?",
            function () { toggleDocs(); })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.0, 0.25, 1, 0.25, "share",
            function () { sharePanel.active = true; })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.0, 0.50, 1, 0.25, "hide",
            function () {
                showWheels = false;
                panelArray.forEach(panel => panel.active = false)
            })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.0, 0.75, 1, 0.25, "random",
            function () { randomize(); })
    );

    return (panel)

}
function submitToGallery() {
    let name = document.getElementById('name').value;
    localStorage.setItem('name', name);
    let comment = document.getElementById('comment').value;
    console.log("Subbed", name, comment);
    toggleGalleryForm();
    uploadImage(name, comment);
}
function toggleGalleryForm() {
    form = document.getElementById("galleryForm").style;
    // console.log(form.visibility)
    if (!(form.visibility == "visible")) {
        form.visibility = "visible"
        showgalleryForm = true;
    }
    else {
        form.visibility = "hidden"
        showgalleryForm = false;
    }
}
function setGallerySubmitHTML() {
    document.querySelector(':root').style.setProperty('--bgColor', bgFillStyle)
    document.querySelector(':root').style.setProperty('--fgColor', hg.color)
    document.querySelector(':root').style.setProperty('--textSize', 12 + 'pt')
    document.getElementById("submit").addEventListener("click", submitToGallery, { passive: true })
    document.getElementById("close").addEventListener("click", toggleGalleryForm, { passive: true })
    document.getElementById('name').value = localStorage.getItem('name');
    document.getElementById("closeDocs").addEventListener("click", toggleDocs, { passive: true })
}
function wakeGalleryServer() {
    fetch(galleryAPIurl)
        .then(response => response.text())
    // .then(data => console.log(data));

}
function drawArrow(ctx, fromx, fromy, tox, toy, arrowWidth, color) {
    //variables to be used when creating the arrow
    var headlen = 10 * pixRat;
    var angle = Math.atan2(toy - fromy, tox - fromx);

    // ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;


    //starting path of the arrow from the start square to the end square
    //and drawing the stroke
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineWidth = arrowWidth;
    ctx.stroke();

    //starting a new path from the head of the arrow to one of the sides of
    //the point
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7),
        toy - headlen * Math.sin(angle - Math.PI / 7));

    //path from the side point of the arrow, to the other side point
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 7),
        toy - headlen * Math.sin(angle + Math.PI / 7));

    //path from the side point back to the tip of the arrow, and then
    //again to the opposite side point
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7),
        toy - headlen * Math.sin(angle - Math.PI / 7));

    //draws the paths created above
    ctx.fill();
    // ctx.restore();
}
function linkOscCirc(oscA, oscB) {
    oscB.a = oscA.a;
    oscB.f = oscA.f;
    oscB.p = oscA.p + 0.25;
    oscB.d = oscA.d;
}
function linkOscAmp(oscA, oscB) {
    oscB.a = oscA.a;
}
function linkOscDec(oscA, oscB) {
    oscB.d = oscA.d;
}
class Harmonograph {
    constructor(oscX, oscY, oscXrot, oscYrot, oscHue) {
        this.hue = hueInit;
        this.saturation = 100;
        this.lightness = 65;
        this.locked = true;
        this.color = 0;
        this.setColor();
        this.highQuality = false;

        this.oscX = oscX;
        this.oscY = oscY;
        this.oscXrot = oscXrot;
        this.oscYrot = oscYrot;
        this.oscHue = oscHue;

        this.t0 = 0.0;
        this.t1 = 100;
        this.dt = 0.05;

        this.auto = false;

        this.softStart = 10;
        // this.softStart = 0;

        this.points = [];
        this.calc();
    }

    getBounds() {
        let xmin = 0;
        let xmax = 0;
        let ymin = 0;
        let ymax = 0;
        this.points.forEach(point => {
            xmin = Math.min(xmin, point.x);
            xmax = Math.max(xmax, point.x);
            ymin = Math.min(ymin, point.y);
            ymax = Math.max(ymax, point.y);
        })
        return ({
            xmin: xmin,
            xmax: xmax,
            ymin: ymin,
            ymax: ymax,
        })
    }

    checkAuto() {
        if (!(oscX.autop || oscY.autop || oscXrot.autop || oscYrot.autop || this.oscHue.autop)) {
            this.auto = false;
        }
        else if (!this.auto) {
            this.auto = true;
            // anim();
        }
    }

    update() {
        if (this.autoPhase) {
            this.oscX.p = this.oscX.p + 0.002
        }
        if (this.autoPhaseRot) {
            this.oscXrot.p = this.oscXrot.p + 0.002
        }
    }

    setColor() {
        this.color = "hsl(" + this.hue + "," + this.saturation + "%," + this.lightness + "%)"
    }
    eq(a, f, p, d, a1, f1, p1, d1, t) {
        return a * Math.sin(f * t + p * 6.28318530718) * Math.exp(-d * t) +
            a1 * Math.sin(f1 * t + p1 * 6.28318530718) * Math.exp(-d1 * t);
    }

    calc() {
        this.checkAuto()
        this.oscX.update();
        this.oscY.update();
        this.oscXrot.update();
        this.oscYrot.update();
        this.oscHue.update();

        this.oscX.phaseBound();
        this.oscY.phaseBound();
        this.oscXrot.phaseBound();
        this.oscYrot.phaseBound();
        this.oscHue.phaseBound();
        this.oscHue.zBound();

        this.points = [];
        for (let t = this.t0; t < this.t1; t += this.dt) {
            this.points.push(new Point(
                this.oscX.val(t) + this.oscXrot.val(t),
                this.oscY.val(t) + this.oscYrot.val(t),
                this.hue + oscHue.valNoBaseAmp(t)))
        }
    }
    draw(ctx) {
        var x0 = this.points[0].x;
        let y0 = this.points[0].y;
        let alpha = 1;
        if (this.points.length > 1) {
            ctx.lineWidth = baseLW * 1;
            ctx.lineCap = 'butt';
            ctx.beginPath()
            ctx.moveTo(x0, y0);
            let n = 0;
            if (this.softStart) {
                alpha = 0;
                this.points.slice(0, this.softStart).forEach(point => {
                    n++;
                    alpha = (n / this.softStart) ** 2;
                    ctx.strokeStyle = "hsla(" + point.hue + "," + this.saturation + "%," + this.lightness + "%," + alpha + ")"
                    ctx.lineTo(point.x, point.y);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                    x0 = point.x;
                    y0 = point.y;
                });
                if (this.highQuality) {
                    ctx.lineCap = 'round';
                }
                ctx.strokeStyle = this.color;
                this.points.slice(this.softStart - 1, -this.softStart).forEach(point => {
                    ctx.beginPath()
                    ctx.moveTo(x0, y0)
                    ctx.strokeStyle = "hsla(" + point.hue + "," + this.saturation + "%," + this.lightness + "%," + alpha + ")"
                    ctx.lineTo(point.x, point.y);
                    x0 = point.x;
                    y0 = point.y;
                    ctx.stroke();
                })
                ctx.lineCap = 'butt';
                n = this.softStart;
                ctx.beginPath();
                ctx.moveTo(this.points.slice(-this.softStart - 1)[0].x, this.points.slice(-this.softStart - 1)[0].y);
                this.points.slice(-this.softStart).forEach(point => {
                    n--;
                    // console.log(n)
                    alpha = (n / this.softStart) ** 2;
                    ctx.lineTo(point.x, point.y);

                    ctx.stroke();
                    ctx.beginPath();
                    ctx.strokeStyle = "hsla(" + point.hue + "," + this.saturation + "%," + this.lightness + "%," + alpha + ")"
                    ctx.moveTo(point.x, point.y);
                })

            }
            else {
                this.points.forEach(point => {
                    ctx.beginPath()
                    ctx.moveTo(x0, y0)
                    ctx.strokeStyle = "hsla(" + point.hue + "," + this.saturation + "%," + this.lightness + "%," + alpha + ")"
                    ctx.lineTo(point.x, point.y);
                    x0 = point.x;
                    y0 = point.y;
                    ctx.stroke();
                })

            }

        }
    }


}
class PButton {
    constructor(panel, x, y, w, h, txt, fun, argObj, getXdragVar,
        getYdragVar, isDepressedFun, toggleValFun, showReset, resetFun, autoStateFun, autoTogFun, precision = 2) {
        this.x = panel.x + x * panel.w;
        this.y = panel.y + y * panel.h;
        // this.yb=y;
        this.w = w * panel.w;
        this.h = h * panel.h;
        this.hb = this.h;
        this.txt = txt;
        this.fun = fun; // click function
        this.argObj = argObj; // arg object to pas to fun upon click
        this.depressed = false; //
        this.xDrag = false;
        this.yDrag = false;
        if (getYdragVar) {
            this.yDrag = true;
        }
        this.toggleValFun = toggleValFun;
        this.toggle = false;
        if (toggleValFun) {
            this.toggle = true;
        }

        this.y0;
        this.x0;
        this.xVar0;
        this.yVar0;
        this.getYdragVar = getYdragVar;
        this.getXdragVar = getXdragVar;
        this.isDepressedFun = isDepressedFun; //pass true to this fun while depressed
        this.UDarrows = false;
        this.LRarrows = false;

        this.LRarrLen = this.w / 6;
        this.isReset = showReset;
        this.resetFun = resetFun;
        this.buttons = [];
        this.autoStateFun = autoStateFun;
        this.autoTogFun = autoTogFun;
        this.precision = precision;


        // if (showReset) {
        //     let button = new PButton(this, 0, 0.6, 1, 0.2, 'reset', resetFun, null, null, null, null, null, 0)
        //     this.buttons.push(button);
        // }
        if (this.autoStateFun) {
            let button = new PButton(this, 0, 0.6, 1, 0.2, 'auto', this.autoTogFun, null, null, null, null, this.autoStateFun, 0, null)
            this.buttons.push(button);
        }
        this.hb = this.hb - (this.buttons.length + this.yDrag) * 0.2 * this.h;
        this.UDarrLen = this.hb / 6;
    }
    draw() {
        ctx.strokeStyle = hg.color;
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.w, this.h);
        ctx.stroke();

        if (this.depressed) {
            ctx.fillStyle = hg.color;
            ctx.fillRect(this.x, this.y, this.w, this.hb)
        }
        if (this.toggle) {
            // console.log(this.toggleValFun)
            if (this.toggleValFun()) {
                ctx.fillStyle = fgFillStyleAlpha;
                ctx.fillRect(this.x, this.y, this.w, this.hb)
            }
        }
        if (this.UDarrows) {
            drawArrow(ctx,
                this.x + this.w / 2, this.y + this.hb / 2 + txtSize / 4,
                this.x + this.w / 2, this.y + this.hb / 2 + txtSize / 4 + this.UDarrLen,
                baseLW, uiTextColor)
            drawArrow(ctx,
                this.x + this.w / 2, this.y + this.hb / 2 - txtSize / 4,
                this.x + this.w / 2, this.y + this.hb / 2 - txtSize / 4 - this.UDarrLen,
                baseLW, uiTextColor)
        }
        if (this.LRarrows) {
            drawArrow(ctx,
                this.x + this.w / 2 - txtSize / 2, this.y + this.hb / 2,
                this.x + this.w / 2 - txtSize / 2 - this.LRarrLen, this.y + this.hb / 2,
                baseLW, uiTextColor)
            drawArrow(ctx,
                this.x + this.w / 2 + txtSize / 2, this.y + this.hb / 2,
                this.x + this.w / 2 + txtSize / 2 + this.LRarrLen, this.y + this.hb / 2,
                baseLW, uiTextColor)
        }
        // console.log(this.buttons)
        this.buttons.forEach(button => button.draw())

        ctx.fillStyle = uiTextColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = txtSize / 4 + 'px sans-serif';
        ctx.lineWidth = baseLW;
        ctx.fillText(this.txt, this.x + this.w / 2, this.y + this.hb / 2, this.w * 0.85);
        if (this.yDrag) {
            ctx.beginPath()
            ctx.strokeStyle = hg.color;
            ctx.rect(this.x, this.y + 0.8 * this.h, this.w, this.h * 0.2)
            ctx.stroke()
            ctx.fillText(this.getYdragVar().toFixed(this.precision), this.x + this.w / 2, this.y + this.h * 0.9, this.w * 0.9);
        }

    }
    contains(x, y) {
        return (x > this.x & x < (this.x + this.w) &
            y > this.y & y < (this.y + this.hb));
    }
    action() {
        this.fun(this.argObj);
    }
    pointerDoubleClick(x, y) {
        if (this.contains(x, y)) {
            this.resetFun();
        }
    }
    pointerDown(x, y) {
        if (this.contains(x, y)) {
            this.depressed = true;
            this.x0 = x;
            this.y0 = y;
            if (this.yDrag) {
                this.yVar0 = this.getYdragVar();
                if (this.isDepressedFun) {
                    this.isDepressedFun(true);
                }
            }
            if (this.xDrag) {
                this.xVar0 = this.getXdragVar();
                this.isDepressedFun(true);
            }
        }
        this.buttons.forEach(button => button.pointerDown(x, y));
    }
    pointerUp(x, y) {
        if (!this.xDrag & !this.yDrag & this.depressed & this.contains(x, y)) {
            this.action();
        }
        this.depressed = false;
        if (this.isDepressedFun) {
            this.isDepressedFun(false);
        }
        this.buttons.forEach(button => button.pointerUp(x, y));
    }
    pointerMove(x, y) {
        if (!this.contains(x, y) & !this.yDrag & !this.xDrag) {
            this.depressed = false;
        }
        if (this.xDrag & this.yDrag & this.depressed) {
            this.fun(y - this.y0, this.yVar0, x - this.x0, this.xVar0);
        }
        else if (this.yDrag & this.depressed) {
            this.fun(y - this.y0, this.yVar0);
        }
        else if (this.xDrag & this.depressed) {
            this.fun(x - this.x0, this.xVar0);
        }
    }
}
function createOscPanel(osc, oscTxt, xPos, yPos) {
    w = Math.min(X / 2, panelWidth * 5);
    h = uiY;
    let panel = new Panel(xPos, yPos, w, h, oscTxt);
    panel.anyClickActivates = true;

    let button = new PButton(panel, 0, 0, 0.20, 1, 'amp',
        function (dy, yDragVar0) {
            osc.a = (Math.min(5, Math.max((-0.005 / pixRat * dy) + yDragVar0, 0)))
        },
        null, null,
        function () {
            return osc.a;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null,
        showReset = true,
        resetFun = function () {
            osc.a = 1.0;
        }
    )

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    button = new PButton(panel, .2, 0, 0.20, 1, 'freq',
        function (dy, yDragVar0) {
            osc.f = Math.round(Math.min(10, Math.max((-0.05 / pixRat * dy) + yDragVar0, -10)))
        },
        null, null,
        function () {
            return osc.f;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null, showReset = true,
        resetFun = function () {
            osc.f = 1.0;
        },
        null, null, 0)

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    button = new PButton(panel, .4, 0, 0.20, 1, 'fine',
        function (dy, yDragVar0) {
            osc.df = Math.min(1, Math.max((-0.00005 / pixRat * dy) + yDragVar0, -1))
        },
        null, null,
        function () {
            return osc.df;
        },
        null, null,
        showReset = true,
        resetFun = function () {
            osc.df = 0.0;
        })

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    button = new PButton(panel, .6, 0, 0.2, 1, 'phase',
        function (dy, yDragVar0) {
            osc.p = (Math.min(10, Math.max((-0.002 / pixRat * dy) + yDragVar0, -10)))
        },
        null, null,
        function () {
            return osc.p;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null,
        showReset = true,
        resetFun = function () {
            osc.p = 0.0;
        },
        function () {
            return osc.autop;
        },
        function () {
            osc.toggleAuto();
        }
    )

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    button = new PButton(panel, .8, 0, 0.2, 1, 'decay',
        function (dy, yDragVar0) {
            osc.d = (Math.min(1, Math.max(((1 - 0.01 / pixRat * dy)) * yDragVar0, 0.0001)))
        },
        null, null,
        function () {
            return osc.d;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null, showReset = true,
        resetFun = function () {
            osc.d = 0.01;
        })

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    return panel;
}
function createLinkOscPanel(osc, oscTxt, xPos, yPos) {
    w = Math.min(X / 2, panelWidth * 2);
    h = uiY;
    let panel = new Panel(xPos, yPos, w, h, oscTxt);
    panel.anyClickActivates = true;

    let button = new PButton(panel, 0, 0, 0.5, 1, 'amp',
        function (dy, yDragVar0) {
            osc.a = (Math.min(5, Math.max((-0.005 / pixRat * dy) + yDragVar0, 0)))
        },
        null, null,
        function () {
            return osc.a;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null,
        reset = true,
        resetFun = function (a) {
            osc.a = 1.0;
        },
    )

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    button = new PButton(panel, .5, 0, 0.5, 1, 'decay',
        function (dy, yDragVar0) {
            osc.d = (Math.min(1, Math.max(((1 - 0.01 / pixRat * dy)) * yDragVar0, 0.0001)))
        },
        null, null,
        function () {
            return osc.d;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null,
        reset = true,
        resetFun = function (a) {
            osc.d = 0.01;
        },
    )

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    return panel;
}
function createRedOscPanel(osc, oscTxt, xPos, yPos) {
    w = Math.min(X / 2, panelWidth * 3);
    h = uiY;
    let panel = new Panel(xPos, yPos, w, h, oscTxt);
    panel.anyClickActivates = true;

    button = new PButton(panel, .0, 0, 0.333, 1, 'freq',
        function (dy, yDragVar0) {
            osc.f = Math.round(Math.min(10, Math.max((-0.05 / pixRat * dy) + yDragVar0, -10)))
        },
        null, null,
        function () {
            return osc.f;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        },
        null,
        reset = true,
        resetFun = function (a) {
            osc.f = 1;
        },
        null, null, 0)

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    button = new PButton(panel, .333, 0, 0.333, 1, 'fine',
        function (dy, yDragVar0) {
            osc.df = Math.min(1, Math.max((-0.00005 / pixRat * dy) + yDragVar0, -1))
        },
        null, null,
        function () {
            return osc.df;
        },
        null, null,
        reset = true,
        resetFun = function (a) {
            osc.df = 0.0;
        },
    )

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    button = new PButton(panel, .666, 0, 0.333, 1, 'phase',
        function (dy, yDragVar0) {
            osc.p = (Math.min(10, Math.max((-0.002 / pixRat * dy) + yDragVar0, -10)))
        },
        null, null,
        function () {
            return osc.p;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null,
        reset = true,
        resetFun = function (a) {
            osc.p = 0.0;
        },
        function () {
            return osc.autop;
        },
        function () {
            osc.toggleAuto();
        }
    )

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);


    return panel;
}
function createTimePanel(txt, xPos, yPos) {
    w = Math.min(X * 0.5 * 3 / 5, panelWidth * 3);
    let panel = new Panel(xPos, yPos, w, uiY, txt);
    panel.anyClickActivates = true;

    let button = new PButton(panel, 0.0, 0.0, 0.333, 1, "t" + String.fromCharCode("0".charCodeAt(0) + 8272),
        function (dy, yDragVar0) {
            hg.t0 = Math.min(10, Math.max((- 0.01 / pixRat * dy) + yDragVar0, -10))
        },
        null, null,
        function () {
            return hg.t0;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        },
        null,
        showReset = true,
        resetFun = function () {
            hg.t0 = 0;
        },
        null, null, 2
    )
    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button)

    button = new PButton(panel, 0.333, 0.0, 0.333, 1, "t",
        function (dy, yDragVar0) {
            hg.t1 = Math.min(1000, Math.max((1 - 0.01 / pixRat * dy) * yDragVar0, 1))

        }, null, null,
        function () {
            return hg.t1;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null, showReset = true,
        resetFun = function () {
            hg.t1 = 100;
        }, null, null, 0
    )
    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button)

    button = new PButton(panel, 0.666, 0.0, 0.333, 1, "dt",
        function (dy, yDragVar0) {
            // hg.dt = Math.min(1, Math.max((1 - 0.01 / pixRat * dy) * yDragVar0, 0.001))
            hg.dt = Math.min(3, Math.max(-0.001 / pixRat * dy + yDragVar0, 0.01))
        }, null, null,
        function () {
            return hg.dt;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null, showReset = true,
        resetFun = function () {
            hg.dt = 0.05;
        }, null, null, 2
    )
    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button)


    return panel
}
function createColPanel(osc, oscTxt, xPos, yPos) {
    w = Math.min(X / 2, panelWidth * 5);
    h = uiY;
    let panel = new Panel(xPos, yPos, w, h, oscTxt);
    panel.anyClickActivates = true;


    let button = new PButton(panel, .8, 0, 0.2, 1, 'off',
        function (dy, yDragVar0) {
            osc.z = (Math.min(3600, Math.max(((-1 / pixRat * dy)) + yDragVar0, -3600)))
        },
        null, null,
        function () {
            return osc.z;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null, showReset = true,
        resetFun = function () {
            osc.z = 0.00;
        }, null, null, 0)
    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    button = new PButton(panel, 0.0, 0, 0.20, 1, 'amp',
        function (dy, yDragVar0) {
            osc.a = (Math.min(360, Math.max((-0.5 / pixRat * dy) + yDragVar0, 0)))
        },
        null, null,
        function () {
            return osc.a;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null,
        showReset = true,
        resetFun = function () {
            osc.a = 20;
        }, null, null, 0
    )

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    button = new PButton(panel, .2, 0, 0.20, 1, 'freq',
        function (dy, yDragVar0) {
            osc.f = Math.round(Math.min(10, Math.max((-0.05 / pixRat * dy) + yDragVar0, -10)))
        },
        null, null,
        function () {
            return osc.f;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null, showReset = true,
        resetFun = function () {
            osc.f = 1.0;
        },
        null, null, 0)

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    button = new PButton(panel, .4, 0, 0.20, 1, 'fine',
        function (dy, yDragVar0) {
            osc.df = Math.min(1, Math.max((-0.0002 / pixRat * dy) + yDragVar0, -1))
        },
        null, null,
        function () {
            return osc.df;
        },
        null, null,
        showReset = true,
        resetFun = function () {
            osc.df = 0.0;
        })

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    button = new PButton(panel, .6, 0, 0.2, 1, 'phase',
        function (dy, yDragVar0) {
            osc.p = (Math.min(10, Math.max((-0.002 / pixRat * dy) + yDragVar0, -10)))
        },
        null, null,
        function () {
            return osc.p;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        }, null,
        showReset = true,
        resetFun = function () {
            osc.p = 0.0;
        },
        function () {
            return osc.autop;
        },
        function () {
            osc.toggleAuto();
        }
    )

    button.yDrag = true;
    button.UDarrows = true;
    panel.buttonArray.push(button);

    return panel;
}
function anim() {
    linkOscCirc(oscXrot, oscYrot);
    linkOscAmp(oscX, oscY);
    linkOscDec(oscX, oscY);

    // clear screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //scaled stuff
    ctx.setTransform(scl, 0, 0, scl, xOff, yOff)
    hg.calc();
    hg.draw(ctx);
    // console.log(baseAmp)

    // fixed stuff
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    panelArray.forEach(panel => panel.draw())

    if (showDocs) {
        // darken background
        ctx.fillStyle = bgFillStyleAlpha;
        ctx.fillRect(0, 0, X, Y);
    }

    if (hg.auto) { requestAnimationFrame(anim); }
    // console.log("anim")
}
function setSize() {
    // console.log("Setting Size")
    pixRat = window.devicePixelRatio * 1.0;
    console.log("pixRat:", pixRat)
    X = window.innerWidth * pixRat;
    Y = window.innerHeight * pixRat;
    canvas.height = window.innerHeight * pixRat;
    canvas.width = window.innerWidth * pixRat;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    txtSize = 60 * pixRat;
    baseLW = 1 * pixRat;
    // ui size
    uiY = 0.25 * Y;
    uiX = X;
    maxPanelWidth = 50 * pixRat;
    let xPanBuf = 0
    panelWidth = Math.min(X / nOscButtons, maxPanelWidth);
    console.log(window.innerHeight, window.innerWidth)
    if (window.innerHeight < 500 & window.innerWidth > 800) {
        panelWidth = Math.min(X / 11 / 2, maxPanelWidth);
        uiY = 0.5 * Y;
        oLx = panelWidth * 0;
        oLy = Y - uiY;
        oXx = panelWidth * 2;
        oXy = Y - uiY;
        oYx = panelWidth * 5;
        oYy = Y - uiY;
        oTx = panelWidth * 8;
        oTy = Y - uiY;
        oRx = panelWidth * 6;
        oRy = 0;
        oCx = panelWidth * 1;
        oCy = 0;
        oSx = panelWidth * 0;
        oSy = 0;
        // initial screen centre
        xOff = panelWidth * 11 + (X - panelWidth * 11) / 2;
        yOff = Y / 2;
        baseAmp = 0.4 * Math.min(X, Y)
        isLandscape = true;
        uiX = 11 * panelWidth;
    }
    else if (X > maxPanelWidth * nOscButtons) {
        if (panelWidth * nOscButtons < X) {
            xPanBuf = (X - panelWidth * nOscButtons) / 2;
        }
        oLx = xPanBuf + panelWidth * 1;
        oLy = Y - uiY;
        oXx = xPanBuf + panelWidth * 3;
        oXy = Y - uiY;
        oYx = xPanBuf + panelWidth * 6;
        oYy = Y - uiY;
        oRx = xPanBuf + panelWidth * 9;
        oRy = Y - uiY;
        oTx = xPanBuf + panelWidth * 19;
        oTy = Y - uiY;
        oCx = xPanBuf + panelWidth * 14;
        oCy = Y - uiY;
        oSx = xPanBuf + panelWidth * 0;
        oSy = Y - uiY;
        // initial screen centre
        xOff = X / 2;
        yOff = (Y - uiY) / 2;
        baseAmp = 0.25 * Math.min(X, Y)
        isLandscape = false;
    } else {
        panelWidth = Math.min(X / 11, maxPanelWidth);
        // console.log(X,panelWidth)
        if (panelWidth * 11 < X) {
            xPanBuf = (X - panelWidth * 11) / 2;
        }
        oLx = xPanBuf + panelWidth * 0;
        oLy = Y - uiY;
        oXx = xPanBuf + panelWidth * 2;
        oXy = Y - uiY
        oYx = xPanBuf + panelWidth * 5;
        oYy = Y - uiY
        oTx = xPanBuf + panelWidth * 8;
        oTy = Y - uiY
        oRx = xPanBuf + panelWidth * 1;
        oRy = 0
        oCx = xPanBuf + panelWidth * 6;
        oCy = 0;
        oSx = xPanBuf + panelWidth * 0;
        oSy = 0;
        // initial screen centre
        xOff = X / 2;
        yOff = Y / 2;
        baseAmp = 0.20 * Math.min(X, Y)
        isLandscape = false;
    }
    // anim();
    oscLpanel = createLinkOscPanel(oscX, 'lat', oLx, oLy)
    oscXpanel = createRedOscPanel(oscX, 'x', oXx, oXy)
    oscYpanel = createRedOscPanel(oscY, 'y', oYx, oYy)
    oscRpanel = createOscPanel(oscXrot, 'rotary', oRx, oRy)
    colPanel = createColPanel(oscHue, 'hue', oCx, oCy);
    timePanel = createTimePanel('time', oTx, oTy);
    topPanel = createTopPanel(oSx, oSy);
    sharePanel = createSharePanel();
    panelArray = [topPanel, colPanel, oscLpanel, oscXpanel, oscYpanel, oscRpanel, timePanel, sharePanel];
}
function toggleDocs() {
    docs = document.getElementById("docs").style;
    // console.log(form.visibility)
    if (!(docs.visibility == "visible")) {
        docs.visibility = "visible"
        showDocs = true;
    }
    else {
        docs.visibility = "hidden"
        showDocs = false;
        if (!hg.auto) {
            anim();
        }

    }


}
function randomize() {
    hueInit = Math.random() * 360
    bgFillStyle = "hsl(" + hueInit + ",100%,5%)";
    bgFillStyleAlpha = "hsla(" + hueInit + ",100%,5%,.80)";
    fgFillStyle = "hsl(" + hueInit + ",100%,5%)";
    fgFillStyleAlpha = "hsla(" + hueInit + ",100%,50%,.50)";

    let freqs = [-1, -1, -1, -1, -1, -2, -2, -2, -2, -3, -3, -3, -4, -4, -5, -6,
        0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5, 6,]
    let freqsno0 = [-1, -1, -1, -1, -1, -2, -2, -2, -2, -3, -3, -3, -4, -4, -5, -6,
        1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5, 6,]
    let freqHue = [0, 0, 1, 1, 1, 1, 2, 2, 3]

    let decays = [0.001, 0.002, 0.003, 0.005, 0.009, 0.0099, 0.01, 0.011, 0.012, 0.02, 0.03, 0.04, 0.1]
    let ts = [10, 50, 100, 100, 100, 150, 200, 400]
    let bools = [false, false, true]
    let phases = [0.0, 0.25, 0.5, 0.75, 1.0]
    let ampHues = [0, 20, 20, 20, 50, 50, 100]
    let fineHues = [0, 0.01, 0.01, 0.02]

    oscHue.a = ampHues.random();

    oscX.f = freqs.random();
    oscY.f = freqs.random();
    oscX.df = 0;
    oscY.df = 0;
    oscXrot.df = 0;
    oscXrot.f = freqsno0.random();
    oscHue.f = freqHue.random();
    oscHue.df = fineHues.random();

    oscX.d = decays.random();
    oscX.autop = bools.random();
    oscY.autop = bools.random();
    oscXrot.autop = bools.random();
    oscHue.autop = bools.random();
    oscX.p = phases.random();
    oscY.p = phases.random();
    oscXrot.p = phases.random();
    oscHue.p = phases.random();
    oscHue.z = 0;

    hg.t1 = ts.random();
    hg.dt = 0.05;
    hg.t0 = 0;


    canvas.style.backgroundColor = bgFillStyle
    hg.hue = hueInit
    hg.setColor();
    panelArray.forEach(panel => panel.color = hg.color)
    setGallerySubmitHTML();

    // //save state to local storage
    // let stateJSON = state2json()
    // localStorage.setItem("so", stateJSON)
    // //update url if in urlArg mode
    // if (urlArgMode){
    //     log('updating url')
    //     const url = new URL(location);
    //     url.searchParams.set("so", stateJSON);
    //     history.pushState({}, "", url);
    // }
}

//////////////////////// WARNING!! no "Z", "~", or "_" allowed in any state persistant variable names //////////////////
///////////////// as they are used as special charachters to encode JSON in url param string //////////
function state2json() {
    let so;
    so = {};

    so.oscX = oscX.toSSobj();
    so.oscY = oscY.toSSobj();
    so.oscXrot = oscXrot.toSSobj();
    so.oscHue = oscHue.toSSobj();
    so.env = {}
    so.env.bgFillStyle = bgFillStyle
    so.env.bgFillStyleAlpha = bgFillStyleAlpha
    so.env.fgFillStyle = fgFillStyle
    so.env.fgFillStyleAlpha = fgFillStyleAlpha
    so.hg = {}
    so.hg.hue = hg.hue;
    so.hg.t1 = hg.t1;
    so.hg.t0 = hg.t0;
    so.hg.dt = hg.dt;

    let stateString = JSON.stringify(so)
    // stateString = stateString.replace(/"/g, "~")
    // stateString = stateString.replace(/{/g, "_")
    // stateString = stateString.replace(/}/g, "Z")
    return stateString
}
function json2state(json) {
    // json = json.replace(/~/g, "\"")
    // json = json.replace(/Z/g, "}")
    // json = json.replace(/_/g, "{")
    let so = JSON.parse(json); //state object

    //set oscillator states
    oscX.fromSSobj(so.oscX);
    oscY.fromSSobj(so.oscY);
    oscXrot.fromSSobj(so.oscXrot);
    oscHue.fromSSobj(so.oscHue);

    // set environmental params
    bgFillStyle = so.env.bgFillStyle
    bgFillStyleAlpha = so.env.bgFillStyleAlpha
    fgFillStyle = so.env.fgFillStyle
    fgFillStyleAlpha = so.env.fgFillStyleAlpha

    // set hg params
    hg.hue = so.hg.hue
    hg.t0 = so.hg.t0
    hg.t1 = so.hg.t1
    hg.dt = so.hg.dt

    canvas.style.backgroundColor = bgFillStyle
    hg.setColor();
    panelArray.forEach(panel => panel.color = hg.color)
    setGallerySubmitHTML();
    return so;
}
function shareURL() {
    console.log('wait')
    sharePanel.wait = true;
    if (!hg.auto) { requestAnimationFrame(anim); }


    let url = window.location.href
    // url = url + '?so=' + state2json();
    // let shareData = { 'url': url }
    // log(shareData)
    // navigator.share(shareData)

    let formData = new FormData();
    formData.append('version', "v01");
    formData.append('state', state2json());
    fetch(galleryAPIurl + '/post_state', {
        method: 'POST',
        // WARNING!!!! DO NOT set Content Type!
        // headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            url = url + '?s=' + data.key;
            let shareData = { 'url': url }
            navigator.share(shareData)
            console.log('unwait')
            sharePanel.wait = false;
            if (!hg.auto) { requestAnimationFrame(anim); }
        })
        .catch((error) => {
            console.error('Error:', error);
            sharePanel.wait = false;
            if (!hg.auto) { requestAnimationFrame(anim); }
        })
}


const canvas = document.getElementById("cw");
const ctx = canvas.getContext("2d");
const PI2 = Math.PI * 2;
let txtSize, pixRat, baseLW, baseAmp, panelWidth, uiY, X, Y, isLandscape
let oLx, oLy, oXx, oXy, oYx, oYy, oRx, oRy, oTx, oTy, oCx, oCy;

let scl = 1.0; // zoom factor

// let clickCase = null;
let mouseDown = false; //required for detecting mouse drags
let lastTouch = new Date().getTime();
let showWheels = true;
let showWheelsOverride = false;
let showInfo = false;
let showRadInfo = false;
let showColInfo = false;
let showgalleryForm = false;
let showDocs = false;

const shareBorderfrac = 0.15;
let hueInit = Math.random() * 360
let bgFillStyle = "hsl(" + hueInit + ",100%,5%)";
let bgFillStyleAlpha = "hsla(" + hueInit + ",100%,5%,.80)";
let fgFillStyle = "hsl(" + hueInit + ",100%,5%)";
let fgFillStyleAlpha = "hsla(" + hueInit + ",100%,50%,.50)";
const transCol = "rgb(128,128,128,0.4)"
const uiTextColor = "white"
const uiBorder = 5;
canvas.style.backgroundColor = bgFillStyle

const galleryLW = 1;
const galleryRes = 1920;
const shareRes = 1920;

//vars for pinch zoom handling
var prevDiff = 0;
var curDiff = 0;
var dDiff = 0;

let nOscButtons = 22
let oscX = new Oscillator(1.0, 1, 0.0, 0.01);
let oscY = new Oscillator(1.0, 2, 0.0, 0.01);
oscXrot = new Oscillator(0.3, 1, 0, 0.001);
oscYrot = new Oscillator(0.0, 1, 0.25, 0.001);
oscHue = new Oscillator(20, 1, 0, 0);
oscArray = [oscX, oscY, oscXrot, oscYrot];
let hg = new Harmonograph(oscX, oscY, oscXrot, oscYrot, oscHue)
setSize();
wakeGalleryServer()
setGallerySubmitHTML();
addPointerListeners();

so = localStorage.getItem("so")
if (so) {
    // log("ls state exists:", so)
    json2state(so)
}
else {
    let stateJSON = state2json()
    localStorage.setItem("so", stateJSON)
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

// let urlArgMode = false;
// let urlso = urlParams.get('so')
// if (urlso) {
//     // log('url arg mode',urlso);
//     urlArgMode = true;
//     json2state(urlso)
//     showWheels = false;
//     panelArray.forEach(panel => panel.active = false)
// }
let urlskey = urlParams.get('s')
if (urlskey) {
    log("skey:", urlskey)
    console.log('wait')
    sharePanel.wait = true;
    if (!hg.auto) { requestAnimationFrame(anim); }

    log("get url:", galleryAPIurl + '/get_state?skey=' + urlskey)

    fetch(galleryAPIurl + '/get_state?skey=' + urlskey, {
        method: 'GET',
        // WARNING!!!! DO NOT set Content Type!
        // headers: { 'Content-Type': 'multipart/form-data' },

    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            json2state(JSON.stringify(data));
            showWheels = false;
            panelArray.forEach(panel => panel.active = false)
            console.log('unwait')
            sharePanel.wait = false;
            if (!hg.auto) { requestAnimationFrame(anim); }
        })
        .catch((error) => {
            console.error('Error:', error);
            sharePanel.wait = false;
            if (!hg.auto) { requestAnimationFrame(anim); }
        })
}
anim();
// log(state2json())