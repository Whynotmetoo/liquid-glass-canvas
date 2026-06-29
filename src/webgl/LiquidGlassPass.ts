import { RenderPassOptions } from '../types';
import { createProgram } from './createProgram';
import { createQuad, Quad } from './createQuad';
import { vertexShader } from '../shaders/liquidGlass.vert';
import { fragmentShader } from '../shaders/liquidGlass.frag';

export class LiquidGlassPass {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private quad: Quad;

  private locations: {
    u_source: WebGLUniformLocation | null;
    u_resolution: WebGLUniformLocation | null;
    u_lensRect: WebGLUniformLocation | null;
    u_lensParams1: WebGLUniformLocation | null;
    u_lensParams2: WebGLUniformLocation | null;
    u_lensTint: WebGLUniformLocation | null;
  };

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.program = createProgram(gl, vertexShader, fragmentShader);
    this.quad = createQuad(gl, this.program);

    this.locations = {
      u_source: gl.getUniformLocation(this.program, 'u_source'),
      u_resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      u_lensRect: gl.getUniformLocation(this.program, 'u_lensRect'),
      u_lensParams1: gl.getUniformLocation(this.program, 'u_lensParams1'),
      u_lensParams2: gl.getUniformLocation(this.program, 'u_lensParams2'),
      u_lensTint: gl.getUniformLocation(this.program, 'u_lensTint'),
    };
  }

  render(options: RenderPassOptions) {
    const gl = this.gl;
    
    gl.useProgram(this.program);
    gl.viewport(0, 0, options.resolution[0], options.resolution[1]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, options.sourceTexture);
    if (this.locations.u_source) gl.uniform1i(this.locations.u_source, 0);

    if (this.locations.u_resolution) {
      gl.uniform2f(this.locations.u_resolution, options.resolution[0], options.resolution[1]);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    for (const lens of options.lenses) {
      if (this.locations.u_lensRect) {
        gl.uniform4f(this.locations.u_lensRect, lens.x, lens.y, lens.width, lens.height);
      }
      if (this.locations.u_lensParams1) {
        gl.uniform4f(this.locations.u_lensParams1, lens.radius, lens.depth, lens.feather, lens.curve);
      }
      if (this.locations.u_lensParams2) {
        gl.uniform4f(this.locations.u_lensParams2, lens.chroma, lens.glint, 0, 0);
      }
      if (this.locations.u_lensTint) {
        gl.uniform4f(this.locations.u_lensTint, lens.tint[0], lens.tint[1], lens.tint[2], lens.tint[3]);
      }
      
      this.quad.draw();
    }

    gl.disable(gl.BLEND);
  }

  destroy() {
    this.quad.destroy();
    this.gl.deleteProgram(this.program);
  }
}
