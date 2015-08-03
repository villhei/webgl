"use strict";

var gl;
var projection;

var MAX_VERTICES = 8092;

var COLORS = {
    black: vec4(0.0, 0.0, 0.0, 1.0),  // black
    red: vec4(1.0, 0.0, 0.0, 1.0),  // red
    yellow: vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    green: vec4(0.0, 1.0, 0.0, 1.0),  // green
    blue: vec4(0.0, 0.0, 1.0, 1.0),  // blue
    magenta: vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    cyan: vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    white: vec4(1.0, 1.0, 1.0, 1.0)   // white
};

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

    cube.position(vec4(0, 0.375, 0, 1));
    cube2.position(vec4(1, 0.375, 0, 1));
    cube3.position(vec4(-1, 0.375, 0, 1));
    cyl.position(vec4(0, 2, 0, 1));

    var cubeRenderer = new CubeRenderer(program, gl);
    var gridRenderer = new GridRenderer(gridShader, gl);
    var cylinderRenderer = new CylinderRenderer(program, gl);
    var particleRenderer = new ParticleRenderer(particleShader, gl);

    cubeRenderer.addElement(cube);
    cubeRenderer.addElement(cube2);
    cubeRenderer.addElement(cube3);

    gridRenderer.addElement(grid);
    gridRenderer.setColor(COLORS.white);

    // cylinderRenderer.addElement(cyl)

    var particles = [];
    for (var x = -100; x < 101; ++x) {
        for (var y = -100; y < 101; ++y) {
            var nx = x / 100;
            var ny = y / 100;
            var nz = Math.random() * 2 - 1;
            particles.push(vec4(nx, ny, nz, 1.0));
        }
    }
    particleRenderer.addElements(particles);

    var attribs = {
        projection: projectionLoc,
        modelView: modelViewLoc

    };

    function animate(sceneAttribs) {

        requestAnimFrame(function () {
            render(gl, [gridRenderer, particleRenderer, cylinderRenderer, cubeRenderer], attribs, sceneAttribs);
            var incrementedRotation = sceneAttribs.objectRotation.map(function (i) {
                return i + 0.9;
            });
            sceneAttribs.objectRotation = incrementedRotation;
            sceneAttribs.cameraRotation += 0.1;
            animate(sceneAttribs, {

            });
        });
    }

    animate({
        objectRotation: [0, 0, 0],
        cameraRotation: 0
    });
};

function render(gl, renderers, uniforms, sceneAttribs) {

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
        renderer.render(sceneAttribs.objectRotation, {
            modelView: modelView,
            projection: projection,
            light: roofLight
        });
    });

}