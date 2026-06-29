import { CanvasLiquidGlassOptions, LensOptions } from '../types';
import { LensRegistry } from '../core/LensRegistry';
import { createContext } from './createContext';
import { TextureSource } from './TextureSource';
import { LiquidGlassPass } from './LiquidGlassPass';

export class LiquidGlassRenderer {
  private overlay: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private textureSource: TextureSource;
  private pass: LiquidGlassPass;
  private registry = new LensRegistry();
  
  private source: HTMLCanvasElement;
  private container: HTMLElement;
  private dpr: number | 'auto';
  private quality: 'auto' | 'high' | 'low';

  private rafId: number = 0;
  private isRunning: boolean = false;

  constructor(options: CanvasLiquidGlassOptions) {
    this.source = options.source;
    this.container = options.container;
    this.dpr = options.dpr || 'auto';
    this.quality = options.quality || 'auto';

    this.overlay = document.createElement('canvas');
    this.overlay.className = 'liquid-glass-overlay';
    
    // Default styling just in case CSS is not loaded
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.pointerEvents = 'none';
    
    // Ensure container is positioned
    const computed = getComputedStyle(this.container);
    if (computed.position === 'static') {
      this.container.style.position = 'relative';
    }

    this.container.appendChild(this.overlay);

    this.gl = createContext(this.overlay);
    this.textureSource = new TextureSource(this.gl);
    this.pass = new LiquidGlassPass(this.gl);

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  private getActiveQuality(): 'high' | 'low' {
    let q = this.quality;
    if (q === 'auto') {
      const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent);
      q = isMobile ? 'low' : 'high';
    }
    return q;
  }

  private resize() {
    const rect = this.container.getBoundingClientRect();
    const activeQuality = this.getActiveQuality();
    let dpr = this.dpr === 'auto' ? window.devicePixelRatio || 1 : (this.dpr as number);
    if (activeQuality === 'low') {
      dpr = Math.min(dpr, 1);
    } else {
      dpr = Math.min(dpr, 2);
    }
    
    this.overlay.width = rect.width * dpr;
    this.overlay.height = rect.height * dpr;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
  }

  registerLens(target: HTMLElement, options?: LensOptions) {
    this.registry.registerElement(target, options);
  }

  registerRectLens(rect: { x: number, y: number, width: number, height: number }, options?: LensOptions): symbol {
    return this.registry.registerRect({ ...rect, ...options });
  }

  unregisterLens(target: HTMLElement | symbol) {
    this.registry.unregister(target);
  }

  updateLens(target: HTMLElement | symbol, options: Partial<LensOptions>) {
    this.registry.update(target, options);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const loop = () => {
      this.tick();
      if (this.isRunning) {
        this.rafId = requestAnimationFrame(loop);
      }
    };
    loop();
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);
  }

  tick() {
    let lenses = this.registry.getActiveLenses(this.container);
    if (lenses.length === 0) {
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      return;
    }

    const activeQuality = this.getActiveQuality();
    const maxLenses = activeQuality === 'low' ? 4 : 16;
    if (lenses.length > maxLenses) {
      lenses = lenses.slice(0, maxLenses);
    }

    this.textureSource.update(this.source);

    let dpr = this.dpr === 'auto' ? window.devicePixelRatio || 1 : (this.dpr as number);
    if (activeQuality === 'low') {
      dpr = Math.min(dpr, 1);
    } else {
      dpr = Math.min(dpr, 2);
    }

    const scaledLenses = lenses.map(l => ({
      ...l,
      x: l.x * dpr,
      y: l.y * dpr,
      width: l.width * dpr,
      height: l.height * dpr,
      radius: l.radius * dpr,
      feather: l.feather * dpr,
      depth: l.depth * dpr,
      chroma: activeQuality === 'low' ? 0 : l.chroma,
    }));

    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.pass.render({
      sourceTexture: this.textureSource.getTexture(),
      resolution: [this.overlay.width, this.overlay.height],
      lenses: scaledLenses,
    });
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize);
    this.pass.destroy();
    this.textureSource.destroy();
    if (this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
