/** Motor WebGL2: tarjetas y enlaces instanciados. Un único draw call por capa, sea cual sea el número de elementos. */
const RECT_VS = `#version 300 es
layout(location=0) in vec2 aCorner; layout(location=1) in vec4 aRect; layout(location=2) in vec4 aColor; layout(location=3) in float aKind;
uniform vec2 uView, uOffset; uniform float uScale, uMinPx, uGrow, uStretch, uOriginX;
out vec2 vLocal, vSize; out vec4 vColor; out float vKind;
void main(){ vec2 size=max(aRect.zw*uScale,vec2(uMinPx))+2.*uGrow; vec2 origin=vec2((aRect.x-uOriginX)*uStretch,aRect.y)*uScale+uOffset-uGrow;
  if(aKind<-.5){ origin.x=0.; size.x=uView.x; } vec2 px=origin+aCorner*size;
  vLocal=aCorner*size; vSize=size; vColor=aColor; vKind=aKind; gl_Position=vec4(px/uView*2.-1.,0,1); gl_Position.y=-gl_Position.y; }`;
const RECT_FS = `#version 300 es
precision mediump float; in vec2 vLocal, vSize; in vec4 vColor; in float vKind; uniform vec3 uBase; uniform float uAlpha, uTint; out vec4 o;
void main(){ float a=vColor.a*uAlpha; if(a<.004) discard;
  if(vKind<-.5){ o=vec4(vColor.rgb*a,a); return; }
  float r=min(5.,min(vSize.x,vSize.y)*.3); vec2 q=abs(vLocal-vSize*.5)-vSize*.5+r; float d=length(max(q,0.))+min(max(q.x,q.y),0.)-r;
  float cover=clamp(.5-d,0.,1.); vec3 col=mix(uBase,vColor.rgb,uTint);
  if(vSize.x>26.){ if(vKind>6.5){ float s=step(.5,fract((vLocal.x+vLocal.y)/7.)); col=mix(col,uBase,s*.55); }
    float bar=min(4.,vSize.x*.04); col=mix(col,vColor.rgb,step(vLocal.x,bar)); col=mix(col,vColor.rgb,.5*smoothstep(-1.6,-.4,d)); }
  else col=vColor.rgb;
  a*=cover; o=vec4(col*a,a); }`;
const EDGE_VS = `#version 300 es
layout(location=0) in vec2 aT; layout(location=1) in vec4 aEnds; layout(location=2) in vec4 aColor; layout(location=3) in float aMode;
uniform vec2 uView, uOffset; uniform float uScale, uWidth, uStretch, uOriginX, uCardW; out vec4 vColor; out float vSide;
void main(){ float st=uStretch*uScale; vec2 p0=vec2((aEnds.x-uOriginX)*st,aEnds.y*uScale)+uOffset, p3=vec2((aEnds.z-uOriginX)*st,aEnds.w*uScale)+uOffset;
  p0.x+=(aMode>.5?.5:1.)*uCardW*uScale; p3.x+=(aMode>.5?.5:0.)*uCardW*uScale; vec2 p1, p2; if(aMode>.5){ float c=(p3.y-p0.y)*.5; p1=p0+vec2(0,c); p2=p3-vec2(0,c); } else { float c=max(26.,abs(p3.x-p0.x)*.5); p1=p0+vec2(c,0); p2=p3-vec2(c,0); }
  float t=aT.x, u=1.-t; vec2 p=u*u*u*p0+3.*u*u*t*p1+3.*u*t*t*p2+t*t*t*p3; vec2 d=3.*u*u*(p1-p0)+6.*u*t*(p2-p1)+3.*t*t*(p3-p2);
  vec2 nrm=normalize(vec2(-d.y,d.x)+1e-6); p+=nrm*aT.y*uWidth*.5; vColor=aColor; vSide=aT.y; gl_Position=vec4(p/uView*2.-1.,0,1); gl_Position.y=-gl_Position.y; }`;
const EDGE_FS = `#version 300 es
precision mediump float; in vec4 vColor; in float vSide; uniform float uAlpha; out vec4 o;
void main(){ float a=vColor.a*uAlpha*(1.-smoothstep(.55,1.,abs(vSide))); o=vec4(vColor.rgb*a,a); }`;

export interface RectSet { vao: WebGLVertexArrayObject; count: number; rect: WebGLBuffer; color: WebGLBuffer; kind: WebGLBuffer }
export interface EdgeSet { vao: WebGLVertexArrayObject; count: number; ends: WebGLBuffer; color: WebGLBuffer; mode: WebGLBuffer; verts: number }
export interface View { scale: number; stretch: number; x: number; y: number; width: number; height: number; dpr: number }

