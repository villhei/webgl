function Cube(sx, sy, sz) {
    Drawable.call(this);
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
        vec4(-x, -y, z, w),
        vec4(-x, y, z, w),
        vec4(x, y, z, w),
        vec4(x, -y, z, w),
        vec4(-x, -y, -z, w),
        vec4(-x, y, -z, w),
        vec4(x, y, -z, w),
        vec4(x, -y, -z, w)
    ];

    // Back, Right, Bottom, Top, Front, Left
    var sides = [
        utils.quad(vertices, 0, 3, 2, 1),
        utils.quad(vertices, 2, 3, 7, 6),
        utils.quad(vertices, 0, 4, 7, 3),
        utils.quad(vertices, 1, 2, 6, 5),
        utils.quad(vertices, 4, 5, 6, 7),
        utils.quad(vertices, 0, 1, 5, 4)
    ];

    this.points = sides.reduce(utils.concat, []);

    var normals = sides.map(function (side) {
        var a = side[0], b = side[1], c = side[2];
        var t1 = subtract(a, b);
        var t2 = subtract(c, b);
        var computedNormal = normalize(vec3(cross(t1, t2)));
        return side.map(function () {
            return vec4(computedNormal);
        });
    });

    this.normals = normals.reduce(utils.concat, []);
    this.sx = sx;
    this.sy = sy;
    this.sz = sz;
}

Cube.prototype = new MovableDrawable();
Cube.prototype.constructor = Cube;
Cube.constructor = MovableDrawable.prototype.constructor;

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
    var vNormal = gl.getAttribLocation(program, 'vNormal');
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

    function renderCubes(sceneAttribs) {
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
            var specularProduct = mult(light.specular, cube.material.specular);

            gl.uniform4fv(uniforms.diffuseLoc, flatten(diffuseProduct));
            gl.uniform4fv(uniforms.ambientLoc, flatten(ambientProduct));
            gl.uniform4fv(uniforms.specularLoc, flatten(specularProduct));
            gl.uniform1f(uniforms.shininessLoc, cube.material.shininess);

            gl.uniform4fv(uniforms.screenPosition, flatten(cube.position()));
            gl.uniform3fv(uniforms.theta, flatten(cube.rotation()));

            gl.drawArrays(gl.TRIANGLES, offset, cube.points.length);

            if (settings.gl.wireFrame) {
                gl.uniform1f(uniforms.wireFrame, 1);
                gl.lineWidth(2);
                var triangles = 12;
                for (var i = 0; i < triangles; i++) {
                    gl.drawArrays(gl.LINE_LOOP, offset + i * 3, 3);
                }
                gl.lineWidth(1);
                gl.uniform1f(uniforms.wireFrame, 0);
            }
            offset += cube.points.length;

        });
    }

    return {
        render: renderCubes,
        addElement: addElement
    }
}