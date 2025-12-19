
varying vec2 vUv;

uniform sampler2D map;
uniform float curvature;
uniform float vignette;
uniform float time;

vec2 barrel(vec2 uv, float k) {
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  return uv + c * r2 * k;
}

void main() {
  vec2 uv = barrel(vUv, curvature);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

  vec4 col = texture2D(map, uv);

  vec2 d = vUv - 0.5;
  float v = smoothstep(0.85, 0.2, dot(d, d));
  col.rgb *= mix(1.0 - vignette, 1.0, v);

  float scan = sin((vUv.y * 900.0) + time * 5.0) * 0.5 + 0.5;
  col.rgb *= 0.92 + 0.08 * scan;

  gl_FragColor = col;
}
