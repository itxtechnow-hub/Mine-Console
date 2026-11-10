import { getConfig } from "@/lib/store";
import Sidebar from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const config = await getConfig();
  const connections = Object.values(config.connections || {}).map((c) => ({ id: c.id, label: c.label, providerId: c.providerId, status: c.status }));
  return <div className="flex min-h-screen max-lg:flex-col"><Sidebar connections={connections} /><main className="flex-1 px-8 py-8 max-lg:px-4"><div className="mx-auto w-full max-w-4xl">{children}</div></main></div>;
}
