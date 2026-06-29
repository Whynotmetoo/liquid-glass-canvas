import { LensOptions } from '../types';

export const DEFAULT_LENS_OPTIONS: Required<LensOptions> = {
  radius: 16,
  depth: 50,
  feather: 16,
  curve: 2,
  chroma: 0,
  tint: [1, 1, 1, 0.05],
  glint: 0.2,
};
