// React Bits ElectricLogo, Copyright (c) 2026 David Haz.
// MIT + Commons Clause: see LICENSE.md. Adapted to the video's moving distance field.

const vertex = `#version 300 es
out vec2 uv;
void main() {
  vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  uv = vec2(corner.x, 1.0 - corner.y);
  gl_Position = vec4(corner * 2.0 - 1.0, 0, 1);
}`;

const fragment = `#version 300 es
precision highp float;
uniform sampler2D film;
uniform float phase;
uniform bool lightTheme;
in vec2 uv;
out vec4 color;

vec3 tile(float row) {
  // Stay inside the tile even at the outermost half texel.
  vec2 point = clamp(uv, vec2(0.5/512.0, 0.5/432.0), vec2(1.0)-vec2(0.5/512.0, 0.5/432.0));
  return texture(film, vec2(point.x, (point.y + row) / 3.0)).rgb;
}

vec2 glowShape(float line, float spread, float width) {
  float x = abs(line);
  float y = abs(spread);
  return vec2(exp(-x*x / (width*width*0.5)) + exp(-y / (width*2.2))*0.6,
              exp(-y / (width*4.5))*0.5);
}

void main() {
  float distance = (tile(2.0).r - 0.5) * 48.0;
  float alpha = mix(tile(1.0).r, smoothstep(-1.1, 1.4, distance), 0.35);
  vec3 glass = tile(0.0);
  if (lightTheme) glass = mix(glass, vec3(0.73, 0.59, 0.90), 0.16);
  float core = 0.0;
  float halo = 0.0;
  if (abs(distance) < 19.0) {
    vec2 p = uv * vec2(512.0, 432.0);
    // Integer harmonics keep the electricity continuous across the loop join.
    float travel = dot(p, vec2(0.048, 0.059)) - 7.0*phase;
    float wander = sin(dot(p, vec2(0.14, 0.19)) - 9.0*phase);
    float crackle = sin(dot(p, vec2(0.57, -0.46)) + 17.0*phase + 1.5*wander);
    float burst = smoothstep(0.36, 0.94, sin(travel));
    float spark = smoothstep(0.62, 0.96, sin(travel*2.0 + 3.0*phase + 0.8));
    float arc = distance + 0.65 + 1.35*wander + 0.65*crackle;
    float fork = distance + 1.9 - 0.7*wander + 0.5*crackle;
    vec2 lead = glowShape(arc, arc, 0.92) * burst;
    vec2 stray = glowShape(fork, fork, 0.62) * burst * spark;
    core = (0.62*lead.x + 0.28*stray.x) * smoothstep(-3.2, -1.2, distance);
    // Allow a soft spill around the glass, keeping the hot strands on the rim.
    halo = (0.07*exp(-abs(distance)/3.4) + 0.27*lead.y + 0.16*stray.y)
      * (1.0-smoothstep(7.0, 12.0, abs(distance)));
  }
  vec3 glow = lightTheme ? vec3(0.51, 0.27, 0.78) : vec3(0.68, 0.39, 1.0);
  vec3 hot = mix(vec3(0.98, 0.88, 1.0), glow, lightTheme ? 0.18 : 0.08);
  float electric = clamp(core + halo, 0.0, 1.0);
  color = vec4(hot*core + glow*halo + glass*alpha*(1.0-electric),
               electric + alpha*(1.0-electric));
}`;

export function createElectricLogoFilm(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return;
  const parallel = gl.getExtension("KHR_parallel_shader_compile");
  const program = gl.createProgram();
  const texture = gl.createTexture();
  const dispose = () => {
    gl.deleteTexture(texture);
    gl.deleteProgram(program);
  };
  if (!program || !texture) {
    dispose();
    return;
  }
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) {
      dispose();
      return;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  let phase: WebGLUniformLocation | null = null;
  let lightTheme: WebGLUniformLocation | null = null;
  let uploaded = false;
  return {
    draw(mediaTime: number, light: boolean) {
      if (!uploaded) {
        if (
          parallel &&
          !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)
        )
          return "pending";
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return "failed";
        gl.useProgram(program);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        phase = gl.getUniformLocation(program, "phase");
        lightTheme = gl.getUniformLocation(program, "lightTheme");
      }
      if (uploaded)
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          0,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          video,
        );
      else
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          video,
        );
      uploaded = true;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(phase, (mediaTime / video.duration) * 2 * Math.PI);
      gl.uniform1i(lightTheme, Number(light));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return "drawn";
    },
    dispose,
  };
}
