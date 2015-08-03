function Cube(sx, sy, sz) {
    if (!isFinite(sx)) {
        throw "Invalid size x: " + sx;
    }
    if (!isFinite(sy)) {
        throw "Invalid size y: " + sy;
    }
    if (!isFinite(sz)) {
        throw "Invalid size z: " + sz;
    }
    var x = sx * 0.5, y = sy * 0.5, z = sz * 0.5, w = 1.0;
    var vertices = [
        vec4(-x, -y, z, 1.0),
        vec4(-x, y, z, 1.0),
        vec4(x, y, z, 1.0),
        vec4(x, -y, z, 1.0),
        vec4(-x, -y, -z, 1.0),
        vec4(-x, y, -z, 1.0),
        vec4(x, y, -z, 1.0),
        vec4(x, -y, -z, 1.0)
    ];

    function quad(a, b, c, d) {

        // We need to parition the quad into two triangles in order for
        // WebGL to be able to render it.  In this case, we create two
        // triangles from the quad indices

        //vertex color assigned by the index of the vertex

        return [ vertices[a], vertices[b], vertices[c], vertices[a], vertices[c], vertices[d] ];
    }

    this.position = function (position) {
        if (arguments.length == 0) {
            return cubePosition;
        } else {
            if (position.length < 4) {
                throw "Malformed position arguments: " + position;
            } else {
                console.log('Positioning cube to ', position);
                cubePosition = position;
            }
        }
    };

    // Back, Right, Bottom, Top, Front, Left
    var sides = [
        quad(1, 0, 3, 2),
        quad(2, 3, 7, 6),
        quad(3, 0, 4, 7),
        quad(6, 5, 1, 2),
        quad(4, 5, 6, 7),
        quad(5, 4, 0, 1)
    ];

    var cubePosition = vec4(0.0, 0, 0, 1);

    this.points = sides.reduce(utils.concat, []);

    var normals = sides.map(function (side) {
        var a = side[0], b = side[1], c = side[2];
        var t1 = subtract(a, b);
        var t2 = subtract(c, b);
        var computedNormal = normalize(vec3(cross(t1, t2)));
        return side.map(function() {
            return vec4(computedNormal);
        });
    });

    this.normals = normals.reduce(utils.concat, []);
    this.color = COLORS.white;
    this.material = materials.default;

}


function CubeRenderer(program, gl) {

    function bindBuffers() {
        /** Position buffer **/
        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        /** Normals buffer **/
        gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
        gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);
    }

    gl.useProgram(program);

    var vPosition = gl.getAttribLocation(program, 'vPosition');
    var vNormal =   gl.getAttribLocation(program, 'vNormal');
    var elements = [];

    var pointsBuffer = gl.createBuffer();
    var normalsBuffer = gl.createBuffer();

    bindBuffers();

    var uniforms = utils.getUniformLocations(program);

    function addElement(cube) {
        gl.useProgram(program);

        bindBuffers();

        console.log('Adding:', cube.__proto__.constructor.name, cube);
        elements.push(cube);

        var points = elements.reduce(function (acc, cube) {
            return acc.concat(cube.points);
        }, []);

        var normals = elements.reduce(function (acc, cube) {
            return acc.concat(cube.normals);
        }, []);


        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    }

    function renderCubes(rotation, sceneAttribs) {
        gl.useProgram(program);
        if (elements.length === 0) {
            return;
        }

        bindBuffers();

        var light = sceneAttribs.light;

        gl.uniformMatrix4fv(uniforms.modelViewLoc, false, flatten(sceneAttribs.modelView));
        gl.uniformMatrix4fv(uniforms.projectionLoc, false, flatten(sceneAttribs.projection));
        gl.uniform4fv(uniforms.lightPositionLoc, flatten(light.position));

        var offset = 0;
        elements.forEach(function (cube) {

            var ambientProduct = mult(light.ambient, cube.material.ambient);
            var diffuseProduct = mult(light.diffuse, cube.material.diffuse);
            var specularProduct= mult(light.specular, cube.material.specular);

            gl.uniform4fv(uniforms.diffuseLoc, flatten(diffuseProduct));
            gl.uniform4fv(uniforms.ambientLoc, flatten(ambientProduct));
            gl.uniform4fv(uniforms.specularLoc, flatten(specularProduct));
            gl.uniform1f(uniforms.shininessLoc, cube.material.shininess);

            gl.uniform4fv(uniforms.screenPosition, flatten(cube.position()));
            gl.uniform3fv(uniforms.theta, flatten(rotation || [0, 0, 0]));

            gl.drawArrays(gl.TRIANGLES, offset, cube.points.length);
            offset += cube.points.length;
        });
    }

    return {
        render: renderCubes,
        addElement: addElement
    }
}