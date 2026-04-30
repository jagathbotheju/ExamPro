import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/app/_components/admin/admin-sidebar';
import { AdminTopbar } from '@/app/_components/admin/admin-topbar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') redirect('/dashboard');

  const adminName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Admin';

  return (
    <div className="app">
      <AdminSidebar adminName={adminName} />
      <div className="app-main">
        <AdminTopbar adminName={adminName} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
