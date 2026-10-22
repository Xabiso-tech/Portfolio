const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.JS':'application/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.py':'text/plain'};
const server=http.createServer((req,res)=>{let relative;try{relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/Portfolio(?=\/|$)/,'');}catch{res.writeHead(400);return res.end();}let target=path.resolve(root,'.'+relative);if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403);return res.end();}if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');fs.readFile(target,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});res.end(error?'Not found':data);});});
if(require.main===module)server.listen(8000,'127.0.0.1',()=>console.log('Portfolio: http://127.0.0.1:8000/Portfolio/'));
module.exports=server;
