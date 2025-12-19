varying vec2 vUv;
uniform float uTime;

void main() {
  vUv = uv;
  vec3 newPosition = position;
  
  // A simple wave displacement logic
  newPosition.z += sin(position.x * 5.0 + uTime) * 0.1;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
