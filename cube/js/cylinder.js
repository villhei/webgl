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

    this.position = function(position) {
        if(arguments.length == 0) {
            return elementPosition;
        } else {
            if(position.length < 4) {
                throw "Malformed position arguments: " + position;
            } else {
                console.log('Positioning cylinder to ', position);
                elementPosition = position;
            }
        }
    };

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

    var elements = [];

    var pointsBuffer = gl.createBuffer();
    var colorBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");

    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Define RGB here
    var colors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    var vColor = gl.getAttribLocation(program, 'vColor');
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var screenPosition = gl.getUniformLocation(program, 'screenPosition');

    function addElement(cylinder) {
        console.log('Adding:', cylinder.__proto__.constructor.name, cylinder);
        elements.push(cylinder);

        var points = elements.reduce(function (acc, cyl) {
            return acc.concat(cyl.bottom.concat(cyl.top));
        }, []);

        var actualColors = points.map(function (point, index) {
            return colors[index % colors.length];
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(actualColors), gl.STATIC_DRAW);
    }

    function renderCylinders() {
        if(elements.length === 0) {
            return;
        }
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);

        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);


        var offset = 0;
        elements.forEach(function (cylinder) {
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