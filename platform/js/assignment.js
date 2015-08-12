"use strict";

var gl;
var gui;

var MAX_VERTICES = 8092;
var log = new Logger(1000);
var renderCount = 0;

function initDat() {
    gui = new dat.GUI();

    var gl = gui.addFolder('gl');
    gl.add(settings.gl, 'depthTest');
    gl.add(settings.gl, 'wireFrame');
    gl.open();

    var camera = gui.addFolder('camera');
    camera.add(settings.camera, 'rotation', -1.5, 1.5);
    camera.add(settings.camera, 'height', -4, 4);
    camera.add(settings.camera, 'fov', 30, 120);
    camera.open();

    var light = gui.addFolder('light');
    light.add(settings.light, 'x', -3, 3);
    light.add(settings.light, 'y', -3, 3);
    light.add(settings.light, 'z', -3, 3);
    light.open();
}

var settings = {
    camera: {
        rotation: 0.1,
        height: 2,
        fov: 45,
        verticalAngle: 45
    },
    light: {
        x: 1,
        y: 1,
        z: 2
    },
    gl: {
        near: 0.1,
        far: 100,
        depthTest: false,
        wireFrame: false
    },
    window: {
        width: 640,
        height: 480
    }
};

function resizeCanvas() {
    var container = $('#webgl-container')[0];
    var canvas = $('#webgl-canvas')[0];
    canvas.width = container.clientWidth || settings.width.width;
    canvas.height = window.innerHeight || settings.width.height;

    settings.window = {
        width: canvas.width,
        height: canvas.height
    }
}

function createTextureFromCanvas(canvas) {
    var texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); // This is the important line!
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}

window.onload = function init() {
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('resize', setViewPort);
    writeText();
    initDat();
    var canvas = $('#webgl-canvas')[0];
    var textCanvas = $('#2d-canvas')[0];

    resizeCanvas();

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert('WebGL isn\'t available');
    }
    //
    //  Configure WebGL
    //
    var cc = COLORS.black;

    function setViewPort() {
        gl.viewport(0, 0, settings.window.width, settings.window.height);
    }

    setViewPort();

    gl.clearColor(cc[0], cc[1], cc[2], cc[3]);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    var gridShader = initShaders(gl, 'grid-vshader', 'grid-fshader');
    var particleShader = initShaders(gl, 'particle-vshader', 'particle-fshader');

    var grid = new Grid(vec4(-1, 0, -1), vec4(1, 0, 1), 8);

    var cube = new Cube(0.5, 0.5, 0.5);
    var cube2 = new Cube(0.5, 0.5, 0.5);
    var cube3 = new Cube(0.25, 0.25, 0.25);

    var cyl = new Cylinder(0.75, 0.75, 20);

    var sphere = new Sphere(0.25, 6);
    sphere.position(vec4(0, 0.5, 0, 1));

    var fontTexture = createTextureFromCanvas(textCanvas);

    cube.position(vec4(0.5, 0.5, 0.5, 1));
    cube2.position(vec4(-0.75, 0.25, -0.75, 1));
    cube3.position(vec4(0.5, 0.25, -0.5));

    cyl.position(vec4(-0.5, 0.375, 0.5, 1));

    cube.movement(vec3(0, 0.01, 0));
    cube.acceleration(vec3(0, -0.0003, 0));

    cube3.rotationSpeed(vec3(-0.25, -0.25, 0));
    cyl.rotationSpeed(vec3(0.25, -0.25, 0));

    var cubeRenderer = new CubeRenderer(program, gl);
    var gridRenderer = new GridRenderer(gridShader, gl);
    var sphereRenderer = new SphereRenderer(program, gl);
    var cylinderRenderer = new CylinderRenderer(program, gl);
    var particleRenderer = new ParticleRenderer(particleShader, gl);


    cubeRenderer.addElement(cube);
    cubeRenderer.addElement(cube2);
    cubeRenderer.addElement(cube3);
    cylinderRenderer.addElement(cyl);
    sphereRenderer.addElement(sphere);

    gridRenderer.addElement(grid);
    gridRenderer.setColor(COLORS.white);


    var renderers = {
        standard: [gridRenderer, cylinderRenderer, cubeRenderer, sphereRenderer],
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
            elements: [cube, cube2, cube3, cyl],
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
        var nx = -0.25 + 0.25 * Math.random();
        var nz = -0.25 + 0.25 * Math.random();
        var ny = 0.25 + 0.5 * Math.random();
        var particle = new Particle(vec4(nx, ny, nz, 1.0), 1400);
        var speed = 0.001;
        var rx = speed * Math.random() - speed / 2;
        var rz = speed * Math.random() - speed / 2;
        particle.movement(vec3(0, 0.015, 0));
        particle.acceleration(vec3(rx, -0.001, rz));
        model.particles.push(particle);
        particles.push(particle);
    }
    renderers.particles.addElements(particles);

    if (renderCount % 10) {
        renderers.particles.updateBuffers();
    }

    function updateElement(elem) {
        elem.update();

        if (elem.position()[1] < elem.sy / 2) {
            var movement = elem.movement();
            if (length(movement) < 0.00001) {
                elem.movement(vec3(0, 0, 0));
                elem.acceleration(vec3(0, 0, 0));
            } else {
                movement[1] = -(movement[1] / 2);
                elem.movement(movement);
                var accel = elem.acceleration();
                elem.acceleration(vec3(accel[0] / 2, accel[1] / 2, accel[2] / 2));
            }
        }
        addCubeTrail(elem);

    }

    function addCubeTrail(cube) {
        var particle_count = 320;
        var movement = cube.movement();
        if (length(movement) > 0.001 && renderCount % 10) {
            var cubePosition = cube.position();
            var offset = (cube.sx + cube.sy + cube.sz) / 3;

            var particles = [];
            for (var i = 0; i < particle_count; ++i) {

                var nx = cubePosition[0] + Math.random() * offset - (0.5 * offset);
                var ny = cubePosition[1] + Math.random() * offset - (0.5 * offset);
                var nz = cubePosition[2] + Math.random() * offset - (0.5 * offset);
                var particle = new Particle(vec4(nx, ny, nz, 1.0), 500);
                var speed = 0.00001;
                var rx = speed * Math.random() - (speed / 2);
                var ry = speed * Math.random() - (speed / 2);
                var rz = speed * Math.random() - (speed / 2);
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

    var roofLight = new PointLight(vec4(settings.light.x, -settings.light.y, settings.light.z, 1.0));
    var projection = perspective(settings.camera.fov, settings.window.width / settings.window.height, settings.gl.near, settings.gl.far);

    var radius = 3;
    var theta = radians(sceneAttribs.cameraRotation), phi = radians(0);
    var eye = vec3(
        radius * Math.sin(theta) * Math.cos(phi),
        settings.camera.height + radius * Math.sin(theta) * Math.sin(phi),
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

    renderCount++;
    log.registerFrame();
}