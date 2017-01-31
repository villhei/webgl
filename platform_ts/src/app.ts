import $ = require('jquery');

import shaderutils = require('./gl_utils/shaders');
import WebGLUtils = require('./gl_utils/setup');

$(() => {

  const canvas = $('#webgl-canvas');

  const canvasElem = <HTMLCanvasElement>canvas.get(0);

  const gl = WebGLUtils.setupWebGL(canvasElem);

    const cc = new Float32Array(4);

    [0.0, 0.0, 0.0, 1.0].forEach((n: number,i  :number) => cc[i] = n);

    function setViewPort(): void {
        gl.viewport(0, 0, 512, 512);
    }

    setViewPort();

    gl.clearColor(cc[0], cc[1], cc[2], cc[3]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
});