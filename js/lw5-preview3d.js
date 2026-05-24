(function () {
    'use strict';

    var LW = window.LW = window.LW || {};
    var preview3d = LW.preview3d = LW.preview3d || {};

    // ---- Theme Colors -------------------------------------------------------

    var COLORS = {
        gridMajor: 0x94a3b8,
        gridMinor: 0xcbd5e1,
        text: '#64748b',
        axisX: 0xef4444,
        axisY: 0x22c55e,
        feed: 0x449d9f,
        feedArc: 0xff6600,
        rapid: 0xffa500,
        machineBox: 0x555555,
        statsBox: 0x94a3b8,
        statsText: '#ffffff',
        statsBg: '#383838',
        bg: 0x1a1a1a
    };

    // ---- Module State -------------------------------------------------------

    var renderer, scene, camera, controls;
    var animFrameId = null;
    var canvas;

    var machineGroup, gridGroup, gcodeGroup, statsGroup, wcsGroup;
    var gcodeWorkerUrl = null;
    var gcodeWorker = null;

    var displayUnits = 'mm';
    var nativeUnits = 'mm';
    var gridBounds = null;
    var machineLimits = { x: 200, y: 200, z: 100 };
    var feedMesh = null;
    var feedColorsCache = null;

    // ---- Embedded Worker Code -----------------------------------------------

    function getWorkerBlob() {
        var code = [
            // Minimal Vector3 replacements (no THREE dependency)
            'function v3(x,y,z){return{x:x||0,y:y||0,z:z||0}}',
            'function v3d(a,b){var dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return Math.sqrt(dx*dx+dy*dy+dz*dz)}',
            'function v3c(v){return{x:v.x,y:v.y,z:v.z}}',
            'function v3a(d,a){d.x+=a.x;d.y+=a.y;d.z+=a.z}',
            'function v3s(d,a){d.x-=a.x;d.y-=a.y;d.z-=a.z}',
            'function v3m(d,s){d.x*=s;d.y*=s;d.z*=s}',
            'function v3n(d){var l=Math.sqrt(d.x*d.x+d.y*d.y+d.z*d.z);if(l>0){d.x/=l;d.y/=l;d.z/=l}}',
            'function v3x(d,a,b){d.x=a.y*b.z-a.z*b.y;d.y=a.z*b.x-a.x*b.z;d.z=a.x*b.y-a.y*b.x}',
            'function v3set(d,x,y,z){d.x=x;d.y=y;d.z=z}',
            '',
            // Arc point generation (replaces THREE.ArcCurve)
            'function arcPts(cx,cy,r,sa,ea,cw,n){',
            '  var pts=[],step=(ea-sa)/Math.max(n||20,1);',
            '  if(cw){if(step>0)step=-step}else if(step<0)step=-step;',
            '  for(var i=0;i<=(n||20);i++){var a=sa+step*i;pts.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)})}',
            '  return pts',
            '}',
            '',
            // Growable Float32Array
            'function Gb(c){this.a=new Float32Array(c||1<<20);this.n=0}',
            'Gb.prototype.push=function(x,y,z,x2,y2,z2){',
            '  if(this.n+6>this.a.length){var b=new Float32Array(this.a.length*2);b.set(this.a);this.a=b}',
            '  var d=this.a,l=this.n;d[l]=x;d[l+1]=y;d[l+2]=z;d[l+3]=x2;d[l+4]=y2;d[l+5]=z2;this.n+=6',
            '};',
            'Gb.prototype.g=function(){return this.a.subarray(0,this.n)};',
            '',
            // Growable Uint8Array
            'function Gbb(c){this.a=new Uint8Array(c||1<<20);this.n=0}',
            'Gbb.prototype.push=function(v,c){c=c||1;if(this.n+c>this.a.length){var b=new Uint8Array(this.a.length*2);b.set(this.a);this.a=b}for(var i=0;i<c;i++)this.a[this.n++]=v};',
            'Gbb.prototype.g=function(){return this.a.subarray(0,this.n)};',
            '',
            // GCode Parser
            'function GCP(h){this.h=h||{};this.la={cmd:null};this.lf=null;this.ct=null}',
            'GCP.prototype.p=function(g){',
            '  var self=this,len=g.length,lc=0;for(var i=0;i<len;i++)if(g[i]==="\\n")lc++;lc++;',
            '  this.lm=new Uint32Array((lc+1)*2);',
            '  var li=0,i=0,ip=false,is=false,ar={};',
            '  while(i<len){for(var k in ar)ar[k]=void 0;ar.indx=li;ar.cmd=null;ar.fr=self.lf;ar.t=self.ct;',
            '    var ht=false,cs=false,ck=null,vs=-1;',
            '    while(i<len){var c=g[i];',
            '      if(c==="\\n"||c==="\\r"){if(c==="\\n"){i++;break}i++;continue}',
            '      if(ip){if(c===")")ip=false;i++;continue}if(is){i++;continue}',
            '      if(c==="("){ip=true;i++;continue}if(c===";"){is=true;i++;continue}',
            '      if(c===" "||c==="\\t"){i++;continue}',
            '      var cd=c.charCodeAt(0)&~32,il=cd>=65&&cd<=90;',
            '      if(il){',
            '        if(ck){var vs2=g.substring(vs,i),vl=parseFloat(vs2);if(!isNaN(vl)){',
            '          if(!cs&&(ck==="G"||ck==="M"||ck==="T"||ck==="S")){ar.cmd=ck+vl;cs=true}',
            '          else{ar[ck.toLowerCase()]=vl}',
            '          if(ck==="F")self.lf=vl;if(ck==="T")self.ct=vl',
            '        }}',
            '        ck=String.fromCharCode(cd);vs=i+1;ht=true',
            '      }',
            '      i++',
            '    }',
            '    if(ck){var vs2=g.substring(vs,i),vl=parseFloat(vs2);if(!isNaN(vl)){',
            '      if(!cs&&(ck==="G"||ck==="M"||ck==="T"||ck==="S")){ar.cmd=ck+vl;cs=true}',
            '      else{ar[ck.toLowerCase()]=vl}',
            '      if(ck==="F")self.lf=vl;if(ck==="T")self.ct=vl',
            '    }}',
            '    is=false;',
'    if(ht){if(!ar.cmd)ar.cmd=self.la.cmd;ar.fr=self.lf;ar.t=self.ct;',
'      if(ar.cmd){var h=self.h[ar.cmd]||self.h["d"];if(h){self.la.cmd=ar.cmd;h(ar,li,self)}}}',
'    li++',
            '  }',
            '};',
            '',
            // Add segment helper
            'function addSeg(p1,p2,ar,gcp,rg,fg,ft){',
            '  if(p2.arc){',
            '    var v1=v3(p1.x,p1.y,p1.z),v2=v3(p2.x,p2.y,p2.z),va;',
            '    if(ar.r!=null){',
            '      var r=parseFloat(ar.r),q=v3d(v1,v2),cx=v3((v1.x+v2.x)/2,(v1.y+v2.y)/2,(v1.z+v2.z)/2);',
            '      var calc=Math.sqrt(Math.max(0,r*r-q*q/4)),dir=v3(0,0,0);',
            '      if(ar.pl==="G18")v3set(dir,p2.z-p1.z,0,p1.x-p2.x);',
            '      else if(ar.pl==="G19")v3set(dir,0,p2.z-p1.z,p1.y-p2.y);',
            '      else v3set(dir,p1.y-p2.y,p2.x-p1.x,0);',
            '      v3n(dir);var t=v3c(cx);v3m(t,calc);var t2=v3c(cx);v3m(t2,calc);',
            '      var arith=v3c(cx);v3a(arith,t);var asub=v3c(cx);v3s(asub,t2);',
            '      va=p2.cw===(r>0)?arith:asub',
            '    }else{va=v3(p2.arci,p2.arcj,p2.arck)}',
            '    var a1=ar.pl==="G18"?Math.atan2(p1.z-va.z,p1.x-va.x):ar.pl==="G19"?Math.atan2(p1.z-va.z,p1.y-va.y):Math.atan2(p2.y-va.y,p2.x-va.x);',
            '    var a2=ar.pl==="G18"?Math.atan2(p2.z-va.z,p2.x-va.x):ar.pl==="G19"?Math.atan2(p2.z-va.z,p2.y-va.y):Math.atan2(p2.y-va.y,p2.x-va.x);',
            '    var radius=v3d(v1,va);if(a1===a2)a2+=p2.cw?-Math.PI*2:Math.PI*2;var pts;',
            '    if(ar.pl==="G18")pts=arcPts(va.x,va.z,radius,a1,a2,p2.cw,20).map(function(p){return{x:p.x,y:-p.z,z:p.y}});',
            '    else if(ar.pl==="G19")pts=arcPts(va.y,va.z,radius,a1,a2,p2.cw,20).map(function(p){return{x:p.z,y:p.x,z:p.y}});',
            '    else pts=arcPts(va.x,va.y,radius,a1,a2,p2.cw,20);',
            '    var ds=0,si=fg.n/3;',
            '    for(var pi=0;pi<pts.length;pi++){var pt=pts[pi],pv=pi===0?p1:pts[pi-1];',
            '      var d=Math.sqrt((pt.x-pv.x)*(pt.x-pv.x)+(pt.y-pv.y)*(pt.y-pv.y)+(pt.z-pv.z)*(pt.z-pv.z));',
            '      ds+=d;fg.push(pv.x,pv.y,pv.z,pt.x,pt.y,pt.z);ft.push(2);ft.push(2)}',
            '    if(ar.indx!==void 0){gcp.lm[ar.indx*2]=si;gcp.lm[ar.indx*2+1]=pts.length*2}',
            '  }else{',
            '    var d=Math.sqrt((p2.x-p1.x)*(p2.x-p1.x)+(p2.y-p1.y)*(p2.y-p1.y)+(p2.z-p1.z)*(p2.z-p1.z));',
            '    var buf=p2.g0?rg:fg;var si=buf.n/3;',
            '    buf.push(p1.x,p1.y,p1.z,p2.x,p2.y,p2.z);',
            '    if(!p2.g0){ft.push(1);ft.push(2);if(ar.indx!==void 0){gcp.lm[ar.indx*2]=si;gcp.lm[ar.indx*2+1]=2}}',
            '  }',
            '}',
            '',
            // Helper to build move object
            'function mkMove(args,ll,rel,fld){',
            '  var o={x:args.x!==void 0?(rel?ll.x+args.x:args.x):ll.x,y:args.y!==void 0?(rel?ll.y+args.y:args.y):ll.y,z:args.z!==void 0?(rel?ll.z+args.z:args.z):ll.z};',
            '  o[fld]=true;return o',
            '}',
            '',
            // Main parse function
            'function go(g){',
            '  var ll={x:0,y:0,z:0},isMM=true,rel=false;',
            '  var rg=new Gb(),fg=new Gb(),ft=new Gbb();',
            '  var p=new GCP({',
            '    G0:function(ar){var nl=mkMove(ar,ll,rel,"g0");addSeg(ll,nl,ar,p,rg,fg,ft);ll=nl},',
            '    G1:function(ar){var nl=mkMove(ar,ll,rel,"g1");addSeg(ll,nl,ar,p,rg,fg,ft);ll=nl},',
            '    G2:function(ar){var nl=mkMove(ar,ll,rel,"arc");nl.arci=ll.x+(ar.i||0);nl.arcj=ll.y+(ar.j||0);nl.arck=ll.z+(ar.k||0);nl.cw=true;addSeg(ll,nl,ar,p,rg,fg,ft);ll=nl},',
            '    G3:function(ar){ar.cw=false;p.h.G2(ar)},',
            '    G20:function(){isMM=false},G21:function(){isMM=true},',
            '    G90:function(){rel=false},G91:function(){rel=true}',
            '  });',
            '  p.p(g);',
            '  return{rg:rg.g(),fg:fg.g(),ft:ft.g(),lm:p.lm,inch:!isMM}',
            '}',
            '',
            'self.onmessage=function(e){var r=go(e.data.data);self.postMessage(r,[r.rg.buffer,r.fg.buffer,r.ft.buffer,r.lm.buffer])};'
        ].join('\n');
        return URL.createObjectURL(new Blob([code], { type: 'application/javascript' }));
    }

    // ---- Init ---------------------------------------------------------------

    preview3d.init = function (c) {
        if (renderer) return;
        canvas = c;
        gcodeWorkerUrl = getWorkerBlob();

        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true
        });
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.setClearColor(COLORS.bg, 1);

        var parent = canvas.parentElement;
        var w = parent.clientWidth || 400;
        var h = parent.clientHeight || 300;

        scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        scene.add(new THREE.DirectionalLight(0xffffff, 1.0));

        camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
        camera.up.set(0, 0, 1);
        camera.position.set(0, -200, 200);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(0, 0, 0);
        controls.update();

        machineGroup = new THREE.Group();
        scene.add(machineGroup);

        wcsGroup = new THREE.Group();
        scene.add(wcsGroup);

        gcodeGroup = new THREE.Group();
        scene.add(gcodeGroup);

        gridGroup = new THREE.Group();
        scene.add(gridGroup);

        statsGroup = new THREE.Group();
        scene.add(statsGroup);

        renderMachineBox();
        renderWCSOrigin();
        renderCoolGrid();

        animFrameId = requestAnimationFrame(renderLoop);
    };

    // ---- Grid ---------------------------------------------------------------

    function renderCoolGrid() {
        gridGroup.clear();
        if (!gridBounds) updateGridBounds();

        var xmin = gridBounds.xmin, xmax = gridBounds.xmax;
        var ymin = gridBounds.ymin, ymax = gridBounds.ymax;

        var isDispIn = displayUnits === 'inch';
        var isNatIn = nativeUnits === 'inch';
        var sf = 1;
        if (isNatIn && !isDispIn) sf = 1 / 25.4;
        else if (!isNatIn && isDispIn) sf = 25.4;

        var wDisp = (xmax - xmin) / sf, hDisp = (ymax - ymin) / sf;
        var maxDim = Math.max(wDisp, hDisp);
        var rawStep = maxDim / 10;
        var mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
        var norm = rawStep / mag;
        var cleanStep;
        if (norm < 2) cleanStep = 1 * mag;
        else if (norm < 5) cleanStep = 2 * mag;
        else cleanStep = 5 * mag;
        cleanStep = Math.max(cleanStep, isDispIn ? 1.0 : 10.0);

        var majorScene = cleanStep * sf;
        var stepScene = majorScene / 5;
        var eps = 0.0001;

        function isMajor(v) {
            return Math.abs((v / sf) / cleanStep - Math.round((v / sf) / cleanStep)) < eps;
        }

        var verts = [], colors = [];
        var cMajor = new THREE.Color(COLORS.gridMajor);
        var cMinor = new THREE.Color(COLORS.gridMinor);

        var xStart = Math.floor(xmin / majorScene) * majorScene;
        var xEnd = Math.ceil(xmax / majorScene) * majorScene;
        var yStart = Math.floor(ymin / majorScene) * majorScene;
        var yEnd = Math.ceil(ymax / majorScene) * majorScene;

        for (var x = xStart; x <= xEnd + eps; x += stepScene) {
            if (x < xmin - eps || x > xmax + eps) continue;
            verts.push(x, ymin, 0, x, ymax, 0);
            if (isMajor(x)) {
                colors.push(cMajor.r, cMajor.g, cMajor.b, cMajor.r, cMajor.g, cMajor.b);
                var s = createTextSprite(parseFloat((x / sf).toPrecision(10)).toString());
                s.position.set(x, ymin - (isDispIn ? 0.5 * sf : 10 * sf), 0);
                gridGroup.add(s);
            } else {
                colors.push(cMinor.r, cMinor.g, cMinor.b, cMinor.r, cMinor.g, cMinor.b);
            }
        }

        for (var y = yStart; y <= yEnd + eps; y += stepScene) {
            if (y < ymin - eps || y > ymax + eps) continue;
            verts.push(xmin, y, 0, xmax, y, 0);
            if (isMajor(y)) {
                colors.push(cMajor.r, cMajor.g, cMajor.b, cMajor.r, cMajor.g, cMajor.b);
                var s = createTextSprite(parseFloat((y / sf).toPrecision(10)).toString());
                s.position.set(xmin - (isDispIn ? 0.8 * sf : 15 * sf), y, 0);
                gridGroup.add(s);
            } else {
                colors.push(cMinor.r, cMinor.g, cMinor.b, cMinor.r, cMinor.g, cMinor.b);
            }
        }

        if (verts.length > 0) {
            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            gridGroup.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, depthTest: false })));
        }

        // Highlight axes at origin
        if (xStart <= 0 && xEnd >= 0 && 0 >= xmin && 0 <= xmax) {
            var yg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, ymin, 0.05), new THREE.Vector3(0, ymax, 0.05)]);
            gridGroup.add(new THREE.LineSegments(yg, new THREE.LineBasicMaterial({ color: COLORS.axisY, depthTest: false })));
        }
        if (yStart <= 0 && yEnd >= 0 && 0 >= ymin && 0 <= ymax) {
            var xg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xmin, 0, 0.05), new THREE.Vector3(xmax, 0, 0.05)]);
            gridGroup.add(new THREE.LineSegments(xg, new THREE.LineBasicMaterial({ color: COLORS.axisX, depthTest: false })));
        }
    }

    // ---- Machine Box --------------------------------------------------------

    function renderMachineBox() {
        machineGroup.clear();
        var x = machineLimits.x, y = machineLimits.y, z = machineLimits.z;
        var p = [
            [-x, -y, 0], [x, -y, 0], [x, y, 0], [-x, y, 0],
            [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]
        ];
        var verts = [];
        function al(a, b) { verts.push(a[0], a[1], a[2], b[0], b[1], b[2]); }
        al(p[0], p[1]); al(p[1], p[2]); al(p[2], p[3]); al(p[3], p[0]);
        al(p[4], p[5]); al(p[5], p[6]); al(p[6], p[7]); al(p[7], p[4]);
        al(p[0], p[4]); al(p[1], p[5]); al(p[2], p[6]); al(p[3], p[7]);

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        var mat = new THREE.LineDashedMaterial({ color: COLORS.machineBox, dashSize: 4, gapSize: 4, transparent: true, opacity: 0.6, depthWrite: false, depthTest: false });
        var lines = new THREE.LineSegments(geo, mat);
        lines.computeLineDistances();
        machineGroup.add(lines);

        var sphere = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 12), new THREE.MeshBasicMaterial({ color: COLORS.machineBox, transparent: true, opacity: 0.6 }));
        machineGroup.add(sphere);
    }

    // ---- WCS Origin ---------------------------------------------------------

    function renderWCSOrigin() {
        wcsGroup.clear();
        var axes = new THREE.AxesHelper(15);
        axes.material.depthTest = false;
        wcsGroup.add(axes);
    }

    // ---- Job Stats (Extents Cube) -------------------------------------------

    function renderJobStats(box) {
        statsGroup.clear();
        if (!box || box.isEmpty()) return;

        var size = new THREE.Vector3();
        box.getSize(size);
        var center = new THREE.Vector3();
        box.getCenter(center);

        var boxGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
        var edges = new THREE.EdgesGeometry(boxGeo);
        var line = new THREE.LineSegments(edges, new THREE.LineDashedMaterial({ color: COLORS.statsBox, dashSize: 3, gapSize: 2, transparent: true, opacity: 0.7, depthTest: false }));
        line.computeLineDistances();
        line.position.copy(center);
        statsGroup.add(line);

        var isDispIn = displayUnits === 'inch';
        var isNatIn = nativeUnits === 'inch';
        var ud = 1;
        if (!isNatIn && isDispIn) ud = 25.4;
        else if (isNatIn && !isDispIn) ud = 1 / 25.4;
        var ul = isDispIn ? 'in' : 'mm';
        var margin = 5;

        var xp = createTextPlane('X: ' + (size.x / ud).toFixed(2) + ul);
        xp.position.set(center.x, box.min.y - margin, box.min.z);
        statsGroup.add(xp);

        var yp = createTextPlane('Y: ' + (size.y / ud).toFixed(2) + ul);
        yp.position.set(box.min.x - margin, center.y, box.min.z);
        yp.rotation.z = Math.PI / 2;
        statsGroup.add(yp);

        var zp = createTextPlane('Z: ' + (size.z / ud).toFixed(2) + ul);
        zp.position.set(box.min.x, box.max.y + margin, center.z);
        zp.rotation.x = Math.PI / 2;
        statsGroup.add(zp);
    }

    // ---- Text Helpers -------------------------------------------------------

    function createTextSprite(text) {
        var res = 4;
        var fs = 24 * res, b = 10 * res;
        var c = document.createElement('canvas');
        var w = Math.max(text.length * (fs * 0.6) + b * 2, 32);
        var h2 = fs + b * 2;
        c.width = w; c.height = h2;
        var ctx = c.getContext('2d');
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold ' + fs + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w / 2, h2 / 2);
        var tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
        var sprite = new THREE.Sprite(mat);
        var sc = 0.25 / res;
        sprite.scale.set(w * sc, h2 * sc, 1);
        return sprite;
    }

    function createTextPlane(text) {
        var fs = 60, b = 10;
        var cw = Math.max(text.length * (fs * 0.6) + b * 4, 64);
        var ch = fs + b * 2;
        var c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        var ctx = c.getContext('2d');
        ctx.fillStyle = COLORS.statsBg;
        var r = 16;
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.lineTo(cw - r, 0);
        ctx.quadraticCurveTo(cw, 0, cw, r);
        ctx.lineTo(cw, ch - r);
        ctx.quadraticCurveTo(cw, ch, cw - r, ch);
        ctx.lineTo(r, ch);
        ctx.quadraticCurveTo(0, ch, 0, ch - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = COLORS.statsText;
        ctx.font = 'bold ' + fs + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cw / 2, ch / 2);
        var tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
        var sc = 0.15;
        return new THREE.Mesh(new THREE.PlaneGeometry(cw * sc, ch * sc), mat);
    }

    // ---- Grid Bounds --------------------------------------------------------

    function updateGridBounds(forceBox) {
        var box = forceBox || getGcodeBox();
        if (box && !box.isEmpty()) {
            gridBounds = { xmin: box.min.x - 20, ymin: box.min.y - 20, xmax: box.max.x + 20, ymax: box.max.y + 20, zmin: box.min.z };
        } else {
            gridBounds = { xmin: -100, ymin: -100, xmax: 100, ymax: 100, zmin: 0 };
        }
    }

    function getGcodeBox() {
        var box = new THREE.Box3();
        gcodeGroup.children.forEach(function (child) {
            if (child.geometry) {
                if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
                box.union(child.geometry.boundingBox);
            }
        });
        return box;
    }

    // ---- G-Code Rendering ---------------------------------------------------

    function clearGcode() {
        while (gcodeGroup.children.length) {
            var child = gcodeGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            gcodeGroup.remove(child);
        }
        feedMesh = null;
        feedColorsCache = null;
    }

    preview3d.updateGcode = function (result) {
        clearGcode();
        if (!result) return;

        nativeUnits = result.inch ? 'inch' : 'mm';

        if (result.fg && result.fg.length > 0) {
            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(result.fg, 3));

            var colorBuffer = new Float32Array(result.fg.length);
            var colorG1 = new THREE.Color(COLORS.feed);
            var colorG23 = new THREE.Color(COLORS.feedArc);
            var ft = result.ft;

            for (var i = 0; i < colorBuffer.length; i += 6) {
                var type = (ft && (i / 3) < ft.length) ? ft[i / 3] : 1;
                var c = (type === 2) ? colorG23 : colorG1;
                colorBuffer[i] = c.r; colorBuffer[i+1] = c.g; colorBuffer[i+2] = c.b;
                colorBuffer[i+3] = c.r; colorBuffer[i+4] = c.g; colorBuffer[i+5] = c.b;
            }
            feedColorsCache = new Float32Array(colorBuffer);
            geo.setAttribute('color', new THREE.Float32BufferAttribute(colorBuffer, 3));

            feedMesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, depthTest: false }));
            gcodeGroup.add(feedMesh);
        }

        if (result.rg && result.rg.length > 0) {
            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(result.rg, 3));
            gcodeGroup.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: COLORS.rapid, transparent: true, opacity: 0.4, depthTest: false })));
        }

        var box = getGcodeBox();
        if (!box.isEmpty()) {
            updateGridBounds(box);
            renderCoolGrid();
            renderJobStats(box);
            resetCamera();
        }
    };

    // ---- Worker Interface ---------------------------------------------------

    preview3d.processGcode = function (gcode) {
        if (!gcode) return;
        if (gcodeWorker) { gcodeWorker.terminate(); gcodeWorker = null; }

        gcodeWorker = new Worker(gcodeWorkerUrl);
        gcodeWorker.onmessage = function (e) {
            preview3d.updateGcode(e.data);
            gcodeWorker.terminate();
            gcodeWorker = null;
        };
        gcodeWorker.postMessage({ data: gcode });
    };

    // ---- Camera -------------------------------------------------------------

    function resetCamera() {
        var box = getGcodeBox();
        var center = new THREE.Vector3(0, 0, 0);
        var maxDim = 100;

        if (!box.isEmpty()) {
            center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            maxDim = Math.max(size.x, size.y, size.z || 1);
        } else {
            var gridBox = new THREE.Box3().setFromObject(gridGroup);
            if (!gridBox.isEmpty() && isFinite(gridBox.min.x)) {
                center = gridBox.getCenter(new THREE.Vector3());
                var size = gridBox.getSize(new THREE.Vector3());
                maxDim = Math.max(size.x, size.y, size.z || 100);
            }
        }
        if (maxDim < 1) maxDim = 100;

        var targetPos = new THREE.Vector3(center.x, center.y - maxDim * 1.5, center.z + maxDim);
        var startPos = camera.position.clone();
        var startTarget = controls.target.clone();
        var duration = 600, startTime = Date.now();

        function anim() {
            var elapsed = Date.now() - startTime;
            var p = Math.min(elapsed / duration, 1);
            var ease = 1 - Math.pow(1 - p, 3);
            camera.position.lerpVectors(startPos, targetPos, ease);
            controls.target.lerpVectors(startTarget, center, ease);
            controls.update();
            if (p < 1) requestAnimationFrame(anim);
        }
        requestAnimationFrame(anim);
    }

    // ---- Render Loop --------------------------------------------------------

    function renderLoop() {
        if (!renderer || !scene || !camera) return;
        controls.update();
        renderer.render(scene, camera);
        animFrameId = requestAnimationFrame(renderLoop);
    }

    // ---- Public API ---------------------------------------------------------

    preview3d.resize = function (w, h) {
        if (!camera || !renderer) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    };

    preview3d.clear = function () {
        clearGcode();
        statsGroup.clear();
        wcsGroup.clear();
        machineGroup.clear();
        gridGroup.clear();
        gridBounds = null;
    };

    preview3d.setUnits = function (units) {
        if (displayUnits === units) return;
        displayUnits = units;
        renderCoolGrid();
        var box = getGcodeBox();
        if (!box.isEmpty()) renderJobStats(box);
    };

    preview3d.setMachineLimits = function (x, y, z) {
        machineLimits = { x: x, y: y, z: z };
        renderMachineBox();
    };

    preview3d.getCamera = function () { return camera; };
    preview3d.getControls = function () { return controls; };

})();
