import type { ExperienceCountryId } from "../data/global-experience";

export interface VideoCompositor {
  select: (id: ExperienceCountryId | null) => void;
  dispose: () => void;
}

// This draws the supplied VIDEO, not a cloth model. Its bottom half carries
// three synchronized country mattes. One decoded frame owns color AND masks.
const vertex = `attribute vec4 a_vertex; varying vec2 v_uv;
void main(){ gl_Position=vec4(a_vertex.xy,0.,1.); v_uv=a_vertex.zw; }`;
const fragment = `
precision highp float;
uniform sampler2D u_frame;
uniform vec3 u_focus;
uniform float u_light;
varying vec2 v_uv;
vec3 matte(vec2 p){
  vec2 uv=clamp(p,vec2(.00056,.0007),vec2(.99944,.9993));
  return smoothstep(vec3(.015),vec3(.985),texture2D(u_frame,vec2(uv.x,.5+uv.y*.5)).rgb);
}
void main(){
  vec3 rgb=texture2D(u_frame,vec2(v_uv.x,v_uv.y*.5)).rgb;
  vec3 mask=matte(v_uv);
  float coverage=clamp(mask.r+mask.g+mask.b,0.,1.);
  float active=clamp(u_focus.r+u_focus.g+u_focus.b,0.,1.);
  float selected=dot(mask,u_focus);
  // The film owns the geometry. Selection only grades the original pixels.
  vec3 cloth=rgb*(1.-.14*max(0.,coverage*active-selected)+.08*selected);
  // Remove the baked rectangular aubergine background. Only the luminous
  // atmosphere survives, with continuous alpha and a broad elliptical falloff.
  vec3 residual=max(rgb-vec3(.055,.035,.085),vec3(0.));
  float peak=max(max(residual.r,residual.g),residual.b);
  float radius=length((v_uv-.5)*vec2(1.8,1.6));
  float fade=1.-smoothstep(.65,1.05,radius);
  fade*=smoothstep(0.,.07,v_uv.x)*smoothstep(0.,.07,1.-v_uv.x)
    *smoothstep(0.,.07,v_uv.y)*smoothstep(0.,.07,1.-v_uv.y);
  float atmosphere=mix(pow(peak,1.2)*.9*fade,fade,u_light);
  vec3 darkBg=mix(vec3(.52,.28,.80),residual/max(peak,.001),smoothstep(.15,.8,peak));
  // The light source has its own photographed atmosphere. Keep its original
  // lighting and blend only the perimeter into the page.
  vec3 bg=mix(darkBg,rgb,u_light);
  vec3 back=bg*atmosphere;
  gl_FragColor=vec4(cloth*coverage+back*(1.-coverage),coverage+atmosphere*(1.-coverage));
}`;

