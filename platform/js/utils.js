var utils = (function () {
    return {
        concat: function concat(acc, arr) {
            return acc.concat(arr);
        },
        get: function getKey(key) {
            return function (obj) {
                if (typeof obj[key] === 'function') {
                    return obj[key].apply(obj);
                }
                else if (!obj[key]) {
                    throw 'Object ' + obj + ' is missing the key ' + key;
                }
                return obj[key];
            }
        },
        sum: function sum(arr) {
            function add(acc, elem) {
                if (!isFinite(elem)) {
                    throw 'Expected a number, instead received', elem;
                }
                return acc + elem;
            }

            return arr.reduce(add, 0);
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
                wireFrame: gl.getUniformLocation(program, 'wireFrame'),
                theta: gl.getUniformLocation(program, 'theta')
            };
        }
    };
})();

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

function Logger(updateFreq) {

    var lastCount = 0;
    var frameCount = 0;
    var updateInterval = updateFreq || 1000;
    var lastUpdate = 0;

    var logMessages = {};

    function handleLoggers() {
        for(var key in logMessages) {
            console.log('* ' + key + ' : ' + logMessages[key]);
            delete logMessages[key];
        }

    }

    setInterval(function() {
        var timeNow = new Date().valueOf();
        var frameDelta = frameCount - lastCount;
        var timeDelta = timeNow - lastUpdate;
        var fps = frameDelta / (timeDelta / updateInterval);
        console.log('** RENDERING at ' + fps.toFixed(2) + ' FPS');
        lastCount = frameCount;
        lastUpdate = timeNow;
        handleLoggers();

    }, updateInterval);

    this.log = function(logger, message) {
        logMessages[logger] = message;
    };

    this.registerFrame = function() {
        frameCount++;
    }

}