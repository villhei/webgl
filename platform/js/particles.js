function Particle(position, lifeTime) {
    Drawable.call(this);
    this.position(position);
    this.isRotational = false;
    this.creationTime = new Date().valueOf();
    this.lifeTime = lifeTime || 0;
    this.isAlive = function(timeNow) {
        this.deleted = this.lifeTime !== 0 && (this.creationTime + this.lifeTime) < timeNow;
        return !this.deleted;
    };
    this.deleted = false;
}

Particle.prototype = new MovableDrawable();
Particle.prototype.constructor = Particle;
Particle.constructor = MovableDrawable.prototype.constructor;

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

    var drawRound = 0;
    var elements = [];

    var pointsBuffer = gl.createBuffer();
    var colorsBuffer = gl.createBuffer();

    bindBuffers();

    var uniforms = {
        projectionLoc: gl.getUniformLocation(program, 'projection'),
        modelViewLoc: gl.getUniformLocation(program, 'modelView')
    };

    function addElements(elementArray) {
        elements = elements.concat(elementArray);
        updateBuffers();
    }

    function updateBuffers() {
        gl.useProgram(program);
        bindBuffers();

        var colors = elements.map(utils.get('color'));

        // Remove dead particles
        elements = elements.filter(function(particle) {
            return !particle.deleted;
        });

        var positions = elements.map(utils.get('position'));

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW);

    }

    function renderParticles(sceneAttribs) {
        if (elements.length === 0) {
            return;
        }
        gl.useProgram(program);
        bindBuffers();
        log.log('particleRender', 'particles: ' + elements.length);

        var light = sceneAttribs.light;
        gl.uniformMatrix4fv(uniforms.modelViewLoc, false, flatten(sceneAttribs.modelView));
        gl.uniformMatrix4fv(uniforms.projectionLoc, false, flatten(sceneAttribs.projection));
        gl.uniform4fv(uniforms.lightPositionLoc, flatten(light.position));

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.drawArrays(gl.POINTS, 0, elements.length);
    }

    return {
        render: renderParticles,
        addElements: addElements,
        updateBuffers: updateBuffers
    };
}