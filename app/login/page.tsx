import { Suspense } from "react";
import LoginForm from "@/components/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ fontStretch: "118%" }}>
          OmniRoute
        </h1>
        <p className="mt-1 text-sm text-dim">One AI gateway, your providers, automatic fallback.</p>
        <div className="mt-6 rounded-md border border-line bg-panel p-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
