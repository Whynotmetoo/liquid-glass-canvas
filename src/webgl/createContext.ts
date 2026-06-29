export function createContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  }) || canvas.getContext('experimental-webgl');

  if (!gl) {
    throw new Error('WebGL not supported');
  }

  return gl as WebGLRenderingContext;
}
