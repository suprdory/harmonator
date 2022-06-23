Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Pair {
    constructor(fixed, moving) {
        this.fixed = fixed;
        this.moving = moving;
        this.out = false;
        this.th = 0;
        this.auto = 0;
        this.hue = hueInit;
        this.saturation = 100;
        this.lightness = 65;
        this.locked = true;

        this.setColor();
        this.trace = new Trace(this);
        this.traces = [];
        this.tracing = true;
        this.move(this.th);
    }
    toggleLock() {
        this.locked = !this.locked
    }

    translate(x, y) {
        if (!this.locked) {
            // let auto=this.auto;
            this.auto = false;
            this.penUp()
            this.fixed.x = x;
            this.fixed.y = y;
            this.move(this.th)
            this.penDown()
            // this.auto=auto
        }
    }
    setColor() {
        this.color = "hsl(" + this.hue + "," + this.saturation + "%," + this.lightness + "%)"
    }
    drawRadInfo() {
        ctx.strokeStyle = this.fixed.color;
        ctx.fillStyle = this.fixed.color;
        ctx.textAlign = "center";
        ctx.font = txtSize + 'px sans-serif';
        ctx.textBaseline = "middle";
        ctx.fillText(Math.round(this.moving.rat * this.moving.teeth), X / 2, Y / 2);
        ctx.font = txtSize / 2 + 'px sans-serif';
        ctx.fillText('Draw Radius', X / 2, Y / 2 - txtSize);

    }
    drawColInfo() {
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.textAlign = "center";
        ctx.font = txtSize + 'px sans-serif';
        ctx.textBaseline = "middle";
        ctx.fillText(Math.round(this.hue), X / 2 - txtSize, Y / 2);
        ctx.fillText(Math.round(this.lightness - 50), X / 2 + txtSize, Y / 2);
        ctx.font = txtSize / 2 + 'px sans-serif';
        ctx.fillText('Hue', X / 2 - txtSize, Y / 2 - txtSize);
        ctx.fillText('Lightness', X / 2 + txtSize, Y / 2 - txtSize);
    }
    drawInfo() {
        ctx.strokeStyle = this.fixed.color;
        ctx.fillStyle = this.fixed.color;
        ctx.textAlign = "center";
        ctx.font = txtSize + 'px sans-serif';
        ctx.textBaseline = "middle";
        ctx.fillText(this.fixed.teeth, X / 2 - txtSize * 1.5, Y / 2 - txtSize * 0.45);
        ctx.fillText(this.moving.teeth, X / 2 - txtSize * 1.5, Y / 2 + txtSize * 0.60);
        ctx.fillText(calcLCM(this.fixed.teeth, this.moving.teeth) / this.moving.teeth, X / 2 + 1.5 * txtSize, Y / 2);

        ctx.beginPath();
        ctx.moveTo(X / 2 - txtSize * 2.5, Y / 2 - txtSize * 0.00);
        ctx.lineTo(X / 2 - txtSize * 0.5, Y / 2 - txtSize * 0.00);
        ctx.lineWidth = 3 * pixRat;
        ctx.stroke();

        ctx.font = txtSize / 2 + 'px sans-serif';
        ctx.fillText('Fixed wheel', X / 2 - txtSize * 1.5, Y / 2 - txtSize * 1.5);
        ctx.fillText('Moving wheel', X / 2 - txtSize * 1.5, Y / 2 + txtSize * 1.5);
        ctx.fillText('Symmetry', X / 2 + txtSize * 1.5, Y / 2 + txtSize * -1.0);
    }
    penUp() {
        this.tracing = false;
        if (this.trace.points.length > 1) {
            this.traces.push(this.trace);
        }
        this.trace = new Trace(this);
    }
    penUpCont() { //for continuity between traces, start next trace with last point of previous
        this.tracing = false;
        let cont = this.trace.points.length > 1;
        if (cont) {
            this.traces.push(this.trace);
        }
        this.trace = new Trace(this);
        if (cont & (this.traces.length > 0)) {
            this.trace.points.push(this.traces.slice(-1)[0].points.slice(-1)[0])
        }
    }
    penDown() {
        this.tracing = true;
    }
    update() {
        this.roll(this.th + .05 / Math.max(Math.abs(1 - this.fixed.circ / this.moving.circ), .15) * this.auto);
    }
    nudge(n) {
        this.penUp()
        let thInc = -n * PI2 / this.fixed.teeth;
        if (!this.out) {
            this.moving.th0 += thInc * this.fixed.rad / this.moving.rad;
        }
        if (this.out) {
            this.moving.th0 -= thInc * this.fixed.rad / this.moving.rad;
        }
        this.move(this.th + thInc);
        this.penDown()
    }
    reset() {
        this.penUp()
        this.moving.th0 = 0;
        this.move(0);
        this.penDown()
    }
    move(th) {
        let f = this.fixed;
        let m = this.moving;
        if (this.out) {
            m.x = f.x + (f.rad + m.rad) * Math.cos(th);
            m.y = f.y + (f.rad + m.rad) * Math.sin(th);
            m.th = m.th0 + th * (f.rad / m.rad + 1)
        }
        if (!this.out) {
            m.x = f.x + (f.rad - m.rad) * Math.cos(th);
            m.y = f.y + (f.rad - m.rad) * Math.sin(th);
            m.th = m.th0 - th * (f.rad / m.rad - 1)
        }

        this.th = th;
        if (this.tracing) {
            this.trace.points.push(this.tracePoint());
        }
    }
    inOut() {
        this.penUp();
        this.out = !this.out;
        this.configRings();
        // this.fixed.out=-this.fixed.out;
        this.moving.th0 += PI2 / 2;
        this.move(this.th);
        this.penDown();
    }
    configRings() {
        if (this.out) {
            this.fixed.ring = -1;
            this.moving.ring = 0;
        }
        else if (this.moving.teeth > this.fixed.teeth) {
            this.moving.ring = 1;
            this.fixed.ring = 0;
        }
        else {
            this.moving.ring = 0;
            this.fixed.ring = 1;
        }
    }

    roll(th) {
        this.move(this.th)
        if (Math.abs(th - this.th) < dth) {
            // normal move, increment is safely small
            this.move(th)
        }
        else {
            // move in units of dth
            let n = (th - this.th) / dth;
            // console.log(n);

            if (n > 0) {
                for (let i = 1; i < (n); i++) {
                    this.move(this.th + dth);
                }
                this.move(this.th + (n - Math.floor(n)) * dth);
            }
            else {
                for (let i = 1; i < -(n); i++) {
                    this.move(this.th - dth);
                }
                this.move(this.th - (Math.ceil(n) - n) * dth);
            }
        }
    }
    fullTrace() {
        this.penUp();
        this.penDown();
        let startTh = this.th;
        this.roll(this.th + PI2 * calcLCM(this.fixed.teeth, this.moving.teeth) / this.fixed.teeth);
        this.move(startTh + PI2 * calcLCM(this.fixed.teeth, this.moving.teeth) / this.fixed.teeth)
        this.penUp();
        this.penDown();
    }
    tracePoint() {
        let m = this.moving;
        let x = m.x + Math.cos(m.th) * (m.rad * m.rat)
        let y = m.y + Math.sin(m.th) * (m.rad * m.rat)
        return (new Point(x, y));
    }
    drawTraces(ctx) {
        // console.log(xoff,yoff)
        this.traces.forEach(trace => {
            trace.draw(ctx);
        })
        this.trace.draw(ctx);
    }
    clear() {
        if (this.trace.points.length > 0) {
            this.trace = new Trace(this);
        }
        else if (this.traces.length > 0) {
            this.traces.pop();
        }
    }
    clearAll() {
        while (this.traces.length > 0 || this.trace.points.length > 0) {
            this.clear();
        }
    }
    getTracesBounds() {
        let xmin = 0;
        let xmax = 0;
        let ymin = 0;
        let ymax = 0;
        this.traces.forEach(trace => {
            // console.log(trace.bounds())
            xmin = Math.min(trace.bounds().xmin, xmin);
            xmax = Math.max(trace.bounds().xmax, xmax);
            ymin = Math.min(trace.bounds().ymin, ymin);
            ymax = Math.max(trace.bounds().ymax, ymax);
        })
        return ({
            xmin: xmin,
            xmax: xmax,
            ymin: ymin,
            ymax: ymax,
        })

    }
}
class PButton {
    constructor(panel, x, y, w, h, txt, fun, argObj, getXdragVar, getYdragVar, isDepressedFun, toggleValFun) {
        this.x = panel.x + x * panel.w;
        this.y = panel.y + y * panel.h;
        this.w = w * panel.w;
        this.h = h * panel.h;
        this.txt = txt;
        this.fun = fun;
        this.argObj = argObj;
        this.depressed = false;
        this.xDrag = false;
        this.yDrag = false;
        this.toggle = false;
        this.toggleValFun = toggleValFun;
        this.y0;
        this.x0;
        this.xVar0;
        this.yVar0;
        this.getYdragVar = getYdragVar;
        this.getXdragVar = getXdragVar;
        this.isDepressedFun = isDepressedFun;
        this.UDarrows = false;
        this.LRarrows = false;
        this.UDarrLen = this.h / 6;
        this.LRarrLen = this.w / 6;
    }
    draw() {
        ctx.strokeStyle = hg.color;
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.w, this.h);
        ctx.stroke();

