import { NextRequest, NextResponse } from "next/server";
import { getConfig, mutateConfig, encryptSecret, newId, maskSecret } from "@/lib/store";
export const dynamic = "force-dynamic";
function publicConn(c:Record<string,unknown>){const {keyEnc,...rest}=c as {keyEnc?:string};return {...rest,keyMasked:maskSecret(keyEnc||"")};}
export async function GET(){const config=await getConfig();return NextResponse.json({connections:Object.values(config.connections||{}).map(publicConn)});}
export async function POST(req:NextRequest){
 const body=await req.json().catch(()=>null);
 if(!body||!body.providerId||!body.name||!body.baseUrl||!body.apiKey)return NextResponse.json({error:"providerId, name, baseUrl and apiKey are required."},{status:400});
 const protocol=body.protocol==="anthropic"?"anthropic":"openai";const baseUrl=String(body.baseUrl).replace(/\/+$/,"");
 if(!/^https?:\/\//.test(baseUrl))return NextResponse.json({error:"baseUrl must start with http:// or https://"},{status:400});
 const conn={id:newId(String(body.providerId)),providerId:String(body.providerId),name:String(body.name),label:String(body.label||body.name),baseUrl,protocol,keyEnc:encryptSecret(String(body.apiKey)),models:[],status:"unverified",lastTestedAt:null,lastLatencyMs:null,addedAt:Date.now()};
 await mutateConfig(config=>{config.connections[conn.id]=conn;});return NextResponse.json({ok:true,connection:publicConn(conn)},{status:201});
}
