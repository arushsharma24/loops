import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/home");
  }

  return (
    <main className="auth-shell">
      <div className="auth-background" />
      <AuthCard />
    </main>
  );
}