        if (this.depressed) {
            ctx.fillStyle = hg.color;
            ctx.fillRect(this.x, this.y, this.w, this.h)
        }
        if (this.toggle) {
            if (this.toggleValFun()) {
                ctx.fillStyle = transCol;
                ctx.fillRect(this.x, this.y, this.w, this.h)
            }
        }
        if (this.UDarrows) {
            drawArrow(ctx,
                this.x + this.w / 2, this.y + this.h / 2 + txtSize / 4,
                this.x + this.w / 2, this.y + this.h / 2 + txtSize / 4 + this.UDarrLen,
                baseLW, uiTextColor)
            drawArrow(ctx,
                this.x + this.w / 2, this.y + this.h / 2 - txtSize / 4,
                this.x + this.w / 2, this.y + this.h / 2 - txtSize / 4 - this.UDarrLen,
                baseLW, uiTextColor)
        }
        if (this.LRarrows) {
            drawArrow(ctx,
                this.x + this.w / 2 - txtSize / 2, this.y + this.h / 2,
                this.x + this.w / 2 - txtSize / 2 - this.LRarrLen, this.y + this.h / 2,
                baseLW, uiTextColor)
            drawArrow(ctx,
                this.x + this.w / 2 + txtSize / 2, this.y + this.h / 2,
                this.x + this.w / 2 + txtSize / 2 + this.LRarrLen, this.y + this.h / 2,
                baseLW, uiTextColor)
        }