export function createVideoCompositor(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ready: () => void,
  failed: () => void,
  initialLight = false,
): VideoCompositor | undefined {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    powerPreference: "high-performance",
    antialias: false,
  });
  if (!gl) return;
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram(),
    buffer = gl.createBuffer(),
    texture = gl.createTexture();
  const cleanup = () => {
    shaders.forEach((s) => gl.deleteShader(s));
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    gl.deleteTexture(texture);
  };
  try {
    if (!program || !buffer || !texture)
      throw new Error("Video compositor unavailable");
    for (const [type, code] of [
      [gl.VERTEX_SHADER, vertex],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Video shader unavailable");
      shaders.push(shader);
      gl.shaderSource(shader, code);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error("Video shader compilation failed");
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Video shader linking failed");
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, -1, 1, 0, 0, 1, -1, 1, 1, 1, 1,
        1, 0,
      ]),
      gl.STATIC_DRAW,
    );
    const attribute = gl.getAttribLocation(program, "a_vertex");
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 4, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const focusUniform = gl.getUniformLocation(program, "u_focus");
    const themeUniform = gl.getUniformLocation(program, "u_light");
    gl.uniform1f(themeUniform, initialLight ? 1 : 0);
    const focus = [0, 0, 0];
    const target = [0, 0, 0];
    let disposed = false,
      lost = false,
      uploaded = false,
      didReveal = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let previous = 0,
      callback = 0,
      fallback = 0,
      uploadNeeded = false,
      lastDecodedFrame = -1;
    const draw = (time: number) => {
      if (disposed || lost || video.readyState < 2) return;
      const dt = previous ? Math.min((time - previous) / 1000, 0.08) : 1 / 24;
      previous = time;
      const blend = reduced.matches || video.paused ? 1 : 1 - Math.exp(-dt * 12);
      for (let i = 0; i < 3; i++) {
        focus[i] += (target[i] - focus[i]) * blend;
        if (Math.abs(target[i] - focus[i]) < 0.001) focus[i] = target[i];
      }
      if (uploadNeeded || !uploaded) {
        // Reuse the texture allocation instead of allocating video storage on
        // every decoded frame. Resizing can reuse that same texture.
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
        uploadNeeded = false;
      }
      gl.uniform3fv(focusUniform, focus);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!didReveal) {
        didReveal = true;
        ready();
      }
    };
    // Only the decoder may schedule moving-film draws. A country click changes
    // uniforms for the next decoded frame; it must not turn a 24fps film into
    // a burst of full-canvas GPU passes during a transition.
    const redrawStill = () => {
      if (!disposed && !lost && video.paused) draw(performance.now());
    };
    const loaded = () => {
      uploadNeeded = true;
      redrawStill();
    };
    const frame: VideoFrameRequestCallback = (now, metadata) => {
      if (disposed || lost) return;
      if (!video.paused) {
        uploadNeeded = true;
        draw(now);
        canvas.dataset.mediaTime = metadata.mediaTime.toFixed(3);
        canvas.dataset.decodedFrame = String(metadata.presentedFrames);
      }
      callback = video.requestVideoFrameCallback(frame);
    };
    const tick = (now: number) => {
      fallback = 0;
      if (disposed || lost || video.paused) return;
      const count = video.getVideoPlaybackQuality?.().totalVideoFrames ||
        Math.floor(video.currentTime * 24);
      if (count !== lastDecodedFrame) {
        lastDecodedFrame = count;
        uploadNeeded = true;
        draw(now);
      }
      fallback = requestAnimationFrame(tick);
    };
    const playing = () => {
      if (!("requestVideoFrameCallback" in video) && !fallback)
        fallback = requestAnimationFrame(tick);
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      // A 768px output retains the video detail at its displayed size while
      // keeping the per-flag transition within the same rendering budget.
      const dpr = Math.min(
        devicePixelRatio || 1,
        1.5,
        768 / Math.max(r.width, 1),
      );
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      redrawStill();
    };
    const sizing = new ResizeObserver(resize);
    sizing.observe(canvas);
    const contextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      failed();
    };
    canvas.addEventListener("webglcontextlost", contextLost);
    video.addEventListener("playing", playing);
    video.addEventListener("loadeddata", loaded);
    video.addEventListener("seeked", loaded);
    if ("requestVideoFrameCallback" in video)
      callback = video.requestVideoFrameCallback(frame);
    else playing();
    resize();
    return {
      select(id) {
        target[0] = id === "cn" ? 1 : 0;
        target[1] = id === "kg" ? 1 : 0;
        target[2] = id === "uz" ? 1 : 0;
      },
      dispose() {
        disposed = true;
        cancelAnimationFrame(fallback);
        if (callback) video.cancelVideoFrameCallback(callback);
        sizing.disconnect();
        video.removeEventListener("playing", playing);
        video.removeEventListener("loadeddata", loaded);
        video.removeEventListener("seeked", loaded);
        canvas.removeEventListener("webglcontextlost", contextLost);
        cleanup();
      },
    };
  } catch {
    cleanup();
    return;
  }
}
