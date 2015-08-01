function Cylinder(width, height, divisions) {
    if (!isFinite(width)) {
        throw "Invalid width: " + width;
    }
    if (!isFinite(height)) {
        throw "Invalid height: " + height;
    }
    if (!isFinite(divisions)) {
        throw "Invalid divisions: " + divisions;
    }

    if (divisions < 3) {
        divisions = 3;
    }

    var topCenter = vec4(0, height / 2, 0, 1.0);
    var bottomCenter = vec4(0, -height / 2, 0, 1.0);
    var angleIncrement = (360 / divisions);

    var referencePoint = vec2(width / 2, 0);
    var edges = [];
    for (var i = 0; i < divisions; ++i) {
        var rotated = rotate(referencePoint[0], referencePoint[1], angleIncrement * i);
        edges.push(vec4(rotated[0], -height / 2, rotated[1], 1.0));
    }

    edges.push(edges[0]);

    this.bottom = [bottomCenter].concat(edges);
    this.top = [topCenter].concat(edges);

    var elementPosition = vec4(0, 0, 0, 0);

    this.position = function (position) {
        if (arguments.length == 0) {
            return elementPosition;
        } else {
            if (position.length < 4) {
                throw "Malformed position arguments: " + position;
            } else {
                console.log('Positioning cylinder to ', position);
                elementPosition = position;
            }
        }
    };

    this.color = COLORS.white;

}

function doRotate(x, y, angle) {
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    return vec2(x * cos - y * sin, x * sin + y * cos);
}

function rotate(x, y, angle) {
    return doRotate(x, y, radians(angle));
}

function CylinderRenderer(program, gl) {

    var vColor, vPosition;

    function bindBuffers() {
        /** Position buffer **/

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        /** Color buffer **/
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);

    }

    gl.useProgram(program);

    var vPosition =  gl.getAttribLocation(program, 'vPosition');
    var vColor = gl.getAttribLocation(program, 'vColor');
    var elements = [];

    var pointsBuffer = gl.createBuffer();
    var colorBuffer = gl.createBuffer();

    bindBuffers();

    var screenPosition = gl.getUniformLocation(program, 'screenPosition');
    var theta = gl.getUniformLocation(program, 'theta');

    function addElement(cylinder) {
        gl.useProgram(program);

        bindBuffers();

        console.log('Adding:', cylinder.__proto__.constructor.name, cylinder);
        elements.push(cylinder);

        var points = elements.reduce(function (acc, cyl) {
            return acc.concat(cyl.bottom.concat(cyl.top));
        }, []);

        var actualColors = points.map(function () {
            return cylinder.color;
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(actualColors), gl.STATIC_DRAW);
    }

    function renderCylinders(rotation) {
        if (elements.length === 0) {
            return;
        }
        gl.useProgram(program);

        bindBuffers();

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);

        var offset = 0;
        elements.forEach(function (cylinder) {

            gl.uniform3fv(theta, flatten(rotation || [0, 0, 0]));

            gl.uniform4fv(screenPosition, flatten(cylinder.position()));

            gl.drawArrays(gl.TRIANGLE_FAN, offset, cylinder.bottom.length);
            gl.drawArrays(gl.TRIANGLE_FAN, offset + cylinder.bottom.length, cylinder.top.length);
            offset += cylinder.bottom.length + cylinder.top.length;
        });
    }

    return {
        render: renderCylinders,
        addElement: addElement
    }
}