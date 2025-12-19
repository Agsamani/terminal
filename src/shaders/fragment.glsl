varying vec2 vUv;
uniform float uTime;

void main() {
  // Creating a "unique" flowing color effect based on UVs and time
  vec3 color = 0.5 + 0.5 * cos(uTime + vUv.xyx + vec3(0, 2, 4));
  gl_FragColor = vec4(color, 1.0);
}
