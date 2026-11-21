import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { AppEditPanel } from '@/components/AppEditPanel';

export default function AdminAppEdit() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl">{id && <AppEditPanel appId={id} />}</div>
    </AdminLayout>
  );
}
