const fragmentShader = `
precision mediump float;
uniform float uRippleElapsed;
varying vec2 vUv;

float ripple(vec2 uv, float t) {
  float dist = distance(uv, vec2(0.5));
  float wave = sin((dist - t * 0.4) * 30.0); // slower ripple
  float envelope = exp(-5.0 * dist);         // fade outward
  return wave * envelope;
}

void main() {
  if (uRippleElapsed < 0.0) {
    discard; // fully transparent when inactive
  }

  float r = ripple(vUv, uRippleElapsed);
  float edge = 1.0 - smoothstep(0.005, 0.01, abs(r)); // sharp ring only

  vec3 color = vec3(edge);
  float alpha = edge;
  gl_FragColor = vec4(color, alpha);
}
`;

export default fragmentShader;
