/* Validate the Vite application, preserved demos and authored manuscript. */
const fs=require('fs'),path=require('path'),assert=require('assert'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{if(['node_modules','.git','.qa','dist'].includes(e.name))return [];const p=path.join(dir,e.name);return e.isDirectory()?walk(p):[p];});}
let references=0;
function check(html,file,content=false){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'Duplicate IDs: '+file);
 for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(https?:|mailto:|tel:|data:)/i.test(raw))continue;
  const [part,hash]=raw.replaceAll('&amp;','&').split('?')[0].split('#');
  let target=part.startsWith('/')?path.join(root,part.slice(1)):part?path.resolve(content?path.join(root,'public'):path.dirname(file),decodeURIComponent(part)):file;
  if(!fs.existsSync(target)&&part.startsWith('/'))target=path.join(root,'public',part.slice(1));
  if(target===path.join(root,'public','index.html'))target=path.join(root,'index.html');
  assert(fs.existsSync(target),'Missing '+raw+' in '+file);
  if(hash&&path.extname(target)==='.html')assert(fs.readFileSync(target,'utf8').includes('id="'+hash+'"'),'Missing anchor '+raw);
  references++;
 }
}
(async()=>{
 const files=walk(root);
 for(const p of files.filter(p=>p.endsWith('.html')))check(fs.readFileSync(p,'utf8'),p);
 for(const p of files.filter(p=>/\.(js|cjs)$/i.test(p)))cp.execFileSync(process.execPath,['--check','--input-type='+ (p.endsWith('.cjs')?'commonjs':'module')],{input:fs.readFileSync(p,'utf8')});
 const {PAGES,CHAPTERS}=await import('../src/manuscript/content.js');
 assert.equal(new Set(PAGES.map(p=>p.id)).size,PAGES.length);
 for(const face of PAGES)check(face.html,path.join(root,'index.html'),true);
 for(const c of CHAPTERS){const face=PAGES[c.spread*2+(c.side||0)];assert(face&&face.folio===c.folio,'Chapter destination: '+c.id);}
 const {projectOntoSpread}=await import('../src/manuscript/SpreadProjection.js');
 const corners=[{x:20,y:30},{x:700,y:60},{x:660,y:800},{x:50,y:760}],m=projectOntoSpread(corners,1200,900);
 [[0,0],[1200,0],[1200,900],[0,900]].forEach(([x,y],i)=>{const w=m[3]*x+m[7]*y+m[15];assert(Math.abs((m[0]*x+m[4]*y+m[12])/w-corners[i].x)<0.001);assert(Math.abs((m[1]*x+m[5]*y+m[13])/w-corners[i].y)<0.001);});
 console.log('PASS: '+references+' local references, unique IDs, JavaScript syntax, chapter destinations and projection.');
})().catch(e=>{console.error(e);process.exitCode=1;});
