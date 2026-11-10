import { clearLogs } from "@/lib/store";
export const dynamic = "force-dynamic";
export async function DELETE(){await clearLogs();return Response.json({ok:true});}
