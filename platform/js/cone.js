function Cone(width, height, divisions) {
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
        var rotated = utils.rotate(referencePoint[0], referencePoint[1], angleIncrement * i);
        edges.push(vec4(rotated[0], -height / 2, rotated[1], 1.0));
    }

    edges.push(edges[0]);

    this.bottom = [bottomCenter].concat(edges);
    this.top = [topCenter].concat(edges);

    function trianglesOfFan(arr) {
        if (arr.length < 3) {
            throw "Array must have at least 3 points, was: " + arr.length;
        }
        var triangles = [];
        for (var i = 0; i < arr.length; ++i) {
            if (i === 0) {
                triangles.push([arr[0], arr[i + 1], arr[i + 2]]);
            } else if (i === arr.length - 1) {
                triangles.push([arr[i - 1], arr[i], arr[0]]);
            } else {
                triangles.push([arr[i - 1], arr[i], arr[i + 1]]);
            }
        }
        return triangles;
    }

    this.bottomNormals = trianglesOfFan(this.bottom).map(function (arr) {
        return utils.normalizePoints(arr[0], arr[1], arr[2]);
    });
    this.topNormals = trianglesOfFan(this.top).map(function (arr) {
        return utils.normalizePoints(arr[0], arr[1], arr[2]);
    });

    this.color = COLORS.white;
    this.material = materials.yellowPlastic;

}

Cone.prototype = new MovableDrawable();
Cone.prototype.constructor = Cone;
Cone.constructor = MovableDrawable.prototype.constructor;

function ConeRenderer(program, gl) {
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

    function addElement(cone) {
        gl.useProgram(program);

        bindBuffers();

        console.log('Adding:', cone.__proto__.constructor.name, cone);
        elements.push(cone);

        var points = elements.reduce(function (acc, cone) {
            return acc.concat(cone.bottom.concat(cone.top));
        }, []);

        var normals = elements.reduce(function (acc, cone) {
            return acc.concat(cone.bottomNormals.concat(cone.topNormals));
        }, []);

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);


        gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    }

    function renderCones(sceneAttribs) {
        if (elements.length === 0) {
            return;
        }
        var light = sceneAttribs.light;

        gl.useProgram(program);

        bindBuffers();

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);

        var offset = 0;
        elements.forEach(function (cone) {

            var ambientProduct = mult(light.ambient, cone.material.ambient);
            var diffuseProduct = mult(light.diffuse, cone.material.diffuse);
            var specularProduct = mult(light.specular, cone.material.specular);

            gl.uniform4fv(uniforms.diffuseLoc, flatten(diffuseProduct));
            gl.uniform4fv(uniforms.ambientLoc, flatten(ambientProduct));
            gl.uniform4fv(uniforms.specularLoc, flatten(specularProduct));
            gl.uniform1f(uniforms.shininessLoc, cone.material.shininess);

            gl.uniform4fv(uniforms.screenPosition, flatten(cone.position()));
            gl.uniform3fv(uniforms.theta, flatten(cone.rotation()));

            gl.drawArrays(gl.TRIANGLE_FAN, offset, cone.bottom.length);
            gl.drawArrays(gl.TRIANGLE_FAN, offset + cone.bottom.length, cone.top.length);

            if(settings.gl.wireFrame) {
                gl.uniform1f(uniforms.wireFrame, 1);
                gl.lineWidth(2);
                gl.drawArrays(gl.LINE_STRIP, offset, cone.bottom.length);
                gl.drawArrays(gl.LINELOOP, offset + cone.bottom.length, cone.top.length);
                gl.lineWidth(1);
                gl.uniform1f(uniforms.wireFrame, 0);
            }

            offset += cone.bottom.length + cone.top.length;
        });
    }

    return {
        render: renderCones,
        addElement: addElement
    }
}