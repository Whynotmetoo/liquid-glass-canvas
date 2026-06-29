export const fragmentShader = `
precision mediump float;

varying vec2 v_uv;

uniform sampler2D u_source;
uniform vec2 u_resolution;
uniform vec4 u_lensRect;    // x, y, width, height (in pixels)
uniform vec4 u_lensParams1; // radius, depth, feather, curve
uniform vec4 u_lensParams2; // chroma, glint, unused, unused
uniform vec4 u_lensTint;    // r, g, b, a

// Rounded rectangle SDF
float sdRoundRect(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + vec2(r);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}

// Get outward normal from rounded rectangle
vec2 getNormal(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + vec2(r);
  if (d.x <= 0.0 && d.y <= 0.0) return vec2(0.0);
  return sign(p) * normalize(max(d, 0.0));
}

void main() {
  vec2 fragCoord = v_uv * u_resolution;
  // flip Y back since fragCoord Y is 0 at bottom, but our DOM coordinates are 0 at top.
  // Wait, if we flip Y during texture upload and the canvas is fullscreen, 
  // v_uv is bottom-up (0,0 bottom-left).
  // u_lensRect uses top-left as origin (DOM coords).
  // So we must convert DOM Y to GL Y:
  float glY = u_resolution.y - fragCoord.y;
  vec2 pxCoords = vec2(fragCoord.x, glY);

  // Center of the lens
  vec2 lensCenter = u_lensRect.xy + u_lensRect.zw * 0.5;
  vec2 p = pxCoords - lensCenter;
  
  // Half extents
  vec2 b = u_lensRect.zw * 0.5;
  
  float radius = u_lensParams1.x;
  float depth = u_lensParams1.y;
  float feather = u_lensParams1.z;
  float curve = u_lensParams1.w;
  
  float chroma = u_lensParams2.x;
  float glint = u_lensParams2.y;

  // Compute SDF
  float dist = sdRoundRect(p, b, radius);
  
  // Discard fragments outside the rounded rect
  if (dist > 0.0) {
    discard;
  }

  // Calculate edge effect amount
  // dist goes from -b to 0 at the edge. 
  // We want the effect to happen within 'feather' pixels from the edge.
  // So when dist is -feather, edge=0. When dist is 0, edge=1.
  float edge = clamp((dist + feather) / feather, 0.0, 1.0);
  
  // Apply curve. 
  float amount = pow(edge, curve);

  // Normal for displacement
  vec2 normal = getNormal(p, b, radius);
  
  // Notice we must map the pixel normal back to UV space for offset.
  // We negate the Y normal because UV Y goes up, but DOM Y goes down.
  vec2 uvOffset = vec2(normal.x, -normal.y) * amount * (depth / u_resolution);
  vec2 sampleUv = v_uv - uvOffset;

  vec4 color;
  if (chroma > 0.0) {
    float cOffset = chroma * amount;
    // slightly different offsets for RGB
    vec2 offsetR = vec2(normal.x, -normal.y) * amount * ((depth + cOffset) / u_resolution);
    vec2 offsetG = uvOffset;
    vec2 offsetB = vec2(normal.x, -normal.y) * amount * ((depth - cOffset) / u_resolution);
    
    float rColor = texture2D(u_source, v_uv - offsetR).r;
    float gColor = texture2D(u_source, v_uv - offsetG).g;
    float bColor = texture2D(u_source, v_uv - offsetB).b;
    float aColor = texture2D(u_source, sampleUv).a;
    color = vec4(rColor, gColor, bColor, aColor);
  } else {
    color = texture2D(u_source, sampleUv);
  }

  // Apply tint
  color.rgb = mix(color.rgb, u_lensTint.rgb, u_lensTint.a);

  // Apply glint (simple specular-like highlight on the top-left edge)
  // We can use the normal and dot product with a light vector
  vec2 lightDir = normalize(vec2(-1.0, -1.0)); // coming from top-left in DOM space
  float specular = max(dot(normal, lightDir), 0.0);
  // sharpen specular
  specular = pow(specular, 4.0) * amount;
  
  color.rgb += vec3(specular * glint);

  gl_FragColor = color;
}
`;
