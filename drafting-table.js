/* The Drafting Table. Strokes are stored as vectors in a fixed 1200 ? 800
   coordinate system. Resizing only changes CSS: no artwork is lost, and undo
   replays the same deterministic marks instead of keeping large bitmap copies. */
(() => {
 'use strict';
 const canvas=document.getElementById('drawing-canvas');if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const get=id=>document.getElementById(id);
 get('draft-app').hidden=false;
 const W=canvas.width,H=canvas.height;
 const ink=document.createElement('canvas');ink.width=W;ink.height=H;
 const pen=ink.getContext('2d');
 const undo=get('draft-undo'),redo=get('draft-redo'),status=get('draft-status');
 const paper={ivory:'#faf7f0',white:'#ffffff',toned:'#d8c7a8'};
 let strokes=[],future=[],active=null,pointer=null,tool='pencil',keyPoint={x:W/2,y:H/2},keyDrawing=false,keyboardCursor=true;
 const tools=[...document.querySelectorAll('[data-tool]')];
 tools.forEach(b=>b.addEventListener('click',()=>{finish();tool=b.dataset.tool;tools.forEach(other=>other.setAttribute('aria-pressed',String(other===b)));status.textContent=tool+' selected.';}));
 get('brush-size').addEventListener('input',e=>get('size-value').textContent=e.target.value);
 get('brush-opacity').addEventListener('input',e=>get('opacity-value').textContent=e.target.value+'%');
 function brush(){return {tool,size:Number(get('brush-size').value),opacity:Number(get('brush-opacity').value)/100,grade:Number(get('pencil-grade').value),points:[]};}
 function point(event){const r=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(W,(event.clientX-r.left)*W/r.width)),y:Math.max(0,Math.min(H,(event.clientY-r.top)*H/r.height)),pressure:event.pointerType==='pen'?Math.max(.15,event.pressure):.65};}
 // A seeded noise function gives charcoal texture consistent undo/redo rendering.
 function noise(n){const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x);}
 function segment(stroke,a,b,index){
  const erase=stroke.tool==='eraser';pen.globalCompositeOperation=erase?'destination-out':'source-over';
  pen.strokeStyle='#302d28';pen.fillStyle='#302d28';pen.lineCap='round';pen.lineJoin='round';
  const pressure=b.pressure||.65;const width=stroke.size*(.55+pressure);
  pen.globalAlpha=erase?1:stroke.opacity*stroke.grade;
  if(stroke.tool==='charcoal'){
   const distance=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(distance/2));
   pen.globalAlpha=stroke.opacity*.18;
   for(let step=0;step<=steps;step++)for(let speck=0;speck<10;speck++){
    const seed=index*10007+step*37+speck*3;
    const x=a.x+(b.x-a.x)*step/steps+(noise(seed)-.5)*width*3;
    const y=a.y+(b.y-a.y)*step/steps+(noise(seed+1)-.5)*width*3;
    pen.beginPath();pen.ellipse(x,y,.4+noise(seed+2)*width*.15,.4+noise(seed+3)*width*.1,0,0,Math.PI*2);pen.fill();
   }
  }else{
   pen.lineWidth=erase?width*4:width;pen.beginPath();pen.moveTo(a.x,a.y);pen.lineTo(b.x,b.y);pen.stroke();
   if(a.x===b.x&&a.y===b.y){pen.beginPath();pen.arc(b.x,b.y,pen.lineWidth/2,0,Math.PI*2);pen.fill();}
  }
  pen.globalAlpha=1;pen.globalCompositeOperation='source-over';
 }
 function paint(target=ctx,showCursor=false){
  target.fillStyle=paper[get('draft-paper').value];target.fillRect(0,0,W,H);
  // The optional construction grid is part of the exported paper, not the ink.
  if(get('draft-grid').checked){target.strokeStyle='#71685925';target.lineWidth=1;target.beginPath();for(let x=0;x<W;x+=40){target.moveTo(x,0);target.lineTo(x,H);}for(let y=0;y<H;y+=40){target.moveTo(0,y);target.lineTo(W,y);}target.stroke();}
  target.drawImage(ink,0,0);
  if(showCursor){target.strokeStyle='#965138';target.lineWidth=1;target.beginPath();target.arc(keyPoint.x,keyPoint.y,7,0,Math.PI*2);target.moveTo(keyPoint.x-12,keyPoint.y);target.lineTo(keyPoint.x+12,keyPoint.y);target.moveTo(keyPoint.x,keyPoint.y-12);target.lineTo(keyPoint.x,keyPoint.y+12);target.stroke();}
 }
 function update(){undo.disabled=!strokes.length;redo.disabled=!future.length;status.textContent=strokes.length+' mark'+(strokes.length===1?'':'s')+' on the page. '+(future.length?'Redo available.':'');}
 function replay(){pen.clearRect(0,0,W,H);for(const stroke of strokes){if(stroke.tool==='clear'){pen.clearRect(0,0,W,H);continue;}stroke.points.forEach((p,i)=>segment(stroke,stroke.points[Math.max(0,i-1)],p,i));}paint(ctx,keyboardCursor&&document.activeElement===canvas);update();}
 function start(p){active=brush();active.points.push(p);segment(active,p,p,0);paint();}
 function extend(p){if(!active)return;const prev=active.points[active.points.length-1];active.points.push(p);segment(active,prev,p,active.points.length-1);paint();}
 function finish(){if(active){strokes.push(active);future=[];active=null;update();}if(pointer!==null){if(canvas.hasPointerCapture(pointer))canvas.releasePointerCapture(pointer);pointer=null;}keyDrawing=false;}
 canvas.addEventListener('pointerdown',e=>{if(pointer!==null||e.button!==0)return;e.preventDefault();finish();keyboardCursor=false;canvas.focus({preventScroll:true});pointer=e.pointerId;canvas.setPointerCapture(pointer);start(point(e));});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer||!active)return;e.preventDefault();const samples=e.getCoalescedEvents?e.getCoalescedEvents():[];const events=samples.length?samples:[e];for(const sample of events)extend(point(sample));});
 canvas.addEventListener('pointerup',e=>{if(e.pointerId===pointer)finish();});
 canvas.addEventListener('pointercancel',e=>{if(e.pointerId===pointer)finish();});
 canvas.addEventListener('lostpointercapture',()=>finish());
 undo.addEventListener('click',()=>{finish();if(strokes.length){future.push(strokes.pop());replay();}});
 redo.addEventListener('click',()=>{finish();if(future.length){strokes.push(future.pop());replay();}});
 // Clearing is itself undoable, so an accidental click never destroys the study.
 get('draft-clear').addEventListener('click',()=>{finish();if(strokes.length){strokes.push({tool:'clear',points:[]});future=[];replay();}});
 [get('draft-paper'),get('draft-grid')].forEach(control=>control.addEventListener('change',()=>paint()));
 canvas.addEventListener('focus',()=>paint(ctx,keyboardCursor));canvas.addEventListener('blur',()=>{finish();paint();});
 canvas.addEventListener('keydown',e=>{
  keyboardCursor=true;
  if(e.key===' '){e.preventDefault();if(keyDrawing){finish();}else{start({...keyPoint,pressure:.65});keyDrawing=true;}paint(ctx,true);return;}
  const deltas={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};const delta=deltas[e.key];if(!delta)return;e.preventDefault();const step=e.shiftKey?25:5;keyPoint={x:Math.max(0,Math.min(W,keyPoint.x+delta[0]*step)),y:Math.max(0,Math.min(H,keyPoint.y+delta[1]*step))};if(keyDrawing)extend({...keyPoint,pressure:.65});paint(ctx,true);
 });
 get('draft-export').addEventListener('click',()=>{
  finish();const output=document.createElement('canvas');output.width=W;output.height=H;paint(output.getContext('2d'));
  output.toBlob(blob=>{if(!blob){status.textContent='PNG export failed. Please try again.';return;}const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='my-drafting-table-study.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent='Your PNG has been prepared for download.';},'image/png');
 });
 paint();
})();
