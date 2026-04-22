import { BottomNav } from "@/components/navigation/BottomNav";
import { TopNav } from "@/components/navigation/TopNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      <main className="flex-1 md:pt-16 pb-20 md:pb-6">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
