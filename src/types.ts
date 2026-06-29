export interface LensOptions {
  radius?: number;
  depth?: number;
  feather?: number;
  curve?: number;
  chroma?: number;
  tint?: string | [number, number, number, number];
  glint?: number;
}

export interface RectLensDef {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  depth: number;
  feather: number;
  curve: number;
  chroma: number;
  tint: [number, number, number, number];
  glint: number;
}

export interface CanvasLiquidGlassOptions {
  source: HTMLCanvasElement;
  container: HTMLElement;
  dpr?: number | 'auto';
  quality?: 'auto' | 'high' | 'low';
}

export interface PassOptions {
  maxLenses?: number;
}

export interface RenderPassOptions {
  sourceTexture: WebGLTexture;
  resolution: [number, number];
  lenses: RectLensDef[];
}

export interface LiquidGlassInstance {
  registerLens(target: HTMLElement, options?: LensOptions): void;
  registerRectLens(rect: { x: number, y: number, width: number, height: number }, options?: LensOptions): symbol;
  unregisterLens(target: HTMLElement | symbol): void;
  updateLens(target: HTMLElement | symbol, options: Partial<LensOptions>): void;
  start(): void;
  tick(): void;
  stop(): void;
  destroy(): void;
}

export interface LiquidGlassPassInstance {
  render(options: RenderPassOptions): void;
  destroy(): void;
}
