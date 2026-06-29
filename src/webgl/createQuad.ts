export interface Quad {
  buffer: WebGLBuffer;
  vao: WebGLVertexArrayObjectOES | null;
  draw: () => void;
  destroy: () => void;
}

export function createQuad(gl: WebGLRenderingContext, program: WebGLProgram): Quad {
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]);

  const buffer = gl.createBuffer();
  if (!buffer) throw new Error('Could not create buffer');

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  // Use VAO if available
  const ext = gl.getExtension('OES_vertex_array_object');
  let vao: WebGLVertexArrayObjectOES | null = null;
  const positionLocation = gl.getAttribLocation(program, 'a_position');

  if (ext) {
    vao = ext.createVertexArrayOES();
    ext.bindVertexArrayOES(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    ext.bindVertexArrayOES(null);
  }

  const draw = () => {
    if (ext && vao) {
      ext.bindVertexArrayOES(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      ext.bindVertexArrayOES(null);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  };

  const destroy = () => {
    gl.deleteBuffer(buffer);
    if (ext && vao) ext.deleteVertexArrayOES(vao);
  };

  return { buffer, vao, draw, destroy };
}
