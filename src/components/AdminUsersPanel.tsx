import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, ThumbsUp, Lightbulb, Shield, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppStatusBadge } from '@/components/AppStatusBadge';
import { fetchAdminUsers, totalClicks, type AdminUser } from '@/lib/adminUsers';

const date = (d: string | null) => (d ? new Date(d).toLocaleDateString('sv-SE') : '–');

function UserRow({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const name = user.display_name || user.email || 'Okänd';
  return (
    <Card>
      <button className="w-full text-left min-h-12 p-4 flex items-center gap-3" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback>{name[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-medium truncate">
            {name}{user.is_admin && <Shield className="h-3.5 w-3.5 text-primary shrink-0" aria-label="Admin" />}
          </div>
          <div className="text-xs text-muted-foreground truncate">{user.email} · sedan {date(user.created_at)}</div>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
          <span title="Appar">📱 {user.apps.length}</span>
          <span className="hidden sm:inline-flex items-center gap-1" title="Idéer"><Lightbulb className="h-3.5 w-3.5" />{user.ideas_count}</span>
          <span className="inline-flex items-center gap-1" title="Öppningar"><Eye className="h-3.5 w-3.5" />{totalClicks(user)}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <CardContent className="pt-0 space-y-2">
          <p className="text-xs text-muted-foreground">Senast inloggad {date(user.last_sign_in_at)}</p>
          {user.apps.length === 0 && <p className="text-sm text-muted-foreground">Inga appar ännu.</p>}
          {user.apps.map((a) => (
            <Link key={a.id} to={`/app/${a.id}`} className="flex items-center gap-2 rounded-lg p-2 min-h-12 hover:bg-muted">
              <span className="flex-1 truncate text-sm">{a.title}</span>
              <AppStatusBadge status={a.status as never} />
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground w-12 justify-end"><Eye className="h-3 w-3" />{a.clicks}</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground w-10 justify-end"><ThumbsUp className="h-3 w-3" />{a.upvotes}</span>
            </Link>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

export function AdminUsersPanel() {
  const [q, setQ] = useState('');
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-users'], queryFn: fetchAdminUsers });
  const users = (data ?? []).filter((u) =>
    `${u.display_name ?? ''} ${u.email ?? ''}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input placeholder="Sök namn eller e-post" value={q} onChange={(e) => setQ(e.target.value)} className="h-12" />
        <span className="text-sm text-muted-foreground shrink-0">{data?.length ?? 0} konton</span>
      </div>
      {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      {error && <p className="text-sm text-destructive">Kunde inte hämta användare.</p>}
      {users.map((u) => <UserRow key={u.id} user={u} />)}
    </div>
  );
}
