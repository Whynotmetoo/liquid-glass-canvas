# Liquid Glass Canvas

A high-performance, WebGL-native liquid glass refraction library for HTML5 Canvas and WebGL sources.

> [!IMPORTANT]
> **This library is designed specifically to refract Canvas (2D/WebGL) content.** It does not refract arbitrary HTML DOM elements (such as text, images, or standard divs) that are outside the canvas source.

---

## Why Liquid Glass Canvas?

Traditional glassmorphism effects on the web rely on CSS `backdrop-filter: blur()`, SVG `<feDisplacementMap>`, or DOM-cloning techniques. While these work well for static or standard HTML content, they fail when dealing with **dynamic canvas animations** (e.g., interactive particle systems, Three.js scenes, PixiJS renderers, or canvas game loops):
1. **SVG Displacement Maps** are extremely slow and CPU-bound in many browsers.
2. **Canvas `toDataURL` or `getImageData`** approaches require copying pixel buffers back to the CPU, destroying performance and causing frame drops.
3. **`backdrop-filter`** does not provide custom lens-based optical refraction (e.g., normal-based displacement, chromatic aberration, or custom edge curves).

**Liquid Glass Canvas** solves this by performing native WebGL-based refraction directly in the GPU. It captures a source canvas as a WebGL texture, calculates precise rounded-rectangle Signed Distance Field (SDF) lenses, and renders high-performance refraction overlays or quads at 60 FPS.

---

## Features

- **Rounded Rectangle SDF Lenses:** Clean, mathematical shapes with adjustable corner radii.
- **Edge Normal Displacement:** Realistic lens refraction based on edge normals and customizable falloff curves.
- **Chromatic Aberration:** Simulated glass dispersion by sampling color channels with slight offsets.
- **Layered Aesthetics:** Combined refraction core, tint overlay (supporting RGBA/hex/CSS color strings), and dynamic specular glint.
- **Dual Modes:**
  - **Overlay Mode:** Ideal for standard web apps. It places a transparent WebGL canvas over your background canvas and automatically aligns glass lenses with floating DOM elements (like cards or menus).
  - **Pass Mode:** Ideal for custom graphics pipelines. Render the refraction step directly inside an existing WebGL context or render loop.
- **Performance Optimized:** No expensive blur shaders, smart DPR handling, and low-quality fallbacks for mobile/lower-end devices.

---

## Installation

```bash
npm install liquid-glass-canvas
```

---

## Quick Start

### 1. Overlay Mode (Aligning with DOM Elements)

In Overlay Mode, the library places an overlay WebGL canvas on top of a source canvas and automatically tracks DOM elements to apply refraction.

```html
<div id="container" style="position: relative; width: 100vw; height: 100vh;">
  <!-- Your dynamic background (e.g., Three.js, 2D Canvas particles) -->
  <canvas id="bg-canvas" style="width: 100%; height: 100%;"></canvas>
  
  <!-- A standard DOM element you want to turn into a glass lens -->
  <div id="glass-card" style="position: absolute; width: 300px; height: 200px; border-radius: 24px;">
    <h2>Refracted Card</h2>
  </div>
</div>
```

```typescript
import { createCanvasLiquidGlass } from 'liquid-glass-canvas';

// Initialize the overlay
const glass = createCanvasLiquidGlass({
  source: document.getElementById('bg-canvas') as HTMLCanvasElement,
  container: document.getElementById('container') as HTMLElement,
  dpr: 'auto', // Matches device pixel ratio automatically
});

// Register the DOM element as a lens
glass.registerLens(document.getElementById('glass-card')!, {
  radius: 24,           // Match CSS border-radius
  depth: 80,            // Strength of refraction displacement
  feather: 16,          // Feather distance in pixels at the lens edge
  curve: 2.0,           // Falloff curve exponent (higher = sharper edge)
  chroma: 0.05,         // Chromatic aberration intensity
  tint: 'rgba(255, 255, 255, 0.06)', // Glass tint color
  glint: 0.4            // Specular highlight brightness on top-left edge
});

// Start the requestAnimationFrame rendering loop
glass.start();
```

### 2. Pass Mode (Custom WebGL Pipeline Integration)

For projects with their own WebGL contexts (like custom Three.js/PixiJS post-processing passes), Pass Mode renders the liquid glass quads directly into your active framebuffer.

```typescript
import { createLiquidGlassPass } from 'liquid-glass-canvas';

// 1. Initialize the pass with a WebGL context
const pass = createLiquidGlassPass(gl, { maxLenses: 16 });

// 2. In your render loop:
function render() {
  // ... Draw background scene to a texture (sourceTexture) ...

  // Render refraction quads
  pass.render({
    sourceTexture: mySceneTexture,
    resolution: [viewportWidth, viewportHeight],
    lenses: [
      {
        x: 100,
        y: 150,
        width: 300,
        height: 200,
        radius: 24,
        depth: 80,
        feather: 16,
        curve: 2.0,
        chroma: 0.05,
        tint: [1.0, 1.0, 1.0, 0.06], // Normalized RGBA [r, g, b, a]
        glint: 0.4
      }
    ]
  });
}
```

---

## API Reference

### `createCanvasLiquidGlass(options)`

Initializes an Overlay Mode instance.

- **Options:**
  - `source`: `HTMLCanvasElement` (The underlying canvas containing background graphics)
  - `container`: `HTMLElement` (The common parent containing the source canvas and the DOM overlay lenses)
  - `dpr`: `number | 'auto'` (Default: `'auto'`. Output resolution scaling factor)
  - `quality`: `'auto' | 'high' | 'low'` (Default: `'auto'`. High quality enables chromatic aberration; low quality disables it for better performance)

#### Instance Methods:

- **`glass.registerLens(target, options)`**
  Tracks a DOM element as a lens. Matches layout positions relative to the container.
- **`glass.registerRectLens(rect, options)`**
  Creates a static lens defined by manual coordinates `{ x, y, width, height }`. Returns a unique `symbol` ID.
- **`glass.unregisterLens(target)`**
  Removes a registered element or static rect lens (using its `symbol` ID).
- **`glass.updateLens(target, options)`**
  Updates settings dynamically for a registered element or rect lens.
- **`glass.start()`**
  Starts the automatic requestAnimationFrame loop to render overlays and track layouts.
- **`glass.tick()`**
  Manually triggers a single frame render. Useful if you want to drive the rendering using your own animation loop.
- **`glass.stop()`**
  Pauses the automatic rendering loop.
- **`glass.destroy()`**
  Stops rendering, detaches resize listeners, deletes internal WebGL resources, and removes the overlay canvas from the DOM.

---

## Performance & Technical Tradeoffs

### 1. No Blur Effects
Typical "frosted glass" effects require Gaussian Blur or Box Blur, which involve multiple texture lookups and render passes. Doing this in real-time as an overlay synchronized with complex background canvases is highly resource-intensive (especially on mobile). By prioritizing crisp optical refraction, normal-based displacement, tinting, and glints, Liquid Glass Canvas delivers a premium glass aesthetic at a fraction of the performance cost.

### 2. CORS and Canvas Tainting
Because this library uploads the source canvas to WebGL using `texImage2D`, the source canvas must not be **tainted**. If your source canvas draws images or videos from a different origin, ensure those resources are served with appropriate CORS headers (`Access-Control-Allow-Origin`) and loaded with `crossOrigin = "anonymous"`.

---

## License

MIT
