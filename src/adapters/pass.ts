import { PassOptions, LiquidGlassPassInstance } from '../types';
import { LiquidGlassPass } from '../webgl/LiquidGlassPass';

export function createLiquidGlassPass(gl: WebGLRenderingContext, _options?: PassOptions): LiquidGlassPassInstance {
  const pass = new LiquidGlassPass(gl);
  return pass;
}
