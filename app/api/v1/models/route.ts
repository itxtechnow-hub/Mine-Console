import { checkGatewayKey, buildModelsList } from "@/lib/gateway";
import { getConfig } from "@/lib/store";
export const dynamic = "force-dynamic";
export async function GET(req:Request) {
 if(!checkGatewayKey(req))return Response.json({error:{message:'Missing or invalid gateway key. Send "Authorization: Bearer YOUR_GATEWAY_KEY".',status:401}},{status:401});
 const config=await getConfig(); return Response.json(await buildModelsList(config));
}
