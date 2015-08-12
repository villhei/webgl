function PointLight(position) {
    this.diffuse = vec4(0.3, 0.3, 0.3, 1.0);
    this.ambient = vec4(0.2, 0.2, 0.2, 1.0);
    this.specular = vec4(0.4, 0.4, 0.4, 1.0);
    this.position = position || vec4(0, 5, 0, 1.0);
}