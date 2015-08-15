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
    var bottomEdges = [];
    var topEdges = [];
    for (var i = 0; i < divisions + 1; ++i) {
        var rotated = utils.rotate(referencePoint[0], referencePoint[1], angleIncrement * i);
        bottomEdges.push(vec4(rotated[0], -height / 2, rotated[1], 1.0));
        topEdges.push(vec4(rotated[0], height / 2, rotated[1], 1.0));
    }

    var sideFan = [];

    for (var i = 0; i < divisions; ++i) {
        if (i === divisions - 1) {
            sideFan.push(bottomEdges[i], bottomEdges[0], topEdges[i], topEdges[0]);
        } else {
            sideFan.push(bottomEdges[i], bottomEdges[i + 1], topEdges[i], topEdges[i + 1]);
        }
    }

    this.bottom = [bottomCenter].concat(bottomEdges);
    this.top = [topCenter].concat(topEdges);
    this.sides = sideFan;

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

    function trianglesOfStrip(arr) {
        if (arr.length < 3) {
            throw "Array must have at least 3 points, was: " + arr.length;
        }
        var triangles = [];
        for (var i = 0; i < arr.length; i++) {
            var beginFrom = 0;
            if (i === 0) {
                triangles.push([arr[i], arr[i + 1], arr[i + 2]]);
            } else if (i == 1) {
                triangles.push([arr[i - 1], arr[i], arr[i + 1]]);
            } else {
                triangles.push([arr[i - 2], arr[i - 1], arr[i]]);
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

    this.sideNormals = trianglesOfStrip(this.sides).map(function (arr) {
        return utils.normalizePoints(arr[0], arr[1], arr[2]);
    });
    console.log('side', this.sides.length);

    console.log('sideN', this.sideNormals.length);

    this.color = COLORS.white;
    this.material = materials.redPlastic;

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
            return acc.concat(cyl.bottom.concat(cyl.top).concat(cyl.sides));
        }, []);

        var normals = elements.reduce(function (acc, cyl) {
            return acc.concat(cyl.bottomNormals.concat(cyl.topNormals).concat(cyl.sideNormals));
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
            gl.drawArrays(gl.TRIANGLE_STRIP, offset + cylinder.bottom.length + cylinder.top.length, cylinder.sides.length);

            if (settings.gl.wireFrame) {
                gl.uniform1f(uniforms.wireFrame, 1);
                gl.lineWidth(2);
                gl.drawArrays(gl.LINE_STRIP, offset, cylinder.bottom.length);
                gl.drawArrays(gl.LINE_STRIP, offset + cylinder.bottom.length, cylinder.top.length);
                gl.drawArrays(gl.LINE_STRIP, offset + cylinder.bottom.length + cylinder.top.length, cylinder.sides.length);

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