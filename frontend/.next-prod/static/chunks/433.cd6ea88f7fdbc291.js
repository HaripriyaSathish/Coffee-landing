"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[433],{2034:(e,t,r)=>{r.d(t,{_:()=>u});var a=r(8945),n=r(2115),i=r(5339),o=r(4877);let s={uniforms:{tDiffuse:{value:null},h:{value:1/512}},vertexShader:`
      varying vec2 vUv;

      void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

      }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float h;

    varying vec2 vUv;

    void main() {

    	vec4 sum = vec4( 0.0 );

    	sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * 0.051;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * 0.051;

    	gl_FragColor = sum;

    }
  `},l={uniforms:{tDiffuse:{value:null},v:{value:1/512}},vertexShader:`
    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }
  `,fragmentShader:`

  uniform sampler2D tDiffuse;
  uniform float v;

  varying vec2 vUv;

  void main() {

    vec4 sum = vec4( 0.0 );

    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * 0.051;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * 0.051;

    gl_FragColor = sum;

  }
  `},u=n.forwardRef(({scale:e=10,frames:t=1/0,opacity:r=1,width:u=1,height:f=1,blur:c=1,near:v=0,far:m=10,resolution:d=512,smooth:p=!0,color:h="#000000",depthWrite:g=!1,renderOrder:b,...x},y)=>{let w,P,M=n.useRef(null),D=(0,o.C)(e=>e.scene),A=(0,o.C)(e=>e.gl),U=n.useRef(null);u*=Array.isArray(e)?e[0]:e||1,f*=Array.isArray(e)?e[1]:e||1;let[S,C,_,E,R,I,T]=n.useMemo(()=>{let e=new i.nWS(d,d),t=new i.nWS(d,d);t.texture.generateMipmaps=e.texture.generateMipmaps=!1;let r=new i.bdM(u,f).rotateX(Math.PI/2),a=new i.eaF(r),n=new i.CSG;n.depthTest=n.depthWrite=!1,n.onBeforeCompile=e=>{e.uniforms={...e.uniforms,ucolor:{value:new i.Q1f(h)}},e.fragmentShader=e.fragmentShader.replace("void main() {",`uniform vec3 ucolor;
           void main() {
          `),e.fragmentShader=e.fragmentShader.replace("vec4( vec3( 1.0 - fragCoordZ ), opacity );","vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );")};let o=new i.BKk(s),c=new i.BKk(l);return c.depthTest=o.depthTest=!1,[e,r,n,a,o,c,t]},[d,u,f,e,h]),k=e=>{E.visible=!0,E.material=R,R.uniforms.tDiffuse.value=S.texture,R.uniforms.h.value=e/256,A.setRenderTarget(T),A.render(E,U.current),E.material=I,I.uniforms.tDiffuse.value=T.texture,I.uniforms.v.value=e/256,A.setRenderTarget(S),A.render(E,U.current),E.visible=!1},z=0;return(0,o.D)(()=>{U.current&&(t===1/0||z<t)&&(z++,w=D.background,P=D.overrideMaterial,M.current.visible=!1,D.background=null,D.overrideMaterial=_,A.setRenderTarget(S),A.render(D,U.current),k(c),p&&k(.4*c),A.setRenderTarget(null),M.current.visible=!0,D.overrideMaterial=P,D.background=w)}),n.useImperativeHandle(y,()=>M.current,[]),n.createElement("group",(0,a.A)({"rotation-x":Math.PI/2},x,{ref:M}),n.createElement("mesh",{renderOrder:b,geometry:C,scale:[1,-1,1],rotation:[-Math.PI/2,0,0]},n.createElement("meshBasicMaterial",{transparent:!0,map:S.texture,opacity:r,depthWrite:g})),n.createElement("orthographicCamera",{ref:U,args:[-u/2,u/2,f/2,-f/2,v,m]}))})},3617:(e,t,r)=>{r.d(t,{o:()=>n});var a=r(5339);class n{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}new a.qUd(-1,1,1,-1,0,1);class i extends a.LoY{constructor(){super(),this.setAttribute("position",new a.qtW([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new a.qtW([0,2,0,0,2,0],2))}}new i},5951:(e,t,r)=>{r.d(t,{zo:()=>s});var a=r(2115),n=r(5339),i=r(4877);let o=e=>e===Object(e)&&!Array.isArray(e)&&"function"!=typeof e;function s(e,t){let r=(0,i.C)(e=>e.gl),s=(0,i.G)(n.Tap,o(e)?Object.values(e):e);return(0,a.useLayoutEffect)(()=>{null==t||t(s)},[t]),(0,a.useEffect)(()=>{if("initTexture"in r){let e=[];Array.isArray(s)?e=s:s instanceof n.gPd?e=[s]:o(s)&&(e=Object.values(s)),e.forEach(e=>{e instanceof n.gPd&&r.initTexture(e)})}},[r,s]),(0,a.useMemo)(()=>{if(!o(e))return s;{let t={},r=0;for(let a in e)t[a]=s[r++];return t}},[e,s])}s.preload=e=>i.G.preload(n.Tap,e),s.clear=e=>i.G.clear(n.Tap,e)},6756:(e,t,r)=>{r.d(t,{r:()=>o});var a=r(2115),n=r(4877);let i=(0,a.createContext)(null);function o({iterations:e=10,ms:t=250,threshold:r=.75,step:o=.1,factor:s=.5,flipflops:l=1/0,bounds:u=e=>e>100?[60,100]:[40,60],onIncline:f,onDecline:c,onChange:v,onFallback:m,children:d}){let[p,h]=(0,a.useState)(()=>({fps:0,index:0,factor:s,flipped:0,refreshrate:0,fallback:!1,frames:[],averages:[],subscriptions:new Map,subscribe:e=>{let t=Symbol();return p.subscriptions.set(t,e.current),()=>void p.subscriptions.delete(t)}})),g=0;return(0,n.D)(()=>{let{frames:a,averages:n}=p;if(!p.fallback&&n.length<e){a.push(performance.now());let i=a[a.length-1]-a[0];if(i>=t){if(p.fps=Math.round(a.length/i*1e3)/1,p.refreshrate=Math.max(p.refreshrate,p.fps),n[p.index++%e]=p.fps,n.length===e){let[t,a]=u(p.refreshrate),i=n.filter(e=>e>=a),s=n.filter(e=>e<t);i.length>e*r&&(p.factor=Math.min(1,p.factor+o),p.flipped++,f&&f(p),p.subscriptions.forEach(e=>e.onIncline&&e.onIncline(p))),s.length>e*r&&(p.factor=Math.max(0,p.factor-o),p.flipped++,c&&c(p),p.subscriptions.forEach(e=>e.onDecline&&e.onDecline(p))),g!==p.factor&&(g=p.factor,v&&v(p),p.subscriptions.forEach(e=>e.onChange&&e.onChange(p))),p.flipped>l&&!p.fallback&&(p.fallback=!0,m&&m(p),p.subscriptions.forEach(e=>e.onFallback&&e.onFallback(p))),p.averages=[]}p.frames=[]}}}),a.createElement(i.Provider,{value:p},d)}},7003:(e,t,r)=>{r.d(t,{s:()=>m});var a=r(8945),n=r(2115),i=r(5339),o=r(4877);let s=parseInt(i.sPf.replace(/\D+/g,""));class l extends i.BKk{constructor(){super({uniforms:{time:{value:0},pixelRatio:{value:1}},vertexShader:`
        uniform float pixelRatio;
        uniform float time;
        attribute float size;  
        attribute float speed;  
        attribute float opacity;
        attribute vec3 noise;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          modelPosition.y += sin(time * speed + modelPosition.x * noise.x * 100.0) * 0.2;
          modelPosition.z += cos(time * speed + modelPosition.x * noise.y * 100.0) * 0.2;
          modelPosition.x += cos(time * speed + modelPosition.x * noise.z * 100.0) * 0.2;
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectionPostion = projectionMatrix * viewPosition;
          gl_Position = projectionPostion;
          gl_PointSize = size * 25. * pixelRatio;
          gl_PointSize *= (1.0 / - viewPosition.z);
          vColor = color;
          vOpacity = opacity;
        }
      `,fragmentShader:`
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float strength = 0.05 / distanceToCenter - 0.1;
          gl_FragColor = vec4(vColor, strength * vOpacity);
          #include <tonemapping_fragment>
          #include <${s>=154?"colorspace_fragment":"encodings_fragment"}>
        }
      `})}get time(){return this.uniforms.time.value}set time(e){this.uniforms.time.value=e}get pixelRatio(){return this.uniforms.pixelRatio.value}set pixelRatio(e){this.uniforms.pixelRatio.value=e}}let u=e=>e&&e.constructor===Float32Array,f=e=>e instanceof i.I9Y||e instanceof i.Pq0||e instanceof i.IUQ,c=e=>Array.isArray(e)?e:f(e)?e.toArray():[e,e,e];function v(e,t,r){return n.useMemo(()=>{if(void 0!==t)if(u(t))return t;else{if(t instanceof i.Q1f){let r=Array.from({length:3*e},()=>[t.r,t.g,t.b]).flat();return Float32Array.from(r)}if(f(t)||Array.isArray(t)){let r=Array.from({length:3*e},()=>c(t)).flat();return Float32Array.from(r)}return Float32Array.from({length:e},()=>t)}return Float32Array.from({length:e},r)},[t])}let m=n.forwardRef(({noise:e=1,count:t=100,speed:r=1,opacity:s=1,scale:f=1,size:m,color:d,children:p,...h},g)=>{n.useMemo(()=>(0,o.e)({SparklesImplMaterial:l}),[]);let b=n.useRef(null),x=(0,o.C)(e=>e.viewport.dpr),y=c(f),w=n.useMemo(()=>Float32Array.from(Array.from({length:t},()=>y.map(i.cj9.randFloatSpread)).flat()),[t,...y]),P=v(t,m,Math.random),M=v(t,s),D=v(t,r),A=v(3*t,e),U=v(void 0===d?3*t:t,u(d)?d:new i.Q1f(d),()=>1);return(0,o.D)(e=>{b.current&&b.current.material&&(b.current.material.time=e.clock.elapsedTime)}),n.useImperativeHandle(g,()=>b.current,[]),n.createElement("points",(0,a.A)({key:`particle-${t}-${JSON.stringify(f)}`},h,{ref:b}),n.createElement("bufferGeometry",null,n.createElement("bufferAttribute",{attach:"attributes-position",args:[w,3]}),n.createElement("bufferAttribute",{attach:"attributes-size",args:[P,1]}),n.createElement("bufferAttribute",{attach:"attributes-opacity",args:[M,1]}),n.createElement("bufferAttribute",{attach:"attributes-speed",args:[D,1]}),n.createElement("bufferAttribute",{attach:"attributes-color",args:[U,3]}),n.createElement("bufferAttribute",{attach:"attributes-noise",args:[A,3]})),p||n.createElement("sparklesImplMaterial",{transparent:!0,pixelRatio:x,depthWrite:!1}))})},8381:(e,t,r)=>{r.d(t,{mK:()=>P,s0:()=>b,fL:()=>M,bt:()=>A,fE:()=>U});var a=r(5155),n=r(2115),i=r(5339),o=r(4877),s=r(3303);function l(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}new i.I9Y,new i.I9Y;function u(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}var f=function e(t,r,a){var n=this;u(this,e),l(this,"dot2",function(e,t){return n.x*e+n.y*t}),l(this,"dot3",function(e,t,r){return n.x*e+n.y*t+n.z*r}),this.x=t,this.y=r,this.z=a},c=[new f(1,1,0),new f(-1,1,0),new f(1,-1,0),new f(-1,-1,0),new f(1,0,1),new f(-1,0,1),new f(1,0,-1),new f(-1,0,-1),new f(0,1,1),new f(0,-1,1),new f(0,1,-1),new f(0,-1,-1)],v=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180],m=Array(512),d=Array(512);!function(e){e>0&&e<1&&(e*=65536),(e=Math.floor(e))<256&&(e|=e<<8);for(var t,r=0;r<256;r++)t=1&r?v[r]^255&e:v[r]^e>>8&255,m[r]=m[r+256]=t,d[r]=d[r+256]=c[t%12]}(0);function p(e){var t=function(e){if("number"==typeof e)e=Math.abs(e);else if("string"==typeof e){var t=e;e=0;for(var r=0;r<t.length;r++)e=(e+(r+1)*(t.charCodeAt(r)%96))%0x7fffffff}return 0===e&&(e=311),e}(e);return function(){var e=48271*t%0x7fffffff;return t=e,e/0x7fffffff}}new function e(t){var r=this;u(this,e),l(this,"seed",0),l(this,"init",function(e){r.seed=e,r.value=p(e)}),l(this,"value",p(this.seed)),this.init(t)}(Math.random());i.LoY;r(1948);let h=(0,n.createContext)(null),g=e=>(2&e.getAttributes())==2,b=(0,n.memo)((0,n.forwardRef)(({children:e,camera:t,scene:r,resolutionScale:l,enabled:u=!0,renderPriority:f=1,autoClear:c=!0,depthBuffer:v,enableNormalPass:m,stencilBuffer:d,multisampling:p=8,frameBufferType:b=i.ix0},x)=>{let{gl:y,scene:w,camera:P,size:M}=(0,o.C)(),D=r||w,A=t||P,[U,S,C]=(0,n.useMemo)(()=>{let e=new s.s0(y,{depthBuffer:v,stencilBuffer:d,multisampling:p,frameBufferType:b});e.addPass(new s.AH(D,A));let t=null,r=null;return m&&((r=new s.Xe(D,A)).enabled=!1,e.addPass(r),void 0!==l&&((t=new s.SP({normalBuffer:r.texture,resolutionScale:l})).enabled=!1,e.addPass(t))),[e,r,t]},[A,y,v,d,p,b,D,m,l]);(0,n.useEffect)(()=>U?.setSize(M.width,M.height),[U,M]),(0,o.D)((e,t)=>{if(u){let e=y.autoClear;y.autoClear=c,d&&!c&&y.clearStencil(),U.render(t),y.autoClear=e}},u?f:0);let _=(0,n.useRef)(null);(0,n.useLayoutEffect)(()=>{let e=[],t=_.current.__r3f;if(t&&U){let r=t.children;for(let t=0;t<r.length;t++){let a=r[t].object;if(a instanceof s.Mj){let n=[a];if(!g(a)){let e=null;for(;(e=r[t+1]?.object)instanceof s.Mj&&!g(e);)n.push(e),t++}let i=new s.Vu(A,...n);e.push(i)}else a instanceof s.oF&&e.push(a)}for(let t of e)U?.addPass(t);S&&(S.enabled=!0),C&&(C.enabled=!0)}return()=>{for(let t of e)U?.removePass(t);S&&(S.enabled=!1),C&&(C.enabled=!1)}},[U,e,A,S,C]),(0,n.useEffect)(()=>{let e=y.toneMapping;return y.toneMapping=i.y_p,()=>{y.toneMapping=e}},[y]);let E=(0,n.useMemo)(()=>({composer:U,normalPass:S,downSamplingPass:C,resolutionScale:l,camera:A,scene:D}),[U,S,C,l,A,D]);return(0,n.useImperativeHandle)(x,()=>U,[U]),(0,a.jsx)(h.Provider,{value:E,children:(0,a.jsx)("group",{ref:_,children:e})})})),x=0,y=new WeakMap,w=(e,t)=>function({blendFunction:r=t?.blendFunction,opacity:i=t?.opacity,...s}){let l=y.get(e);if(!l){let t=`@react-three/postprocessing/${e.name}-${x++}`;(0,o.e)({[t]:e}),y.set(e,l=t)}let u=(0,o.C)(e=>e.camera),f=n.useMemo(()=>[...t?.args??[],...s.args??[{...t,...s}]],[JSON.stringify(s)]);return(0,a.jsx)(l,{camera:u,"blendMode-blendFunction":r,"blendMode-opacity-value":i,...s,args:f})};s.Mj;let P=w(s.bv,{blendFunction:0}),M=w(s.i,{blendFunction:5});s.hH;var D=(e=>(e[e.Linear=0]="Linear",e[e.Radial=1]="Radial",e[e.MirroredLinear=2]="MirroredLinear",e))(D||{});s.Mj;let A=w(s.i4),U=w(s.K1),S=(s.To,{fragmentShader:`

    // original shader by Evan Wallace

    #define MAX_ITERATIONS 100

    uniform float blur;
    uniform float taper;
    uniform vec2 start;
    uniform vec2 end;
    uniform vec2 direction;
    uniform int samples;

    float random(vec3 scale, float seed) {
        /* use the fragment position for a different seed per-pixel */
        return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec4 color = vec4(0.0);
        float total = 0.0;
        vec2 startPixel = vec2(start.x * resolution.x, start.y * resolution.y);
        vec2 endPixel = vec2(end.x * resolution.x, end.y * resolution.y);
        float f_samples = float(samples);
        float half_samples = f_samples / 2.0;

        // use screen diagonal to normalize blur radii
        float maxScreenDistance = distance(vec2(0.0), resolution); // diagonal distance
        float gradientRadius = taper * (maxScreenDistance);
        float blurRadius = blur * (maxScreenDistance / 16.0);

        /* randomize the lookup values to hide the fixed number of samples */
        float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);
        vec2 normal = normalize(vec2(startPixel.y - endPixel.y, endPixel.x - startPixel.x));
        float radius = smoothstep(0.0, 1.0, abs(dot(uv * resolution - startPixel, normal)) / gradientRadius) * blurRadius;

        #pragma unroll_loop_start
        for (int i = 0; i <= MAX_ITERATIONS; i++) {
            if (i >= samples) { break; } // return early if over sample count
            float f_i = float(i);
            float s_i = -half_samples + f_i;
            float percent = (s_i + offset - 0.5) / half_samples;
            float weight = 1.0 - abs(percent);
            vec4 sample_i = texture2D(inputBuffer, uv + normalize(direction) / resolution * percent * radius);
            /* switch to pre-multiplied alpha to correctly blur transparent images */
            sample_i.rgb *= sample_i.a;
            color += sample_i * weight;
            total += weight;
        }
        #pragma unroll_loop_end

        outputColor = color / total;

        /* switch back from pre-multiplied alpha */
        outputColor.rgb /= outputColor.a + 0.00001;
    }
    `});s.Mj;s.Mj;s.Mj},9897:(e,t,r)=>{r.d(t,{b:()=>o});var a=r(8945),n=r(2115),i=r(5339);let o=n.forwardRef(function({args:[e=1,t=1,r=1]=[],radius:i=.05,steps:o=1,smoothness:l=4,bevelSegments:u=4,creaseAngle:f=.4,children:c,...v},m){return n.createElement("mesh",(0,a.A)({ref:m},v),n.createElement(s,{args:[e,t,r],radius:i,steps:o,smoothness:l,bevelSegments:u,creaseAngle:f}),c)}),s=n.forwardRef(function({args:[e=1,t=1,r=1]=[],radius:o=.05,steps:s=1,smoothness:l=4,bevelSegments:u=4,creaseAngle:f=.4,...c},v){let m=n.useMemo(()=>(function(e,t,r){let a=new i.ypk,n=r-1e-5;return a.absarc(1e-5,1e-5,1e-5,-Math.PI/2,-Math.PI,!0),a.absarc(1e-5,t-2*n,1e-5,Math.PI,Math.PI/2,!0),a.absarc(e-2*n,t-2*n,1e-5,Math.PI/2,0,!0),a.absarc(e-2*n,1e-5,1e-5,0,-Math.PI/2,!0),a})(e,t,o),[e,t,o]),d=n.useMemo(()=>({depth:r-2*o,bevelEnabled:!0,bevelSegments:2*u,steps:s,bevelSize:o-1e-5,bevelThickness:o,curveSegments:l}),[r,o,l,u,s]),p=n.useRef(null);return n.useLayoutEffect(()=>{p.current&&(p.current.center(),function(e,t=Math.PI/3){let r=Math.cos(t),a=(1+1e-10)*100,n=[new i.Pq0,new i.Pq0,new i.Pq0],o=new i.Pq0,s=new i.Pq0,l=new i.Pq0,u=new i.Pq0;function f(e){let t=~~(e.x*a),r=~~(e.y*a),n=~~(e.z*a);return`${t},${r},${n}`}let c=e.index?e.toNonIndexed():e,v=c.attributes.position,m={};for(let e=0,t=v.count/3;e<t;e++){let t=3*e,r=n[0].fromBufferAttribute(v,t+0),a=n[1].fromBufferAttribute(v,t+1),l=n[2].fromBufferAttribute(v,t+2);o.subVectors(l,a),s.subVectors(r,a);let u=new i.Pq0().crossVectors(o,s).normalize();for(let e=0;e<3;e++){let t=f(n[e]);t in m||(m[t]=[]),m[t].push(u)}}let d=new Float32Array(3*v.count),p=new i.THS(d,3,!1);for(let e=0,t=v.count/3;e<t;e++){let t=3*e,a=n[0].fromBufferAttribute(v,t+0),i=n[1].fromBufferAttribute(v,t+1),c=n[2].fromBufferAttribute(v,t+2);o.subVectors(c,i),s.subVectors(a,i),l.crossVectors(o,s).normalize();for(let e=0;e<3;e++){let a=m[f(n[e])];u.set(0,0,0);for(let e=0,t=a.length;e<t;e++){let t=a[e];l.dot(t)>r&&u.add(t)}u.normalize(),p.setXYZ(t+e,u.x,u.y,u.z)}}c.setAttribute("normal",p)}(p.current,f))},[m,d,f]),n.useImperativeHandle(v,()=>p.current),n.createElement("extrudeGeometry",(0,a.A)({ref:p,args:[m,d]},c))})}}]);