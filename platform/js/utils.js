var utils = (function () {

    function rotateRadians(x, y, angle) {
        var sin = Math.sin(angle);
        var cos = Math.cos(angle);
        return vec2(x * cos - y * sin, x * sin + y * cos);
    }

    function divideTriangle(a, b, c, count) {
        if (count < 1) {
            return [a, b, c, 1];
        } else {

            //bisect the sides
            var ab = mix(a, b, 0.5);
            var ac = mix(a, c, 0.5);
            var bc = mix(b, c, 0.5);

            // four new triangles
            return divideTriangle(a, ab, ac, count - 1)
                .concat(divideTriangle(ac, bc, ab, count - 1))
                .concat(divideTriangle(ab, b, bc, count - 1))
                .concat(divideTriangle(bc, c, ac, count - 1));
        }
    }

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
        subdivide: divideTriangle,
        quad: function quad(vertices, a, b, c, d) {
            return [vertices[a], vertices[b], vertices[c], vertices[a], vertices[c], vertices[d]];
        },
        sum: function sum(arr) {
            function add(acc, elem) {
                if (!isFinite(elem)) {
                    throw 'Expected a number, instead received', elem;
                }
                return acc + elem;
            }

            return arr.reduce(add, 0);
        }, getMiddlePoint: function getMiddlePoint(a, b) {
            return vec4(
                (a[0] + b[0]) * 0.5,
                (a[1] + b[1]) * 0.5,
                (a[2] + b[2]) * 0.5, 1.0);
        },
        normalizePoints: function (a, b, c) {
            if (arguments.length != 3) {
                throw "Argument must be points of a triangle";
            }
            var t1 = subtract(a, b);
            var t2 = subtract(c, b);
            return vec4(normalize(vec3(cross(t1, t2))));
        },
        scalarMult: function scalarMult(factor) {
            if (!isFinite(factor)) {
                throw "Argument must be a number but was: " + factor;
            }
            return function (points) {
                if (!points.__proto__.map) {
                    console.warn(points);
                    throw "Expected something mappable but received " + typeof points;
                }
                return points.map(function (n) {
                    if (!isFinite(n)) {
                        throw "Was not a number " + n;
                    }
                    return n * factor;
                });
            }
        },
        getUniformLocations: function (program) {
            return {
                projectionLoc: gl.getUniformLocation(program, 'projection'),
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
        },
        rotate: function (x, y, angle) {
            return rotateRadians(x, y, radians(angle));
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
        for (var key in logMessages) {
            console.log('* ' + key + ' : ' + logMessages[key]);
            delete logMessages[key];
        }

    }

    setInterval(function () {
        var timeNow = new Date().valueOf();
        var frameDelta = frameCount - lastCount;
        var timeDelta = timeNow - lastUpdate;
        var fps = frameDelta / (timeDelta / updateInterval);
        console.log('** RENDERING at ' + fps.toFixed(2) + ' FPS');
        lastCount = frameCount;
        lastUpdate = timeNow;
        handleLoggers();

    }, updateInterval);

    this.log = function (logger, message) {
        logMessages[logger] = message;
    };

    this.registerFrame = function () {
        frameCount++;
    }

}