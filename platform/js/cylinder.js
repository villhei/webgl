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

    function normalizePoints(a, b, c) {
        if (arguments.length != 3) {
            throw "Argument must be points of a triangle";
        }
        var t1 = subtract(a, b);
        var t2 = subtract(c, b);
        return vec4(normalize(vec3(cross(t2, t1))));
    }


    this.bottomNormals = trianglesOfFan(this.bottom).map(function (arr) {
        return normalizePoints(arr[0], arr[1], arr[2]);
    });
    this.topNormals = trianglesOfFan(this.top).map(function (arr) {
        return normalizePoints(arr[0], arr[1], arr[2]);
    });

    this.color = COLORS.white;
    this.material = materials.default;

}

Cylinder.prototype = new MovableDrawable();
Cylinder.prototype.constructor = Cylinder;
Cylinder.constructor = MovableDrawable.prototype.constructor;

function CylinderRenderer(program, gl) {
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

    function addElement(cylinder) {
        gl.useProgram(program);

        bindBuffers();

        console.log('Adding:', cylinder.__proto__.constructor.name, cylinder);
        elements.push(cylinder);

        var points = elements.reduce(function (acc, cyl) {
            return acc.concat(cyl.bottom.concat(cyl.top));
        }, []);

        var normals = elements.reduce(function (acc, cyl) {
            return acc.concat(cyl.bottomNormals.concat(cyl.topNormals));
        }, []);

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);


        gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    }

    function renderCylinders(sceneAttribs) {
        if (elements.length === 0) {
            return;
        }
        var light = sceneAttribs.light;

        gl.useProgram(program);

        bindBuffers();

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);

        var offset = 0;
        elements.forEach(function (cylinder) {

            var ambientProduct = mult(light.ambient, cylinder.material.ambient);
            var diffuseProduct = mult(light.diffuse, cylinder.material.diffuse);
            var specularProduct = mult(light.specular, cylinder.material.specular);

            gl.uniform4fv(uniforms.diffuseLoc, flatten(diffuseProduct));
            gl.uniform4fv(uniforms.ambientLoc, flatten(ambientProduct));
            gl.uniform4fv(uniforms.specularLoc, flatten(specularProduct));
            gl.uniform1f(uniforms.shininessLoc, cylinder.material.shininess);

            gl.uniform4fv(uniforms.screenPosition, flatten(cylinder.position()));
            gl.uniform3fv(uniforms.theta, flatten(cylinder.rotation()));

            gl.drawArrays(gl.TRIANGLE_FAN, offset, cylinder.bottom.length);
            gl.drawArrays(gl.TRIANGLE_FAN, offset + cylinder.bottom.length, cylinder.top.length);

            if(settings.gl.wireFrame) {
                gl.uniform1f(uniforms.wireFrame, 1);
                gl.lineWidth(2);
                gl.drawArrays(gl.LINE_STRIP, offset, cylinder.bottom.length);
                gl.drawArrays(gl.LINELOOP, offset + cylinder.bottom.length, cylinder.top.length);
                gl.lineWidth(1);
                gl.uniform1f(uniforms.wireFrame, 0);
            }

            offset += cylinder.bottom.length + cylinder.top.length;
        });
    }

    return {
        render: renderCylinders,
        addElement: addElement
    }
}