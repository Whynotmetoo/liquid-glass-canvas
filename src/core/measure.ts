export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function measureElement(element: HTMLElement, container: HTMLElement): Rect {
  const elRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return {
    x: elRect.left - containerRect.left,
    y: elRect.top - containerRect.top,
    width: elRect.width,
    height: elRect.height
  };
}

export function parseColor(color: string | [number, number, number, number]): [number, number, number, number] {
  if (Array.isArray(color)) return color;
  
  const div = document.createElement('div');
  div.style.color = color;
  div.style.display = 'none';
  document.body.appendChild(div);
  const rgb = getComputedStyle(div).color;
  document.body.removeChild(div);
  
  const match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (match) {
    return [
      parseInt(match[1], 10) / 255,
      parseInt(match[2], 10) / 255,
      parseInt(match[3], 10) / 255,
      match[4] !== undefined ? parseFloat(match[4]) : 1.0
    ];
  }
  return [1, 1, 1, 1];
}
