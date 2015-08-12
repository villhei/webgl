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
    for (var lat = 0; lat <= bands; lat++) {
        var theta = lat * Math.PI / bands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        for (var lon = 0; lon <= lonBands; lon++) {
            var phi = lon * 2 * Math.PI / bands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            normals.push(vec4(x, y, z, 1.0));
            vertices.push(vec4(radius * x, radius * y, radius * z, 1.0));
        }
    }
    for (var latNumber = 0; latNumber < bands; latNumber++) {
        for (var longNumber = 0; longNumber < lonBands; longNumber++) {
            
        }
    }

    var points = [];


    this.points = vertices;
    this.normals = normals;
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