        ctx.fillStyle = uiTextColor;
        ctx.textAlign = "center";
        ctx.font = txtSize / 4 + 'px sans-serif';
        ctx.textBaseline = "middle";
        ctx.lineWidth = baseLW;
        ctx.fillText(this.txt, this.x + this.w / 2, this.y + this.h / 2, this.w * 0.9);
    }
    contains(x, y) {
        return (x > this.x & x < (this.x + this.w) & y > this.y & y < (this.y + this.h));
    }
    action() {
        this.fun(this.argObj);
    }
    pointerDown(x, y) {
        if (this.contains(x, y)) {
            this.depressed = true;
            this.x0 = x;
            this.y0 = y;
            if (this.yDrag) {
                this.yVar0 = this.getYdragVar();
                this.isDepressedFun(true);
            }
            if (this.xDrag) {
                this.xVar0 = this.getXdragVar();
                this.isDepressedFun(true);
            }
        }
    }
    pointerUp(x, y) {
        if (!this.xDrag & !this.yDrag & this.depressed & this.contains(x, y)) {
            this.action();
        }
        this.depressed = false;
        if (this.isDepressedFun) {
            this.isDepressedFun(false);
        }
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
class Panel {
    constructor(x, y, w, h) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.anyClickActivates = false;
        this.overlay = false;
        this.buttonArray = [];
        this.wait = false;
    }
    draw() {
        if (this.active) {
            if (this.overlay) {
                ctx.beginPath();
                ctx.lineWidth = baseLW * 1;
                ctx.fillStyle = bgFillStyleAlpha;
                ctx.fillRect(0, 0, X, Y);
                ctx.fillStyle = bgFillStyle;
                ctx.fillRect(this.x, this.y, this.w, this.h)
            }
            ctx.fillStyle = bgFillStyleAlpha;
            ctx.fillRect(this.x, this.y, this.w, this.h);

            ctx.beginPath();
            ctx.strokeStyle = hg.color;
            ctx.lineWidth = baseLW * 2;
            ctx.rect(this.x, this.y, this.w, this.h)
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
    pointerDown(x, y) {
        if (this.active) {
            this.buttonArray.forEach(button => button.pointerDown(x, y))
        }
        // if (this.anyClickActivates) {
        //     this.active = true;
        // }
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
    zoomHandler(dW, xc, yc);
    if (!hg.auto) { requestAnimationFrame(anim); }
}
function pointerDownHandler(xc, yc, n = 1) {
    x = xc * pixRat;
    y = yc * pixRat;

    if (!showgalleryForm) {
        panelArray.forEach(panel => panel.pointerDown(x, y))


        let now = new Date().getTime();
        let timeSince = now - lastTouch;
        if (timeSince < 300 & n < 2) {
            //double touch
            doubleClickHandler(clickCase);
        }
        lastTouch = now;

        if (((y > .5 * Y & y < (Y - uiY)) & !isLandscape) ||
            ((y > .5 * Y & y < Y & x > uiX) & isLandscape)) {
            clickCase = "autoCW";
        }

        else if (((y < .5 * Y & y > (uiY)) & !isLandscape) ||
            ((y < .5 * Y & y > 0 & x > uiX) & isLandscape)) {
            clickCase = "autoCCW";
        }
        else {
            clickCase = null;
        }
    }

    xt = (x - xOff) / (scl)
    yt = (y - yOff) / (scl)


    if (
        !isLandscape & bottomPanel.active & (y < (Y - uiY) & y > uiY) ||
        isLandscape & bottomPanel.active & (x > uiX) ||
        !bottomPanel.active
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
    // if (mselect == "moving") {
    //     dthDrag = Math.atan2(yt - pair.fixed.y, xt - pair.fixed.x) - thDragSt;
    //     if (dthDrag < Math.PI) {
    //         dthDrag += PI2;
    //     }
    //     if (dthDrag > Math.PI) {
    //         dthDrag -= PI2;
    //     }
    //     pair.roll(pair.th + dthDrag);
    //     thDragSt = Math.atan2(yt - pair.fixed.y, xt - pair.fixed.x);
    // }
    // if (mselect == "fixed") {
    //     pair.translate(xfix0 + (x - x0) / scl, yfix0 + (y - y0) / scl)
    // }


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
}
function doubleClickHandler(clickCase) {
    // if (showWheels) {
    //     if ((clickCase == "autoCCW" || clickCase == "autoCW") & pair.auto != 0) {
    //         pair.auto = 0;
    //     }
    //     else if (clickCase == "autoCCW") {
    //         pair.auto = -1;
    //         anim(); //get the ball rolling...
    //     }
    //     else if (clickCase == "autoCW") {
    //         pair.auto = 1;
    //         anim();
    //     }
    // }
    topPanel.active = true;
    bottomPanel.active = true;
    showWheels = true;

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
function drawSquareFullImage(n = 1080) {
    // pair.penUp();
    let baseLWtemp = baseLW;
    baseLW = galleryLW * baseLW;
    let tracesBounds = hg.getTracesBounds();
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
    ctxSh.setTransform(imscl, 0, 0, imscl, xoff, yoff)
    hg.draw(ctxSh);
    baseLW = baseLWtemp;
    return (canvasSh)
}
function shareImage() {
    if (hg.points.length > 1) {
        sharePanel.wait = true;
        canvasSq = drawSquareFullImage(1080);
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
            anim()
        })
    }
}
function uploadImage(name, comment) {
    if (hg.points.length > 0) {
        sharePanel.wait = true;
        canvasSq = drawSquareFullImage(gallerySize);
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
                    sharePanel.wait = false;
                    anim()
                })
                .catch((error) => {
                    console.error('Error:', error);
                    sharePanel.wait = false;
                    anim()
                });
        })
    }
}
function createSharePanel() {
    xsize = 200 * pixRat;
    ysize = 400 * pixRat;
    let panel = new Panel((X - xsize) / 2, (Y - ysize) / 2, xsize, ysize);
    panel.overlay = true;
    // panel.wait=true;
    panel.active = false;
    panel.buttonArray.push(
        new PButton(panel, 0.0, 0, 1, 0.1, "Close",
            function () { panel.active = false; })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.1, .2, .8, 0.1, "Share Image",
            function () { shareImage(); })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.1, .5, .8, 0.1, "Upload to Gallery",
            function () { toggleGalleryForm() })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.1, .8, .8, 0.1, "View Gallery",
            function () { window.location.href = 'gallery.html' })
    );

    return (panel);

}
function createTopPanel() {

    let uiBorder = X / 100;
    let panel = new Panel(0 + uiBorder, 0 + uiBorder, uiX - 2 * uiBorder, uiY);
    panel.anyClickActivates = true;

    panel.buttonArray.push(
        new PButton(panel, 0.0, 0.0, 0.25, 0.333, "Share",
            function () { sharePanel.active = true; })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.0, 0.333, 0.25, 0.666, "Hide",
            function () {
                // showUI = false;
                showWheels = false;
                panelArray.forEach(panel => panel.active = false)
            })
    );

    // panel.buttonArray.push(
    //     new PButton(panel, 0.25, .0, 0.25, 0.333, "Clear All",
    //         function () { pair.clearAll() })
    // );
    // panel.buttonArray.push(
    //     new PButton(panel, 0.25, .333, 0.25, 0.666, "Clear",
    //         function () { pair.clear(); })
    // );
    panel.buttonArray.push(
        new PButton(panel, 0.25, .0, 0.25, 0.5, "Phase1",
            function () { hg.toggleAutoPhase(); })
    );
    panel.buttonArray.push(
        new PButton(panel, 0.25, .5, 0.25, 0.5, "Phase2",
            function () { hg.toggleAutoPhaseRot(); })
    );






    // panel.buttonArray.push(
    //     new PButton(panel, 0.5, 0, 0.25, 0.333, "Invert",
    //         function () { pair.inOut(); })
    // );
    // panel.buttonArray.push(
    //     new PButton(panel, 0.5, .333, 0.25, 0.333, "Nudge +",
    //         function () { return pair.nudge(1); })
    // );
    // panel.buttonArray.push(
    //     new PButton(panel, 0.5, .666, 0.25, 0.333, "Nudge -",
    //         function () { return pair.nudge(-1); })
    // );

    // panel.buttonArray.push(
    //     new PButton(panel, 0.75, 0, 0.125, 0.333, "Reset",
    //         function () { return pair.reset(); })
    // );

    // let lockButton = new PButton(panel, 0.875, 0, 0.125, 0.333, "Lock",
    //     function () { return pair.toggleLock(); },
    //     [], [], [], null,
    //     function () { return pair.locked; })
    // lockButton.toggle = true;
    // panel.buttonArray.push(lockButton);


    // panel.buttonArray.push(
    //     new PButton(panel, 0.75, .333, 0.25, 0.666, "Trace",
    //         function () { pair.fullTrace() })
    // );

    return (panel)
}
function createBottomPanel() {

    let uiBorder = X / 100;
    let panel = new Panel(0 + uiBorder, Y - uiY - 2 * uiBorder + uiBorder, uiX - 2 * uiBorder, uiY);
    panel.anyClickActivates = true;

    let dragButton1 = new PButton(panel, 0.0, 0, 0.1, 1, "f1",
        function (dy, yDragVar0) {
            showWheelsOverride = true;
            // pair.penUp();
            hg.f1 = Math.round(Math.min(10, Math.max((-0.05 / pixRat * dy) + yDragVar0, 0)))
            // pair.penDown();

        }, [], [],
        function () {
            return hg.f1;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        },
    )
    dragButton1.yDrag = true;
    dragButton1.UDarrows = true;
    panel.buttonArray.push(dragButton1);

    let dragButton2 = new PButton(panel, 0.1, 0, 0.1, 1, "f2",
        function (dy, yDragVar0) {
            showWheelsOverride = true;
            // pair.penUp();
            hg.f2 = Math.round(Math.min(10, Math.max((-0.05 / pixRat * dy) + yDragVar0, 0)))
            // pair.penDown();

        }, [], [],
        function () {
            return hg.f2;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        },
    )
    dragButton2.yDrag = true;
    dragButton2.UDarrows = true;
    panel.buttonArray.push(dragButton2);

    let dragButton1a = new PButton(panel, 0.2, 0, 0.1, 1, "detune",
        function (dy, yDragVar0) {
            showWheelsOverride = true;
            // pair.penUp();
            hg.detune1 = (Math.min(1, Math.max((-0.0001 / pixRat * dy) + yDragVar0, -1)))
            // pair.penDown();

        }, [], [],
        function () {
            return hg.detune1;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        },
    )
    dragButton1a.yDrag = true;
    dragButton1a.UDarrows = true;
    panel.buttonArray.push(dragButton1a);



    let dragButton3 = new PButton(panel, 0.3, 0.0, 0.1, 1, "p1",
        function (dy, yDragVar0) {
            hg.p1 = Math.min(10, Math.max(-0.002 / pixRat * dy + yDragVar0, -10))
        }, [], [],
        function () {
            return hg.p1;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        },
    )
    dragButton3.yDrag = true;
    dragButton3.UDarrows = true;
    panel.buttonArray.push(dragButton3);


    let dragButton5 = new PButton(panel, 0.4, 0.0, 0.1, 1, "d1",
        function (dy, yDragVar0) {
            hg.d1 = Math.min(10, Math.max((1 - 0.01 / pixRat * dy) * yDragVar0, 0.000001))
            hg.d2 = Math.min(10, Math.max((1 - 0.01 / pixRat * dy) * yDragVar0, 0.000001))
        }, [], [],
        function () {
            return hg.d1;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        },
    )
    dragButton5.yDrag = true;
    dragButton5.UDarrows = true;
    panel.buttonArray.push(dragButton5);



    let dragButton6 = new PButton(panel, 0.5, 0.0, 0.1, 1, "t0",
        function (dy, yDragVar0) {
            hg.t0 = Math.min(10, Math.max((- 0.01 / pixRat * dy) + yDragVar0, -10))

        }, [], [],
        function () {
            return hg.t0;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        },
    )
    dragButton6.yDrag = true;
    dragButton6.UDarrows = true;
    panel.buttonArray.push(dragButton6)

    let dragButton7 = new PButton(panel, 0.6, 0.0, 0.1, 1, "t",
        function (dy, yDragVar0) {
            hg.t1 = Math.min(1000, Math.max((1 - 0.01 / pixRat * dy) * yDragVar0, 1))

        }, [], [],
        function () {
            return hg.t1;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        },
    )
    dragButton7.yDrag = true;
    dragButton7.UDarrows = true;
    panel.buttonArray.push(dragButton7)


    let dragButton8 = new PButton(panel, 0.7, 0.0, 0.1, 1, "a",
        function (dy, yDragVar0) {
            hg.a3 = Math.min(X, Math.max((-1.0 / pixRat * dy) + yDragVar0, 0))

        }, [], [],
        function () {
            return hg.a3;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        },
    )
    dragButton8.yDrag = true;
    dragButton8.UDarrows = true;
    panel.buttonArray.push(dragButton8)

    let dragButton9 = new PButton(panel, 0.8, 0.0, 0.1, 1, "f",
        function (dy, yDragVar0) {
            hg.f3 = Math.min(100, Math.max((1 - 0.01 / pixRat * dy) * yDragVar0, 1))

        }, [], [],
        function () {
            return hg.f3;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        },
    )
    dragButton9.yDrag = true;
    dragButton9.UDarrows = true;
    panel.buttonArray.push(dragButton9)


    let dragButton10 = new PButton(panel, 0.9, 0.0, 0.1, 1, "p3",
        function (dy, yDragVar0) {
            hg.p3 = Math.min(-10, Math.max((- 0.0005 / pixRat * dy) + yDragVar0, 10))

        }, [], [],
        function () {
            return hg.p3;
        },
        function (isDepressed) {
            showRadInfo = isDepressed;
        },
    )
    dragButton10.yDrag = true;
    dragButton10.UDarrows = true;
    panel.buttonArray.push(dragButton10)


    // let hueButton = new PButton(panel, 0.6, 0, 0.2, 1, "Hue",
    //     function (dy, yDragVar0) {

    //         pair.move(pair.th);
    //         pair.penUpCont();

    //         pair.hue = yDragVar0 - 0.5 / pixRat * dy;
    //         if (pair.hue > 360) {
    //             pair.hue -= 360;
    //         }
    //         if (pair.hue < 0) {
    //             pair.hue += 360;
    //         }
    //         // console.log(dy, yDragVar0, dx, xdragVar0)
    //         // pair.lightness = Math.max(00, Math.min(100, xdragVar0 + dx * 0.25/pixRat));

    //         pair.setColor();
    //         pair.fixed.color = pair.color;
    //         pair.moving.color = pair.color;
    //         document.querySelector(':root').style.setProperty('--fgColor', pair.color)
    //         pair.move(pair.th);
    //         pair.penDown();

    //     }, [], [],
    //     function () {
    //         return pair.hue;
    //     },
    //     function (isDepressed) {
    //         showColInfo = isDepressed;
    //     }
    // )
    // hueButton.yDrag = true;
    // // colButton.xDrag = true;
    // hueButton.UDarrows = true;
    // // colButton.LRarrows = true;
    // panel.buttonArray.push(hueButton)

    // let lightnessButton = new PButton(panel, 0.8, 0, 0.2, 1, "Lightness",
    //     function (dy, yDragVar0) {

    //         pair.move(pair.th);
    //         pair.penUpCont();

    //         // pair.hue = yDragVar0 - 0.5/pixRat * dy;
    //         // if (pair.hue > 360) {
    //         //     pair.hue -= 360;
    //         // }
    //         // if (pair.hue < 0) {
    //         //     pair.hue += 360;
    //         // }
    //         // console.log(dy, yDragVar0, dx, xdragVar0)

    //         pair.lightness = Math.max(00, Math.min(100, yDragVar0 + dy * -0.25 / pixRat));

    //         pair.setColor();
    //         pair.fixed.color = pair.color;
    //         pair.moving.color = pair.color;
    //         document.querySelector(':root').style.setProperty('--fgColor', pair.color)
    //         pair.move(pair.th);
    //         pair.penDown();

    //     }, [], [],
    //     function () {
    //         return pair.lightness;
    //     },
    //     function (isDepressed) {
    //         showColInfo = isDepressed;
    //     }
    // )
    // lightnessButton.yDrag = true;
    // // colButton.xDrag = true;
    // lightnessButton.UDarrows = true;
    // // colButton.LRarrows = true;
    // panel.buttonArray.push(lightnessButton)



    return panel;
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
}
function wakeGalleryServer() {
    fetch(galleryAPIurl)
        .then(response => response.text())
        .then(data => console.log(data));

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
function anim() {
    if (hg.auto) { requestAnimationFrame(anim); }
    if (hg.auto) { // & !showColInfo & !showInfo & !showRadInfo) {
        hg.update();
    }

    // clear screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //scaled stuff
    ctx.setTransform(scl, 0, 0, scl, xOff, yOff)
    hg.calc()
    hg.draw()
    // 

    // fixed stuff
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    panelArray.forEach(panel => panel.draw())

    // if (showInfo) {
    //     pair.drawInfo();
    // }
    // if (showRadInfo) {
    //     pair.drawRadInfo();
    // }
    // if (showColInfo) {
    //     pair.drawColInfo();
    // }

    if (topPanel.active) {
        ctx.textAlign = "left"
        // ctx.fillText('auto: ' + hg.auto, 20, uiY + 20)
        // ctx.fillText('auto Phase 1: ' + hg.autoPhase, 20, uiY + 50)
        // ctx.fillText('auto Phase 2: ' + hg.autoPhaseRot, 20, uiY + 80)

        ctx.fillText(
            // 'o1 a: ' + Math.round(hg.a1 * 10000) / 10000 +
            'f1: ' + Math.round(hg.f1 * 10000) / 10000 +
            ', f2: ' + Math.round(hg.f2 * 10000) / 10000 +
            ', detune1: ' + Math.round(hg.detune1 * 10000) / 10000
            // ', p: ' + Math.round(hg.p1 * 10000) / 10000 +
            // ', d: ' + Math.round(hg.d1 * 10000) / 10000
            , 10, Y - uiY - 50)
        ctx.fillText(
            // 'rot a: ' + Math.round(hg.a3 * 10000) / 10000 +
            'f: ' + Math.round(hg.f3 * 10000) / 10000
            // ', p: ' + Math.round(hg.p3 * 10000) / 10000 +
            // ', d: ' + Math.round(hg.d3 * 10000) / 10000
            , 10, Y - uiY - 20)

        // ctx.fillText('scl='+Math.round(scl * 10000) / 10000, 20, uiY + 140)
        // ctx.fillText('v21', 10, Y - 15)
    }
}

class Harmonograph {
    constructor() {
        this.hue = hueInit;
        this.saturation = 100;
        this.lightness = 65;
        this.locked = true;
        this.color = 0;
        this.setColor();

        this.f1 = 1;
        this.f2 = 2;
        this.f3 = 1;
        this.detune1=0;

        this.p1 = .25;
        this.p2 = 0;
        this.p3 = .5;

        this.a1 = 0.45 * Math.min(X, Y - 2 * uiY);
        this.a2 = 0.45 * Math.min(X, Y - 2 * uiY);
        this.a3 = 0.0 * Math.min(X, Y);

        this.d1 = .006;
        this.d2 = .006;
        this.d3 = 0.00;

        this.t0 = 0;
        this.t1 = 200;
        this.dt = .05;

        this.auto = true;
        this.autoPhase = false;
        this.autoPhaseRot = false;

        this.points = [];
        this.calc();

    }
    toggleAutoPhase() {
        this.autoPhase = !this.autoPhase;
        this.checkAuto();
    }
    toggleAutoPhaseRot() {
        this.autoPhaseRot = !this.autoPhaseRot;
        this.checkAuto();
    }
    checkAuto() {
        if (!(this.autoPhase || this.autoPhaseRot)) {
            this.auto = false;
        }
        else if (!this.auto) {
            this.auto = true;
            anim();
        }
    }

    update() {
        if (this.autoPhase) {
            this.p1 = this.p1 + 0.002
        }
        if (this.autoPhaseRot) {
            this.p3 = this.p3 + 0.001
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
        this.points = [];
        // let n = (this.t1 - this.t0) / this.dt;
        // console.log('Calc n:',n)
        for (let t = this.t0; t < this.t1; t += this.dt) {
            this.points.push(new Point(
                this.eq(
                    this.a1, this.f1+this.detune1, this.p1, this.d1,
                    this.a3, this.f3, this.p3, this.d3,
                    t),
                this.eq(
                    this.a2, this.f2, this.p2, this.d2,
                    this.a3, this.f3 + .25, this.p3, this.d3,
                    t)))
        }
    }
    draw() {

        if (this.points.length > 1) {
            // console.log('Draw')
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = baseLW * 1;
            ctx.moveTo(this.points[0].x, this.points[0].y);
            this.points.forEach(point => {
                ctx.lineTo(point.x, point.y);
            })
            ctx.stroke();
        }
    }


}

const canvas = document.getElementById("cw");
const ctx = canvas.getContext("2d");
const PI2 = Math.PI * 2;

let pixRat = window.devicePixelRatio * 1.0;

canvas.height = window.innerHeight * pixRat;
canvas.width = window.innerWidth * pixRat;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";
let X = canvas.width;
let Y = canvas.height;

let scl = 1.0;

const txtSize = 60 * pixRat;
let baseLW = 1 * pixRat;

let clickCase = null;
let mouseDown = false;
let lastTouch = new Date().getTime();
let showWheels = true;
let showWheelsOverride = false;
let showInfo = false;
let showRadInfo = false;
let showColInfo = false;
let showgalleryForm = false;

const shareBorderfrac = 0.15;
const hueInit = Math.random() * 360
const bgFillStyle = "hsl(" + hueInit + ",100%,5%)";
const bgFillStyleAlpha = "hsla(" + hueInit + ",100%,5%,.80)";
const transCol = "rgb(128,128,128,0.2)"
const uiTextColor = "white"
canvas.style.backgroundColor = bgFillStyle

const galleryLW = 1;
const gallerySize = 1080;

const dth = PI2 / 100;

//vars for pinch zoom handling
var prevDiff = 0;
var curDiff = 0;
var dDiff = 0;

// initial screen centre
let xOff = X / 2;
let yOff = Y / 2;

// ui size
let uiY = 0.2 * Y;
let uiX = X;

if (X > 1.4 * Y) {
    isLandscape = true
    uiY = 0.4 * Y;
    uiX = 0.333 * X;
    xOff = 2 * X / 3;
}
else {
    isLandscape = false;
}


let hg = new Harmonograph()

topPanel = createTopPanel();
sharePanel = createSharePanel();
bottomPanel = createBottomPanel();
panelArray = [topPanel, bottomPanel, sharePanel];
// panelArray = [bottomPanel];

// wakeGalleryServer()
setGallerySubmitHTML();
addPointerListeners();
anim();
