// Gateway request routing and OpenAI/Anthropic protocol adapters.
import { getConfig, decryptSecret, addLog } from "./store";

function json(data,status=200){return Response.json(data,{status});}
function error(status,message){return json({error:{message,type:"gateway_error",status}},status);}
export function checkGatewayKey(req){const key=process.env.GATEWAY_KEY;return Boolean(key)&&(req.headers.get("authorization")||"")===`Bearer ${key}`;}
export function resolveChain(model,config){
 const out=[];const seen=new Set();const push=(id,upstream)=>{const conn=config.connections?.[id];if(!conn||conn.status==="disabled"||!upstream)return;const k=id+":"+upstream;if(seen.has(k))return;seen.add(k);out.push({conn,model:upstream});};
 for(const target of config.combos?.[model]||[]){const i=String(target).indexOf("/");if(i>0)push(String(target).slice(0,i),String(target).slice(i+1));}
 if(!out.length)for(const conn of Object.values(config.connections||{}))push(conn.id,model);
 return out;
}
export function buildModelsList(config){const out=[];const seen=new Set();for(const conn of Object.values(config.connections||{})){for(const m of conn.models||[]){if(seen.has(m.id))continue;seen.add(m.id);out.push({id:m.id,object:"model",created:0,owned_by:conn.providerId,source:m.source||"manual",provider:{id:conn.providerId,connection:conn.id,name:conn.label||conn.providerId,base_url:conn.baseUrl,protocol:conn.protocol}});}}for(const model of Object.keys(config.combos||{})){if(!seen.has(model)){seen.add(model);out.push({id:model,object:"model",created:0,owned_by:"combo",source:"combo",provider:null});}}return {object:"list",data:out.sort((a,b)=>a.id.localeCompare(b.id))};}
async function dispatch(target,body){
 const {conn,model}=target;const key=decryptSecret(conn.keyEnc);if(!key)throw new Error("Provider credential unavailable");
 const anthropic=conn.protocol==="anthropic";const url=conn.baseUrl.replace(/\/+$/,"")+(anthropic?"/v1/messages":"/chat/completions");
 const payload={...body,model};const headers={"content-type":"application/json"};
 if(anthropic){headers["x-api-key"]=key;headers["anthropic-version"]="2023-06-01";delete payload.n;delete payload.frequency_penalty;delete payload.presence_penalty;}
 else headers.authorization=`Bearer ${key}`;
 const response=await fetch(url,{method:"POST",headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(Number(process.env.GATEWAY_TIMEOUT_MS)||60000)});
 if(!response.ok){const detail=(await response.text()).slice(0,1500);const e=new Error(`Provider returned HTTP ${response.status}: ${detail}`);e.status=response.status;throw e;}
 const data=await response.json();
 if(anthropic){const text=(data.content||[]).filter(x=>x.type==="text").map(x=>x.text).join("");return {id:data.id,object:"chat.completion",created:Math.floor(Date.now()/1000),model:body.model,choices:[{index:0,message:{role:"assistant",content:text||null},finish_reason:data.stop_reason==="max_tokens"?"length":"stop"}],usage:{prompt_tokens:data.usage?.input_tokens||0,completion_tokens:data.usage?.output_tokens||0,total_tokens:(data.usage?.input_tokens||0)+(data.usage?.output_tokens||0)}};}
 return data;
}
export async function handleChatCompletions(req){
 if(!checkGatewayKey(req))return error(401,'Missing or invalid gateway key. Send "Authorization: Bearer YOUR_GATEWAY_KEY".');
 let body;try{body=await req.json();}catch{return error(400,"Request body must be valid JSON.");}
 if(!body?.model||!Array.isArray(body.messages))return error(400,'Body must include "model" and "messages".');
 const config=await getConfig();const chain=resolveChain(body.model,config);if(!chain.length)return error(400,`No provider connection can serve model "${body.model}".`);
 const started=Date.now();let last;
 for(const target of chain){try{const data=await dispatch(target,body);await addLog({model:body.model,provider:target.conn.providerId,conn:target.conn.id,status:200,ms:Date.now()-started,protocol:"openai",stream:false,usage:data.usage});data.model=body.model;return json(data);}catch(e){last=e;}}
 await addLog({model:body.model,provider:chain[0].conn.providerId,conn:chain[0].conn.id,status:last?.status||502,ms:Date.now()-started,error:String(last?.message||last)});
 return error(last?.status||502,`All ${chain.length} connection(s) failed. Last error: ${String(last?.message||last)}`);
}
export async function handleMessages(req){
 if(!checkGatewayKey(req))return error(401,'Missing or invalid gateway key. Send "Authorization: Bearer YOUR_GATEWAY_KEY".');
 let body;try{body=await req.json();}catch{return error(400,"Request body must be valid JSON.");}
 if(!body?.model||!Array.isArray(body.messages))return error(400,'Body must include "model" and "messages".');
 const messages=[];if(body.system)messages.push({role:"system",content:typeof body.system==="string"?body.system:(body.system||[]).map(x=>x.text||"").join("\n")});
 for(const m of body.messages)messages.push({role:m.role,content:Array.isArray(m.content)?m.content.filter(x=>x.type==="text").map(x=>x.text).join("\n"):m.content});
 const result=await handleChatCompletions(new Request(req.url,{method:"POST",headers:req.headers,body:JSON.stringify({model:body.model,messages,max_tokens:body.max_tokens,temperature:body.temperature,stream:false})}));
 if(!result.ok)return result;const data=await result.json();const text=data.choices?.[0]?.message?.content||"";
 return json({id:data.id,type:"message",role:"assistant",model:body.model,content:[{type:"text",text}],stop_reason:"end_turn",usage:{input_tokens:data.usage?.prompt_tokens||0,output_tokens:data.usage?.completion_tokens||0}});
}
