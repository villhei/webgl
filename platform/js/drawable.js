function Drawable() {
    this.elementPosition = vec4(0, 0, 0, 1);
    this.elementRotation = vec3(0, 0, 0);
    this.color = COLORS.white;
    this.material = materials.default;
    this.isDrawable = true;
}

Drawable.prototype.rotation = function (rotation) {
    if (arguments.length == 0) {
        return this.elementRotation;
    } else {
        if (rotation.length < 3) {
            throw "Malformed rotation arguments: " + rotation;
        } else {
            this.elementRotation = rotation;
        }
    }
};

Drawable.prototype.position = function (position) {
    if (arguments.length === 0) {
        var pos = this.elementPosition;
        if(isNaN(pos[0]) || isNaN(pos[1]) || isNaN(pos[2])) {
            debugger;
            throw "Problem with position" + this.elementPosition;
        }
        return this.elementPosition;
    } else {
        if (position.length < 4) {
            throw "Malformed position arguments: " + position;
        } else {
            this.elementPosition = position;
        }
    }
};

function MovableDrawable() {
    Drawable.call(this);
    this.movementVector = vec3(0, 0, 0);
    this.accelerationVector = vec3(0, 0, 0);
    this.rotationSpeedVector = vec3(0, 0, 0);
    this.rotationAccelerationVector = vec3(0, 0, 0);
    this.isMovable = true;
    this.isRotational = true;
}

MovableDrawable.prototype = new Drawable();
MovableDrawable.prototype.constructor = MovableDrawable;
MovableDrawable.constructor = Drawable.prototype.constructor;

MovableDrawable.prototype.movement = function (movement) {
    if (arguments.length === 0) {
        return this.movementVector;
    } else {
        if (movement.length < 3) {
            throw "Malformed movement arguments: " + movement;
        } else {
            this.movementVector = movement;
        }
    }
};

MovableDrawable.prototype.acceleration = function (acceleration) {
    if (arguments.length === 0) {
        return this.accelerationVector;
    } else {
        if (acceleration.length < 3) {
            throw "Malformed acceleration arguments: " + acceleration;
        } else {
            this.accelerationVector = acceleration;
        }
    }
};


MovableDrawable.prototype.update = function () {
    if (this.isMovable) {
        for (var i = 0; i < 3; ++i) {
            this.movementVector[i] += this.accelerationVector[i];
            this.elementPosition[i] += this.movementVector[i];
        }
    }
    if (this.isRotational) {
        for (var i = 0; i < 3; ++i) {
            this.rotationSpeedVector[i] += this.rotationAccelerationVector[i];
            this.elementRotation[i] += this.rotationSpeedVector[i]
        }
    }
};

MovableDrawable.prototype.rotationSpeed = function (rotation) {
    if (arguments.length === 0) {
        return this.rotationSpeedVector;
    } else {
        if (rotation.length < 3) {
            throw 'Malformed rotation speed arguments: ' + rotation;
        } else {
            this.rotationSpeedVector = rotation;
        }
    }
};


MovableDrawable.prototype.rotationAcceleration = function (acceleration) {
    if (arguments.length === 0) {
        return this.rotationAccelerationVector;
    } else {
        if (acceleration.length < 3) {
            throw "Malformed acceleration arguments: " + acceleration;
        } else {
            this.rotationAccelerationVector = acceleration;
        }
    }
};