import { NextRequest, NextResponse } from "next/server";
import { getConfig, mutateConfig } from "@/lib/store";
export const dynamic = "force-dynamic";
export async function GET(){const config: any=await getConfig();return NextResponse.json({combos:config?.combos||{}});}
export async function PUT(req:NextRequest){
 const body=await req.json().catch(()=>null);
 if(!body||typeof body.combos!=="object"||body.combos===null||Array.isArray(body.combos))return NextResponse.json({error:'Body must be {"combos": {model: [targets]}}'},{status:400});
 const config=await getConfig();const connIds=new Set(Object.keys(config?.connections||{}));const clean:Record<string,string[]>={};
 for(const [model,targets] of Object.entries(body.combos)){if(!Array.isArray(targets))continue;const list=targets.filter(t=>typeof t==="string"&&t.includes("/")).filter(t=>connIds.has(t.slice(0,t.indexOf("/"))));if(list.length)clean[model]=list;}
 await mutateConfig(cfg=>{cfg.combos=clean;});return NextResponse.json({ok:true,combos:clean});
}
