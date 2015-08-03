function ParticleRenderer(program, gl) {

    function bindBuffers() {
        /** Position buffer **/
        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        /** Colors buffer **/
        gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);
    }

    gl.useProgram(program);

    var vPosition = gl.getAttribLocation(program, 'vPosition');
    var vColor = gl.getAttribLocation(program, 'vColor');
    var elements = [];

    var pointsBuffer = gl.createBuffer();
    var colorsBuffer = gl.createBuffer();

    bindBuffers();

    var uniforms = {
        projectionLoc: gl.getUniformLocation(program, 'projection'),
        modelViewLoc: gl.getUniformLocation(program, 'modelView')
    };

    function addElements(elementArray) {
        gl.useProgram(program);

        bindBuffers();

        elements = elements.concat(elementArray);

        console.log('Added particles: ', elements.length);
        var colors = elements.map(function () {
            return COLORS.white;
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(elements), gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW);

    }

    function renderParticles(rotation, sceneAttribs) {
        gl.useProgram(program);
        if (elements.length === 0) {
            return;
        }

        bindBuffers();

        var light = sceneAttribs.light;
        gl.uniformMatrix4fv(uniforms.modelViewLoc, false, flatten(sceneAttribs.modelView));
        gl.uniformMatrix4fv(uniforms.projectionLoc, false, flatten(sceneAttribs.projection));
        gl.uniform4fv(uniforms.lightPositionLoc, flatten(light.position));

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.drawArrays(gl.POINTS, 0, elements.length);
    }

    return {
        render: renderParticles,
        addElements: addElements
    };
}