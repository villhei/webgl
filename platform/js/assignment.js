"use strict";

var gl;
var projection;
var gui;

var MAX_VERTICES = 8092;
var log = new Logger(1000);

function initDat() {
    gui = new dat.GUI();
    gui.add(settings.gl, 'depthTest');
    gui.add(settings.camera, 'rotation', -1.5, 1.5);
}

var settings = {
    camera: {
        rotation: 0.1,
        verticalAngle: 45
    },
    gl: {
        depthTest: true
    }
};

window.onload = function init() {

    var canvas = $('#webgl-canvas')[0];
    initDat();

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
    //cube3.rotationSpeed(vec3(-5, -5, 0));

    var cubeRenderer = new CubeRenderer(program, gl);
    var gridRenderer = new GridRenderer(gridShader, gl);
    var cylinderRenderer = new CylinderRenderer(program, gl);
    var particleRenderer = new ParticleRenderer(particleShader, gl);


    cubeRenderer.addElement(cube);
    cubeRenderer.addElement(cube2);
    cubeRenderer.addElement(cube3);

    gridRenderer.addElement(grid);
    gridRenderer.setColor(COLORS.white);


    var renderers = {
        standard: [gridRenderer, cylinderRenderer, cubeRenderer],
        particles: particleRenderer
    };

    function animate(model, sceneAttribs) {
        render(gl, renderers, sceneAttribs);
        var incrementedRotation = sceneAttribs.objectRotation.map(function (i) {
            return i + 0.9;
        });
        sceneAttribs.objectRotation = incrementedRotation;
        sceneAttribs.cameraRotation += settings.camera.rotation;

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
    model.elements.forEach(updateElement);

    var timeNow = new Date().valueOf();

    model.particles = model.particles.filter(function (elem) {
        return elem.isAlive(timeNow);
    });

    model.particles.forEach(function (elem) {
        elem.update();
    });


    var particleCount = 0;
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
    renderers.particles.addElements(particles);

    renderers.particles.updateBuffers();

    function updateElement(elem) {
        addCubeTrail(elem);
        elem.update();
        if (elem.position()[1] < elem.sy / 2) {
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

    function addCubeTrail(cube) {
        var particle_count = 80;
        var movement = cube.movement();
        if (length(movement) > 0.0001) {
            var cubePosition = cube.position();
            var offset = (cube.sx + cube.sy + cube.sz) / 3;
            var particles = [];
            for (var i = 0; i < particle_count; ++i) {

                var nx = cubePosition[0] + Math.random() * offset - offset / 2;
                var ny = cubePosition[1] + Math.random() * offset - offset / 2;
                var nz = cubePosition[2] + Math.random() * offset - offset / 2;

                var particle = new Particle(vec4(nx, ny, nz, 1.0), 2500);
                var speed = 0.001;
                var rx = speed * Math.random() - speed / 2;
                var ry = speed * Math.random() - speed / 2;
                var rz = speed * Math.random() - speed / 2;
                //particle.acceleration(rx, rz, ry);
                particles.push(particle);
                model.particles.push(particle);

            }
            renderers.particles.addElements(particles);
        }
    }
}

function render(gl, renderers, sceneAttribs) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (settings.gl.depthTest) {
        gl.enable(gl.DEPTH_TEST);
    } else {
        gl.disable(gl.DEPTH_TEST);
    }

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

    renderers.standard.forEach(runRenderer);
    runRenderer(renderers.particles);

    function runRenderer(renderer) {
        renderer.render({
            modelView: modelView,
            projection: projection,
            light: roofLight
        });
    }

    log.registerFrame();
}