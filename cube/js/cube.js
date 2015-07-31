function Cube(sx, sy, sz) {
    if(!isFinite(sx)) {
        throw "Invalid size x: " + sx;
    }
    if(!isFinite(sy)) {
        throw "Invalid size y: " + sy;
    }
    if(!isFinite(sz)) {
        throw "Invalid size z: " + sz;
    }
    var x = sx * 0.5, y = sy * 0.5, z = sz * 0.5, w = 1.0;
    var vertices = [
        vec4( -x, -y,  z, 1.0 ),
        vec4( -x,  y,  z, 1.0 ),
        vec4(  x,  y,  z, 1.0 ),
        vec4(  x, -y,  z, 1.0 ),
        vec4( -x, -y, -z, 1.0 ),
        vec4( -x,  y, -z, 1.0 ),
        vec4(  x,  y, -z, 1.0 ),
        vec4(  x, -y, -z, 1.0 )
    ];
    function quad(a, b, c, d) {

        // We need to parition the quad into two triangles in order for
        // WebGL to be able to render it.  In this case, we create two
        // triangles from the quad indices

        //vertex color assigned by the index of the vertex

        return [ vertices[a], vertices[b], vertices[c], vertices[a], vertices[c], vertices[d] ];
    }

    this.position = function(position) {
        if(arguments.length == 0) {
            return cubePosition;
        } else {
            if(position.length < 4) {
                throw "Malformed position arguments: " + position;
            } else {
                console.log('Positioning cube to ', position);
                cubePosition = position;
            }
        }
    };

    var back = quad(1, 0, 3, 2);
    var right = quad(2, 3, 7, 6);
    var bottom = quad(3, 0, 4, 7);
    var top = quad(6, 5, 1, 2);
    var front = quad(4, 5, 6, 7);
    var left = quad(5, 4, 0, 1);

    var cubePosition = vec4(0.0, 0, 0, 1);

    this.points = back.concat(front, left, right, bottom, top);

}

function CubeRenderer(program, gl) {

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


    function addElement(cube) {
        console.log('Adding:', cube.__proto__.constructor.name, cube);
        elements.push(cube);

        var points = elements.reduce(function (acc, cube) {
            return acc.concat(cube.points);
        }, []);

        var actualColors = points.map(function (point, index) {
            return colors[index % colors.length];
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(actualColors), gl.STATIC_DRAW);
    }

    function renderCubes() {
        if(elements.length === 0) {
            return;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);

        var offset = 0;
        elements.forEach(function (cube) {

            gl.uniform4fv(screenPosition, flatten(cube.position()));
            gl.drawArrays(gl.TRIANGLES, offset, cube.points.length);
            offset += cube.points.length;
        });
    }

    return {
        render: renderCubes,
        addElement: addElement
    }
}