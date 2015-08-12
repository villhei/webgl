function Sphere(radius, bands) {
    Drawable.call(this);
    if (!isFinite(radius)) {
        throw "Invalid radius: " + radius;
    }
    if (!isFinite(bands)) {
        throw "Invalid band value: " + bands;
    }

    var lonBands = bands;

    var vertices = [];
    var normals = [];

    var t = (radius + Math.sqrt(radius)) / 2.0;

    vertices.push(vec4(-radius, t, 0, 1)); // 0
    vertices.push(vec4(radius, t, 0, 1));
    vertices.push(vec4(-radius, -t, 0, 1));
    vertices.push(vec4(radius, -t, 0, 1));

    vertices.push(vec4(0, -radius, t, 1)); // 4
    vertices.push(vec4(0, radius, t, 1));
    vertices.push(vec4(0, -radius, -t, 1));
    vertices.push(vec4(0, radius, -t, 1));

    vertices.push(vec4(t, 0, -radius, 1)); // 8
    vertices.push(vec4(t, 0, radius, 1));
    vertices.push(vec4(-t, 0, -radius, 1));
    vertices.push(vec4(-t, 0, radius, 1));

    function indices(a, b, c) {
        return [vertices[a], vertices[b], vertices[c]];
    }

    var faces = [
        indices(0, 11, 5),
        indices(0, 5, 1),
        indices(0, 1, 7),
        indices(0, 7, 10),
        indices(0, 10, 11),

        indices(1, 5, 9),
        indices(5, 11, 4),
        indices(11, 10, 2),
        indices(10, 7, 6),
        indices(7, 1, 8),

        indices(3, 9, 4),
        indices(3, 4, 2),
        indices(3, 2, 6),
        indices(3, 6, 8),
        indices(3, 8, 9),

        indices(4, 9, 5),
        indices(2, 4, 11),
        indices(6, 2, 10),
        indices(8, 6, 7),
        indices(9, 8, 1)
    ];


    this.points = faces.reduce(utils.concat, []);
    this.normals = this.points;
}

Sphere.prototype = new MovableDrawable();
Sphere.prototype.constructor = Sphere;
Sphere.constructor = MovableDrawable.prototype.constructor;

function SphereRenderer(program, gl) {
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

    function addElement(sphere) {
        gl.useProgram(program);

        bindBuffers();

        console.log('Adding:', sphere.__proto__.constructor.name, sphere);
        elements.push(sphere);

        var points = elements.reduce(function (acc, sphere) {
            return acc.concat(sphere.points);
        }, []);

        var normals = elements.reduce(function (acc, sphere) {
            return acc.concat(sphere.normals);
        }, []);


        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    }

    function renderSpheres(sceneAttribs) {
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

        elements.forEach(function (sphere) {

            var ambientProduct = mult(light.ambient, sphere.material.ambient);
            var diffuseProduct = mult(light.diffuse, sphere.material.diffuse);
            var specularProduct = mult(light.specular, sphere.material.specular);

            gl.uniform4fv(uniforms.diffuseLoc, flatten(diffuseProduct));
            gl.uniform4fv(uniforms.ambientLoc, flatten(ambientProduct));
            gl.uniform4fv(uniforms.specularLoc, flatten(specularProduct));
            gl.uniform1f(uniforms.shininessLoc, sphere.material.shininess);

            gl.uniform4fv(uniforms.screenPosition, flatten(sphere.position()));
            gl.uniform3fv(uniforms.theta, flatten(sphere.rotation()));

            gl.drawArrays(gl.TRIANGLES, offset, sphere.points.length);

            if (settings.gl.wireFrame) {
                gl.uniform1f(uniforms.wireFrame, 1);
                gl.lineWidth(2);
                gl.drawArrays(gl.LINE_STRIP, offset, sphere.points.length);
                gl.lineWidth(1);
                gl.uniform1f(uniforms.wireFrame, 0);
            }
            offset += sphere.points.length;

        });
    }

    return {
        render: renderSpheres,
        addElement: addElement
    }
}