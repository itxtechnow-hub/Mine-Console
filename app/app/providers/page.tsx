import { getConfig } from "@/lib/store";
import catalogData from "@/data/provider-catalog.json";
import CatalogBrowser from "@/components/catalog-browser";
export const dynamic = "force-dynamic";
type CatalogEntry={id:string;name:string;category:string;website?:string;baseUrl?:string;protocol?:string;verified?:boolean;hasFree?:boolean;adapterRequired?:boolean};
export default async function ProvidersPage(){
 const config=await getConfig(); const catalog=catalogData as unknown as {count:number;providers:CatalogEntry[]};
 const connections=Object.values(config.connections||{}).map(c=>({id:c.id,label:c.label,providerId:c.providerId,status:c.status,baseUrl:c.baseUrl}));
 return <div><h1 className="text-xl font-semibold tracking-tight" style={{fontStretch:"118%"}}>Providers</h1><p className="mt-1 max-w-[65ch] text-sm text-dim">The catalogue below is converted from OmniRoute&apos;s provider registry ({catalog.count} entries). Adding a provider creates a branch in the sidebar. Providers without a listed base URL work with any OpenAI-compatible endpoint — paste the base URL when adding.</p><CatalogBrowser catalog={catalog.providers} connections={connections}/></div>;
}
