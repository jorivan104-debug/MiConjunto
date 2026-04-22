import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-surface-alt">
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0 md:pl-56">
        <AdminTopBar />
        <div className="md:hidden px-4 sm:px-6 pt-2 pb-1 bg-surface-alt border-b border-border">
          <AdminMobileNav />
        </div>
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
