import handler from 'vinext/server/fetch-handler';
import {accessUser} from './lib/access';
export default {
 async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
  const url=new URL(request.url);
  // The original Sites provisioning routes never run on a standalone employee deployment.
  if(['/api/bootstrap','/api/seed-file','/api/repair-empty-documents'].includes(url.pathname))return new Response('Not found',{status:404});
  const user=await accessUser(request.headers.get('Cf-Access-Jwt-Assertion'),env);
  if(!user)return new Response('請透過公司指定網址登入。尚未設定員工存取權，或登入已失效。',{status:401,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  if(url.pathname==='/signout-with-chatgpt')return Response.redirect(url.origin+'/cdn-cgi/access/logout',302);
  if(url.pathname==='/signin-with-chatgpt')return Response.redirect(url.origin+'/',302);
  const headers=new Headers(request.headers);
  for(const name of [...headers.keys()])if(name.toLowerCase().startsWith('oai-authenticated-'))headers.delete(name);
  headers.set('oai-authenticated-user-id',user.id);headers.set('oai-authenticated-user-email',user.email);
  // Caller-supplied identity is replaced only after signature / issuer / audience / expiry validation.
  if(env.ASSETS&&(request.method==='GET'||request.method==='HEAD')&&!url.pathname.startsWith('/api/')){const asset=await env.ASSETS.fetch(request);if(asset.status!==404)return asset}
  const result=await handler.fetch(new Request(request,{headers}),env,ctx);
  const response=new Response(result.body,result);response.headers.set('Cache-Control','private, no-store');response.headers.set('X-Content-Type-Options','nosniff');
  return response;
 }
};
