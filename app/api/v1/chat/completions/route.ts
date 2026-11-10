import { handleChatCompletions } from "@/lib/gateway";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export async function POST(req:Request){return handleChatCompletions(req);}
