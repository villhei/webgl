"use strict";

var canvas;
var gl;

var thetaLoc, rotLoc;

var points = [];

var settings = {
    subdivisions: 2,
    twist: 0,
    drawMode: 'lines',
    polygon: 'triangle'
};

function initControls() {
    var divisor = $('#subdivisions-input');
    var twister = $('#twist-input');
    bindValues(divisor, 'subdivisions');
    bindValues(twister, 'twist');
    bindOutput(divisor, $('#subdivisions-amount'));
    bindOutput(twister, $('#twist-amount'));
    $('#drawmode-label').text(settings.drawMode);
    $('#polygon-label').text(settings.polygon);
}

function bindValues(inputElem, boundValue) {
    inputElem.val(settings[boundValue]);
    inputElem.on('change', function () {
        settings[boundValue] = inputElem.val();
    });
    inputElem.on('input', function () {
        settings[boundValue] = inputElem.val();
    });
}

function bindOutput(inputElem, outputTarget) {
    outputTarget.text(inputElem.val());
    inputElem.on('input', function () {
        outputTarget.text(inputElem.val());
    });
    inputElem.on('change', function () {
        outputTarget.text(inputElem.val());
    });
}

function togglePolygon() {
    if (settings.polygon === 'triangle') {
        settings.polygon = 'rectangle';
    } else {
        settings.polygon = 'triangle';
    }
    $('#polygon-label').text(settings.polygon);
}

function toggleDrawMode() {
    if (settings.drawMode === 'filled') {
        settings.drawMode = 'lines';
    } else {
        settings.drawMode = 'filled';
    }
    $('#drawmode-label').text(settings.drawMode);
}

window.onload = function init() {
    initControls();

    canvas = document.getElementById("webgl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.


    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //  Load shaders and initialize attribute buffers


    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    thetaLoc = gl.getUniformLocation(program, "twistTheta");
    rotLoc = gl.getUniformLocation(program, "rotation");

    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    function animate(theta) {
        requestAnimFrame(function () {
            render(theta);
            animate(theta + 0.01);
        });
    }
    animate(0);
};

function divideTriangle(a, b, c, count) {
    if (count < 1) {
        return [a, b, c];
    } else {
        //bisect the sides
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        // four new triangles
        return divideTriangle(a, ab, ac, count - 1)
            .concat(divideTriangle(ac, bc, ab, count - 1))
            .concat(divideTriangle(ab, b, bc, count - 1))
            .concat(divideTriangle(bc, c, ac, count - 1));
    }
}

function doRotate(x, y, angle) {
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    return vec2(x * cos - y * sin, x * sin + y * cos);
}

function rotate(x, y, angle) {
    return doRotate(x, y, radians(angle));
}

function render(rotation) {
    var twistTheta = parseFloat(settings.twist);
    console.log(twistTheta);
    if (!isFinite(twistTheta)) {
        throw "Twist theta was not a number, but " + twistTheta;
    }
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(thetaLoc, twistTheta * 1.0);
    gl.uniform1f(rotLoc, rotation);

    if (settings.polygon === 'triangle') {
        renderTriangles();
    } else {
        renderRectangles();
    }
}

function renderRectangles() {
    var pos = 0.7;
    var vertices = [vec2(-pos, pos),
        vec2(pos, pos),
        vec2(pos, -pos),
        vec2(pos, -pos),
        vec2(-pos, pos),
        vec2(-pos, -pos)];

    var points = divideTriangle(vertices[0], vertices[1], vertices[2], settings.subdivisions)
        .concat(divideTriangle(vertices[3], vertices[4], vertices[5], settings.subdivisions));

    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    gl.clear(gl.COLOR_BUFFER_BIT);
    if (settings.drawMode === 'filled') {
        gl.drawArrays(gl.TRIANGLES, 0, points.length);
    } else {
        for (var i = 0; i < points.length / 3; ++i) {
            gl.drawArrays(gl.LINE_LOOP, i * 3, 3);
        }
    }

}

function renderTriangles() {

    var top = vec2(0, 0.9);

    var vertices = [
        top,
        rotate(top[0], top[1], 120),
        rotate(top[0], top[1], 240)
    ];

    var points = divideTriangle(vertices[0], vertices[1], vertices[2], settings.subdivisions);

    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    gl.clear(gl.COLOR_BUFFER_BIT);
    if (settings.drawMode === 'filled') {
        gl.drawArrays(gl.TRIANGLES, 0, points.length);
    } else {
        for (var i = 0; i < points.length / 3; ++i) {
            gl.drawArrays(gl.LINE_LOOP, i * 3, 3);
        }
    }
}