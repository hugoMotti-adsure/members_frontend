"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function SwitchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("switch_token");
    const tenantId = searchParams.get("switch_tenant");
    const tenantName = searchParams.get("switch_name");

    if (token && tenantId) {
      // Aplica o token de switch no localStorage para esta aba
      localStorage.setItem("access_token", token);
      localStorage.setItem("tenant_id", tenantId);

      // Redireciona para o dashboard da escola
      router.replace("/dashboard");
    } else {
      router.replace("/platform");
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Acessando escola...</p>
      </div>
    </div>
  );
}

export default function SwitchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SwitchContent />
    </Suspense>
  );
}
