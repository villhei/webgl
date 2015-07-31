"use strict";

var gl;
var projection;

var MAX_VERTICES = 8092;
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
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");

    var projectionLoc = gl.getUniformLocation(program, 'projection');
    var modelViewLoc = gl.getUniformLocation(program, 'modelView');

    gl.useProgram(program);

    projection = perspective(45, canvas.width / canvas.height, 0.1, 100);

    var cylinder = new Cylinder(0.5, 0.75, 9);
    var cylinder2 = new Cylinder(0.4, 0.6, 3);

    cylinder.position(vec4(-0.75, 0., 0, 0));
    cylinder2.position(vec4(0, 0.75, 0, 0));

    var cylinderRenderer = new CylinderRenderer(program, gl);

    var cube = new Cube(0.75, 0.75, 0.75);
    var cube2 = new Cube(0.75, 0.75, 0.75);
    var cube3 = new Cube(0.75, 0.75, 0.75);


    cube2.position(vec4(2, 0, 0, 1));
    cube3.position(vec4(0, -2, 0, 1));

    var cubeRenderer = new CubeRenderer(program, gl);

    cubeRenderer.addElement(cube);
    cubeRenderer.addElement(cube2);
    cubeRenderer.addElement(cube3);

    cylinderRenderer.addElement(cylinder);
    cylinderRenderer.addElement(cylinder2);

    var attribs = {
        projection: projectionLoc,
        modelView: modelViewLoc

    };

    function animate(settings) {

        requestAnimFrame(function () {
            render(gl, [cylinderRenderer, cubeRenderer], attribs, settings);
            var incrementedRotation = settings.objectRotation.map(function (i) {
                return i + 0.5;
            });
            settings.objectRotation = incrementedRotation;
            settings.cameraRotation += 1;
            animate(settings);
        });
    }

    animate({
        objectRotation: [0, 0, 0],
        cameraRotation: 0
    });
};

function render(gl, renderers, attribs, settings) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var radius = 5;
    var theta = radians(settings.cameraRotation), phi = radians(45);
    var eye = vec3(
            radius * Math.sin(theta) * Math.cos(phi),
            radius * Math.sin(theta) * Math.sin(phi),
            radius * Math.cos(theta));

    var atPoint = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);

    var modelView = lookAt(eye, atPoint, up);

    gl.uniformMatrix4fv(attribs.modelView, false, flatten(modelView));
    gl.uniformMatrix4fv(attribs.projection, false, flatten(projection));

    renderers.forEach(function (renderer) {
        renderer.render();
    });

}