export class Renderer {
  gl: WebGL2RenderingContext; private rectProgram: WebGLProgram; private edgeProgram: WebGLProgram;
  private quad: WebGLBuffer; private strip: WebGLBuffer; private line: WebGLBuffer; private loc = new Map<string, WebGLUniformLocation | null>();
  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) throw new Error('WebGL2 no disponible');
    this.gl = gl; this.rectProgram = this.program(RECT_VS, RECT_FS); this.edgeProgram = this.program(EDGE_VS, EDGE_FS);
    this.quad = this.buffer(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]));
    const seg = 18, s: number[] = []; for (let i = 0; i <= seg; i++) s.push(i / seg, -1, i / seg, 1);
    this.strip = this.buffer(new Float32Array(s)); this.line = this.buffer(new Float32Array([0, -1, 0, 1, 1, -1, 1, 1]));
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }
  private program(vs: string, fs: string) {
    const gl = this.gl, p = gl.createProgram()!;
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
      const sh = gl.createShader(type)!; gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader'); gl.attachShader(p, sh);
    }
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link'); return p;
  }
  private buffer(data: ArrayBufferView) { const gl = this.gl, b = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; }
  private u(p: WebGLProgram, name: string) { const k = (p === this.rectProgram ? 'r' : 'e') + name; if (!this.loc.has(k)) this.loc.set(k, this.gl.getUniformLocation(p, name)); return this.loc.get(k)!; }
  private attr(buffer: WebGLBuffer, location: number, size: number, type: number, normalized: boolean, divisor: number) {
    const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, type, normalized, 0, 0); gl.vertexAttribDivisor(location, divisor);
  }
  rects(rect: Float32Array, color: Uint8Array, kind: Float32Array, old?: RectSet): RectSet {
    const gl = this.gl; if (old) { gl.deleteVertexArray(old.vao); gl.deleteBuffer(old.rect); gl.deleteBuffer(old.color); gl.deleteBuffer(old.kind); }
    const vao = gl.createVertexArray()!; gl.bindVertexArray(vao);
    const set: RectSet = { vao, count: rect.length / 4, rect: this.buffer(rect), color: this.buffer(color), kind: this.buffer(kind) };
    this.attr(this.quad, 0, 2, gl.FLOAT, false, 0); this.attr(set.rect, 1, 4, gl.FLOAT, false, 1); this.attr(set.color, 2, 4, gl.UNSIGNED_BYTE, true, 1); this.attr(set.kind, 3, 1, gl.FLOAT, false, 1);
    gl.bindVertexArray(null); return set;
  }
  setColors(set: RectSet | EdgeSet, color: Uint8Array) { const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, set.color); gl.bufferData(gl.ARRAY_BUFFER, color, gl.STATIC_DRAW); }
  edges(ends: Float32Array, color: Uint8Array, mode: Float32Array, curved: boolean, old?: EdgeSet): EdgeSet {
    const gl = this.gl; if (old) { gl.deleteVertexArray(old.vao); gl.deleteBuffer(old.ends); gl.deleteBuffer(old.color); gl.deleteBuffer(old.mode); }
    const vao = gl.createVertexArray()!; gl.bindVertexArray(vao);
    const set: EdgeSet = { vao, count: ends.length / 4, ends: this.buffer(ends), color: this.buffer(color), mode: this.buffer(mode), verts: curved ? 38 : 4 };
    this.attr(curved ? this.strip : this.line, 0, 2, gl.FLOAT, false, 0); this.attr(set.ends, 1, 4, gl.FLOAT, false, 1); this.attr(set.color, 2, 4, gl.UNSIGNED_BYTE, true, 1); this.attr(set.mode, 3, 1, gl.FLOAT, false, 1);
    gl.bindVertexArray(null); return set;
  }
  begin(view: View) {
    const gl = this.gl, w = Math.round(view.width * view.dpr), h = Math.round(view.height * view.dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  }
  cardWidth = 184;
  /** El origen se resta en doble precisión antes de pasar a la GPU: con el tiempo muy estirado, float32 no bastaría. */
  private camera(p: WebGLProgram, view: View) {
    const gl = this.gl, d = view.dpr, hx = view.scale * view.stretch, origin = Math.fround((view.width / 2 - view.x) / hx);
    gl.uniform2f(this.u(p, 'uView'), view.width * d, view.height * d); gl.uniform2f(this.u(p, 'uOffset'), (view.x + origin * hx) * d, view.y * d);
    gl.uniform1f(this.u(p, 'uScale'), view.scale * d); gl.uniform1f(this.u(p, 'uStretch'), view.stretch); gl.uniform1f(this.u(p, 'uOriginX'), origin);
  }
  drawRects(set: RectSet, view: View, o: { alpha: number; minPx: number; base: [number, number, number]; tint: number; grow?: number }) {
    if (!set.count) return; const gl = this.gl, p = this.rectProgram, d = view.dpr; gl.useProgram(p);
    this.camera(p, view); gl.uniform1f(this.u(p, 'uMinPx'), o.minPx * d); gl.uniform1f(this.u(p, 'uGrow'), (o.grow ?? 0) * d);
    gl.uniform3f(this.u(p, 'uBase'), ...o.base); gl.uniform1f(this.u(p, 'uAlpha'), o.alpha); gl.uniform1f(this.u(p, 'uTint'), o.tint);
    gl.bindVertexArray(set.vao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, set.count);
  }
  drawEdges(set: EdgeSet, view: View, alpha: number, width: number) {
    if (!set.count || alpha <= 0) return; const gl = this.gl, p = this.edgeProgram, d = view.dpr; gl.useProgram(p);
    this.camera(p, view); gl.uniform1f(this.u(p, 'uCardW'), this.cardWidth); gl.uniform1f(this.u(p, 'uWidth'), width * d * 2); gl.uniform1f(this.u(p, 'uAlpha'), alpha);
    gl.bindVertexArray(set.vao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, set.verts, set.count);
  }
}
