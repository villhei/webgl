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
    if(this.isMovable) {
        this.movement(add(this.movementVector, this.accelerationVector));
        var newPos = add(this.position(), vec4(this.movement()));
        this.position(vec4(newPos[0], newPos[1], newPos[2], 1));

    }
    if(this.isRotational) {
        this.rotationSpeed(add(this.rotationSpeedVector, this.rotationAccelerationVector));
        this.rotation(add(this.rotation(), this.rotationSpeedVector));
    }
};

MovableDrawable.prototype.rotationSpeed = function(rotation) {
    if(arguments.length === 0) {
        return this.rotationSpeedVector;
    } else {
        if(rotation.length < 3) {
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