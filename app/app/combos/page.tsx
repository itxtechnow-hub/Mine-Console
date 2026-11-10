import { getConfig } from "@/lib/store";
import CombosEditor from "@/components/combos-editor";
export const dynamic = "force-dynamic";
export default async function CombosPage() {
 const config=await getConfig(); const connections=Object.values(config.connections||{}).map(c=>({id:c.id,label:c.label,models:(c.models||[]).map(m=>m.id)}));
 return <div><h1 className="text-xl font-semibold tracking-tight" style={{fontStretch:"118%"}}>Combos</h1><p className="mt-1 max-w-[65ch] text-sm text-dim">A combo maps one public model name to an ordered chain of connections. The first target is primary; on rate limit, outage, timeout or error the gateway falls through to the next — OmniRoute&apos;s quota-aware fallback, in order you choose.</p><CombosEditor connections={connections} combos={config.combos||{}}/></div>;
}
