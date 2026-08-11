import OwnerSidebar from "@/components/OwnerSidebar";

export default function OwnerLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <OwnerSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}