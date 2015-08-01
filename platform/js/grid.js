function Grid(corner1, corner2, divisions) {

    var dX = corner2[0] - corner1[0];
    var dZ = corner2[2] - corner1[2];

    var points = [];

    var sX = dX/divisions;
    var sZ = dZ/divisions;

    for(var i = 0 ; i < divisions+1 ; ++i) {
        var x = corner1[0] + sX*i;
        var y = corner1[1];
        var z = corner1[2];

        points.push(vec4(x, y, z, 1.0));
        points.push(vec4(x, y, z + dZ));
    }

    for(var j = 0 ; j < divisions+1 ; ++j) {
        var x = corner1[0];
        var y = corner1[1];
        var z = corner1[2] + sZ*j;

        points.push(vec4(x, y, z, 1.0));
        points.push(vec4(x + dX, y, z, 1.0));

    }

    this.points = points;
}

function GridRenderer(program, gl) {

    var vColor, vPosition;
    var elements = [];

    function bindBuffers() {
        /** Position buffer **/

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
    }

    gl.useProgram(program);

    var pointsBuffer = gl.createBuffer();

    bindBuffers();

    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");

    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var gridColor = COLORS.black;

    var projectionLoc = gl.getUniformLocation(program, 'projection');
    var modelViewLoc = gl.getUniformLocation(program, 'modelView');
    var colorLoc = gl.getUniformLocation(program, 'vColor');

    function addElement(element) {
        console.log('Adding:', element.__proto__.constructor.name, element);
        elements.push(element);

        gl.useProgram(program);

        var points = element.points;

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    }

    function setColor(color) {
        gridColor = color;
    }

    function renderElems(settings, attribs) {
        if(elements.length === 0) {
            return;
        }

        gl.useProgram(program);

        bindBuffers();

        gl.uniformMatrix4fv(modelViewLoc, false, flatten(attribs.modelView));
        gl.uniformMatrix4fv(projectionLoc, false, flatten(attribs.projection));
        gl.uniform4fv(colorLoc, flatten(gridColor));


        var offset = 0;
        elements.forEach(function (platform) {
            gl.drawArrays(gl.LINES, offset, platform.points.length);
            offset += platform.points.length;
        });
    }

    return {
        render: renderElems,
        addElement: addElement,
        setColor: setColor
    }
}