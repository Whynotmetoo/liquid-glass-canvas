export const vertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  // flip Y since WebGL textures have origin at bottom-left, but DOM uses top-left
  // Actually, we'll handle the flip when we upload the texture via gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
