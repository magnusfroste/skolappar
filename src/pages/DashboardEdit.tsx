import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout';
import { AppEditPanel } from '@/components/AppEditPanel';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardEdit() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { state: { from: `/min-sida/app/${id}` } });
    }
  }, [user, loading, navigate, id]);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full max-w-2xl" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!user || !id) return null;

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <AppEditPanel appId={id} />
      </div>
    </AuthenticatedLayout>
  );
}
