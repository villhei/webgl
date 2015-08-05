"use strict";

var gl;
var projection;

var MAX_VERTICES = 8092;
var log = new Logger(1000);

window.onload = function init() {

    var canvas = $('#webgl-canvas')[0];

    canvas.width = 800;
    canvas.height = 800;

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert('WebGL isn\'t available');
    }
    //
    //  Configure WebGL
    //
    var cc = COLORS.black;

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(cc[0], cc[1], cc[2], cc[3]);
    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    var gridShader = initShaders(gl, 'grid-vshader', 'grid-fshader');
    var particleShader = initShaders(gl, 'particle-vshader', 'particle-fshader');

    var projectionLoc = gl.getUniformLocation(program, 'projection');
    var modelViewLoc = gl.getUniformLocation(program, 'modelView');

    projection = perspective(45, canvas.width / canvas.height, 0.1, 100);

    var grid = new Grid(vec4(-1, 0, -1), vec4(1, 0, 1), 10);

    var cube = new Cube(0.75, 0.75, 0.75);
    var cube2 = new Cube(0.75, 0.75, 0.75);
    var cube3 = new Cube(0.75, 0.75, 0.75);

    var cyl = new Cylinder(0.75, 0.75, 20);

    cube.position(vec4(-1, 0.375, -1, 1));
    cube2.position(vec4(1, 0.375, 0, 1));
    cube3.position(vec4(-1, 0.375, 0, 1));
    cyl.position(vec4(0, 2, 0, 1));

    cube.movement(vec3(0, 0.10, 0));
    cube2.movement(vec3(0, 0.12, 0, 0));
    cube.acceleration(vec3(0, -0.001, 0));
    cube2.acceleration(vec3(0, -0.001, 0));
    cube3.rotationSpeed(vec3(-5, -5, 0));

    var cubeRenderer = new CubeRenderer(program, gl);
    var gridRenderer = new GridRenderer(gridShader, gl);
    var cylinderRenderer = new CylinderRenderer(program, gl);
    var particleRenderer = new ParticleRenderer(particleShader, gl);


    cubeRenderer.addElement(cube);
    cubeRenderer.addElement(cube2);
    cubeRenderer.addElement(cube3);

    gridRenderer.addElement(grid);
    gridRenderer.setColor(COLORS.white);


    var renderers = [gridRenderer, particleRenderer, cylinderRenderer, cubeRenderer];

    function animate(model, sceneAttribs) {
        render(gl, renderers, sceneAttribs);
        var incrementedRotation = sceneAttribs.objectRotation.map(function (i) {
            return i + 0.9;
        });
        sceneAttribs.objectRotation = incrementedRotation;
        sceneAttribs.cameraRotation += 0.1;

        requestAnimFrame(function () {
            animate(model, sceneAttribs);
        });

        updateModel(model, renderers);
    }

    animate({
            elements: [cube, cube2, cube3],
            particles: []
        },
        {
            objectRotation: [0, 0, 0],
            cameraRotation: 0
        });
};

function updateModel(model, renderers) {
    model.elements.forEach(function (elem) {
        if (elem.isMovable) {
            elem.update();
            if (elem.position()[1] < 0) {
                var movement = elem.movement();
                if (length(movement) < 0.0005) {
                    elem.movement(vec3(0, 0, 0));
                    elem.acceleration(vec3(0, 0, 0));
                } else {
                    movement[1] = -(movement[1] / 2);
                    elem.movement(movement);
                }
            }
        }
    });

    model.particles.forEach(function (elem) {
        elem.update();
    });

    var timeNow = new Date().valueOf();

    model.particles = model.particles.filter(function (elem) {
        return elem.isAlive(timeNow);
    });

    var particleCount = 240;
    var particles = [];
    for (var i = 0; i < particleCount; ++i) {
        var nx = -0.25 + 0.5 * Math.random();
        var nz = -0.25 + 0.5 * Math.random();
        var ny = 0.25 + 0.5 * Math.random();
        var particle = new Particle(vec4(nx, ny, nz, 1.0), 1400);
        var speed = 0.001;
        var rx = speed * Math.random() - speed / 2;
        var rz = speed * Math.random() - speed / 2;
        particle.movement(vec3(0, 0.015, 0));
        particle.acceleration(vec3(rx, -0.0001, rz));
        model.particles.push(particle);
        particles.push(particle);
    }

    renderers.forEach(function (renderer) {
        if (renderer.updateBuffers !== undefined) {
            renderer.addElements(particles);
        }
    });
}

function render(gl, renderers, sceneAttribs) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    var roofLight = new PointLight(vec4(-5, 0, 0, 1.0));

    var radius = 3;
    var theta = radians(sceneAttribs.cameraRotation), phi = radians(0);
    var eye = vec3(
            radius * Math.sin(theta) * Math.cos(phi),
            2 + radius * Math.sin(theta) * Math.sin(phi),
            radius * Math.cos(theta));

    var atPoint = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);

    var modelView = lookAt(eye, atPoint, up);

    renderers.forEach(function (renderer) {
        renderer.render({
            modelView: modelView,
            projection: projection,
            light: roofLight
        });
    });

    log.registerFrame();
}