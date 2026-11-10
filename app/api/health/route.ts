import { getConfig, blobStatus } from "@/lib/store";
export const dynamic = "force-dynamic";
export async function GET() { const config=await getConfig(); const conns=Object.values(config.connections||{}); return Response.json({ok:true,service:"omniroute-vercel",providers:conns.length,models:conns.reduce((n,c)=>n+((c.models&&c.models.length)||0),0),combos:Object.keys(config.combos||{}).length,storage:blobStatus()}); }
