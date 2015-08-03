var utils = (function () {
    return {
        concat: function (acc, arr) {
            return acc.concat(arr);
        },
        getUniformLocations: function (program) {
            return { projectionLoc: gl.getUniformLocation(program, 'projection'),
                modelViewLoc: gl.getUniformLocation(program, 'modelView'),
                lightPositionLoc: gl.getUniformLocation(program, 'lightPosition'),
                ambientLoc: gl.getUniformLocation(program, 'ambientProduct'),
                diffuseLoc: gl.getUniformLocation(program, 'diffuseProduct'),
                specularLoc: gl.getUniformLocation(program, 'specularProduct'),
                shininessLoc: gl.getUniformLocation(program, 'shininess'),
                screenPosition: gl.getUniformLocation(program, 'screenPosition'),
                theta: gl.getUniformLocation(program, 'theta')
            };
        }
    };
})();