import { CanvasLiquidGlassOptions, LiquidGlassInstance } from '../types';
import { LiquidGlassRenderer } from '../webgl/LiquidGlassRenderer';

export function createCanvasLiquidGlass(options: CanvasLiquidGlassOptions): LiquidGlassInstance {
  const renderer = new LiquidGlassRenderer(options);
  return renderer;
}
