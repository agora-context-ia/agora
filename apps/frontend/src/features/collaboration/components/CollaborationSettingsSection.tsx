import { useState, type FormEvent } from 'react';
import { Copy, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveOrganization } from '@/features/organizations/application/use-active-organization';
import { useCollaboration } from '../application/use-collaboration';

const ROLE_LABELS = { owner: 'Propietario', admin: 'Administrador', member: 'Miembro' } as const;

/** Member roster and invitation controls for the active organization. */
export function CollaborationSettingsSection() {
  const organization = useActiveOrganization();
  const { members, invitations, isLoading, error, invite, revoke } = useCollaboration(organization?.id ?? null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const canManage = organization?.role === 'owner' || organization?.role === 'admin';

  async function submit(event: FormEvent) {
    event.preventDefault(); setSubmitting(true);
    try { setInvitationUrl(await invite(email, role)); setEmail(''); }
    finally { setSubmitting(false); }
  }

  return (
    <section className="space-y-5">
      <div><h3 className="font-medium">Colaboradores</h3><p className="text-sm text-muted-foreground">Los miembros pueden ver todos los proyectos y documentos de la organización.</p></div>
      {canManage && <form className="flex gap-2" onSubmit={(event) => void submit(event)}>
        <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="colaborador@empresa.com" />
        <select className="rounded-md border bg-background px-2 text-sm" value={role} onChange={(event) => setRole(event.target.value as 'admin' | 'member')}><option value="member">Miembro</option><option value="admin">Administrador</option></select>
        <Button disabled={isSubmitting}><UserPlus />Invitar</Button>
      </form>}
      {invitationUrl && <div className="rounded-md border bg-muted/40 p-3 text-sm"><p className="mb-2 font-medium">Comparte este enlace; solo se muestra una vez:</p><div className="flex gap-2"><Input readOnly value={invitationUrl} /><Button type="button" variant="outline" onClick={() => void navigator.clipboard.writeText(invitationUrl)}><Copy />Copiar</Button></div></div>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {isLoading ? <p className="text-sm text-muted-foreground">Cargando…</p> : <div className="space-y-2">{members.map((member) => <div key={member.id} className="flex items-center justify-between rounded-md border p-3"><div><p className="text-sm font-medium">{member.fullName}</p><p className="text-xs text-muted-foreground">{member.email}</p></div><span className="text-xs text-muted-foreground">{ROLE_LABELS[member.role]}</span></div>)}</div>}
      {invitations.length > 0 && <div className="space-y-2"><h4 className="text-sm font-medium">Invitaciones pendientes</h4>{invitations.map((item) => <div key={item.id} className="flex items-center justify-between rounded-md border p-3"><div><p className="text-sm">{item.email}</p><p className="text-xs text-muted-foreground">{ROLE_LABELS[item.role]} · vence {new Date(item.expiresAt).toLocaleDateString()}</p></div>{canManage && <Button type="button" size="icon" variant="ghost" onClick={() => void revoke(item.id)}><Trash2 /><span className="sr-only">Revocar</span></Button>}</div>)}</div>}
    </section>
  );
}
