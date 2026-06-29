export class TextureSource {
  private gl: WebGLRenderingContext;
  private texture: WebGLTexture;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    const tex = gl.createTexture();
    if (!tex) throw new Error('Could not create texture');
    this.texture = tex;

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  update(source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    // Flip Y because DOM is top-down, WebGL is bottom-up
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  getTexture(): WebGLTexture {
    return this.texture;
  }

  destroy() {
    this.gl.deleteTexture(this.texture);
  }
}
