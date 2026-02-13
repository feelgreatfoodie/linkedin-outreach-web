import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <>
      <Sidebar user={session.user} />
      <main className="pl-64">
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </>
  );
}
