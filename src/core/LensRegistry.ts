import { LensOptions, RectLensDef } from '../types';
import { DEFAULT_LENS_OPTIONS } from './defaults';
import { measureElement, parseColor } from './measure';

export class LensRegistry {
  private elementLenses = new Map<HTMLElement, Required<LensOptions>>();
  private rectLenses = new Map<symbol, RectLensDef>();

  registerElement(element: HTMLElement, options?: LensOptions) {
    this.elementLenses.set(element, { ...DEFAULT_LENS_OPTIONS, ...options });
  }

  registerRect(rect: { x: number, y: number, width: number, height: number } & LensOptions): symbol {
    const sym = Symbol();
    const opts = { ...DEFAULT_LENS_OPTIONS, ...rect };
    this.rectLenses.set(sym, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      radius: opts.radius,
      depth: opts.depth,
      feather: opts.feather,
      curve: opts.curve,
      chroma: opts.chroma,
      tint: parseColor(opts.tint),
      glint: opts.glint,
    });
    return sym;
  }

  unregister(target: HTMLElement | symbol) {
    if (typeof target === 'symbol') {
      this.rectLenses.delete(target);
    } else {
      this.elementLenses.delete(target);
    }
  }

  update(target: HTMLElement | symbol, options: Partial<LensOptions>) {
    if (typeof target === 'symbol') {
      const existing = this.rectLenses.get(target);
      if (existing) {
        const newTint = options.tint ? parseColor(options.tint) : existing.tint;
        this.rectLenses.set(target, { ...existing, ...options, tint: newTint });
      }
    } else {
      const existing = this.elementLenses.get(target);
      if (existing) {
        this.elementLenses.set(target, { ...existing, ...options });
      }
    }
  }

  getActiveLenses(container: HTMLElement): RectLensDef[] {
    const lenses: RectLensDef[] = [];
    
    for (const [el, opts] of this.elementLenses.entries()) {
      const rect = measureElement(el, container);
      lenses.push({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        radius: opts.radius,
        depth: opts.depth,
        feather: opts.feather,
        curve: opts.curve,
        chroma: opts.chroma,
        tint: parseColor(opts.tint),
        glint: opts.glint,
      });
    }

    for (const def of this.rectLenses.values()) {
      lenses.push(def);
    }

    return lenses;
  }
}
