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
    var thetaLoc = gl.getUniformLocation(program, 'theta');
    var projectionLoc = gl.getUniformLocation(program, 'projection');
    var modelViewLoc = gl.getUniformLocation(program, 'modelView');

    gl.useProgram(program);

    projection = perspective(45, canvas.width / canvas.height, 0.1, 100);

    var cylinder = new Cylinder(0.5, 0.75, 9);
    var cylinder2 = new Cylinder(0.4, 0.6, 3);

    cylinder.position(vec4(-0.75, 0., 0, 0));
    cylinder2.position(vec4(-0.75, 0.75, 0, 0));

    var cylinderRenderer = new CylinderRenderer(program, gl);

    var cube = new Cube(0.75, 0.75, 0.75);
    var cube2 = new Cube(0.5, 0.5, 0.5);

    cube2.position(vec4(0.75, 0, 0, 1));

    var cubeRenderer = new CubeRenderer(program, gl);

    cubeRenderer.addElement(cube);
    cubeRenderer.addElement(cube2);

    cylinderRenderer.addElement(cylinder);
    cylinderRenderer.addElement(cylinder2);

    var attribs = {
        theta: thetaLoc,
        projection: projectionLoc,
        modelView: modelViewLoc

    };

    function animate(rotationAxes) {

        requestAnimFrame(function () {
            render(gl, [cylinderRenderer, cubeRenderer], attribs, rotationAxes);
            var incrementedRotation = rotationAxes.map(function (i) {
                return i + 0.5;
            });
            animate(incrementedRotation);
        });
    }

    animate([0, 0, 0]);
};

function render(gl, renderers, attribs, rotation) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye = vec3(0, 0, 3);
    var atPoint = vec3(0, 0, 0);
    var up = vec3(0, 5, -5);
    
    var modelView = lookAt(eye, atPoint, up);

    gl.uniform3fv(attribs.theta, rotation);
    gl.uniformMatrix4fv(attribs.modelView, false, flatten(modelView));
    gl.uniformMatrix4fv(attribs.projection, false, flatten(projection));

    renderers.forEach(function (renderer) {
        renderer.render();
    });

}