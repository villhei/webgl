"use strict";

var canvas;
var gl;
var MAX_VERTICES = 8096;

var lines = [];
var pointCount = 0;
var pointsBuffer, colorsBuffer;

var settings = {
    strokeWidth: 2
};

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


function recordPath(event) {
    var color = getDrawColor();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * pointCount, flatten(color));

    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    var coords = translateCoordinate([event.layerX, event.layerY]);
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * pointCount, flatten(coords));
    pointCount++;
    lines[lines.length - 1].points.push(coords);
    requestAnimFrame(render);
}

function translateCoordinate(coordinatePoints) {
    if (coordinatePoints.length != 2) {
        throw 'Wrong number of coordinates supplied: ' + coordinatePoints.length;
    }
    var x = -1 + 2 * (coordinatePoints[0] / canvas.width);
    var y = -1 + 2 * ((canvas.height - coordinatePoints[1]) / canvas.height);
    return vec2(x, y);
}

function getDrawColor() {
    var hex = hexToRgb($('#colorPicker').val());
    return vec4(hex.r / 255, hex.g / 255, hex.b / 255, 1.0);
}

function initListeners() {
    canvas = document.getElementById('webgl-canvas');

    canvas.addEventListener('mousedown', function () {
        lines.push({
            points: [],
            width: parseFloat(settings.strokeWidth)
        });
        canvas.addEventListener('mousemove', recordPath);
    });

    document.addEventListener('mouseup', function () {
        canvas.removeEventListener('mousemove', recordPath);
    });

    $('#colorPicker').on('change', function (newVal) {
        console.log(newVal);
    });

    var stroke = $('#stroke-input');
    bindValues(stroke, 'strokeWidth');
    bindOutput(stroke, $('#stroke-width'));
    $('#stroke-width').text(settings.strokeWidth);
}

window.onload = function init() {

    initListeners();

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert('WebGL isn\'t available');
    }
    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //  Load shaders and initialize attribute buffers


    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    pointsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * MAX_VERTICES, gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    colorsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * MAX_VERTICES, gl.STATIC_DRAW);

    var vColor= gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);


    /**    function animate(theta) {
        requestAnimFrame(function () {
            render(theta);
            animate(theta + 0.01);
        });
    }

     animate(0);
     **/
    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    var offset = 0;
    lines.forEach(function (line) {
        gl.lineWidth(line.width);
        gl.drawArrays(gl.LINE_STRIP, offset, line.points.length);
        offset += line.points.length;
    });
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}