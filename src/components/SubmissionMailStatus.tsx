import { Loader2, Mail, MailCheck, MailWarning, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { useResendMail, type AdminApp, type MailKind, type MailState } from '@/hooks/useAdmin';

const LABEL: Record<MailKind, string> = { confirm: 'Bekräftelsemejl', published: 'Publiceringsmejl' };

const REASONS: Record<string, string> = {
  bounced: 'studsade',
  error: 'nätverksfel',
  http_401: 'fel API-nyckel',
  http_403: 'nekad av mejltjänsten',
  http_429: 'för många mejl just nu',
};

function reasonText(reason: string | null) {
  if (!reason) return 'okänt fel';
  return REASONS[reason] ?? REASONS[reason.split('_').slice(0, 2).join('_')] ?? reason;
}

function when(at: string) {
  return new Date(at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
}

function canSend(app: AdminApp, kind: MailKind) {
  if (!app.submitter_email) return false;
  if (kind === 'confirm') return !app.email_confirmed;
  return app.email_confirmed && (app.status === 'approved' || app.status === 'featured');
}

function Line({ app, kind, state }: { app: AdminApp; kind: MailKind; state: MailState | null }) {
  const resend = useResendMail();
  const sendable = canSend(app, kind);
  if (!state && !sendable) return null;

  const onResend = () =>
    resend.mutate(
      { appId: app.id, kind },
      {
        onSuccess: ({ result }) =>
          result.sent
            ? toast.success(`${LABEL[kind]} skickat`)
            : toast.error(`${LABEL[kind]} kunde inte skickas: ${reasonText(result.reason ?? null)}`),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Kunde inte skicka mejlet'),
      },
    );

  let icon = <Mail className="h-3.5 w-3.5" />;
  let text = 'inte skickat';
  let tone = 'text-muted-foreground';
  if (state?.status === 'sent') {
    icon = <MailCheck className="h-3.5 w-3.5" />;
    text = `skickat ${when(state.at)}`;
    tone = 'text-green-700 dark:text-green-400';
  } else if (state?.status === 'failed') {
    icon = <MailWarning className="h-3.5 w-3.5" />;
    text = `misslyckades ${when(state.at)} (${reasonText(state.reason)})`;
    tone = 'text-destructive';
  } else if (state?.status === 'not_configured') {
    text = `inte skickat – mejl är inte konfigurerat (${when(state.at)})`;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      <span className={`flex items-center gap-1 ${tone}`}>
        {icon}
        <span className="font-medium">{LABEL[kind]}:</span> {text}
      </span>
      {sendable && state?.status !== 'sent' && (
        <Button variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={resend.isPending} onClick={onResend}>
          {resend.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RotateCw className="h-3 w-3 mr-1" />}
          Skicka igen
        </Button>
      )}
      {sendable && state?.status === 'sent' && (
        <button type="button" className="text-primary hover:underline disabled:opacity-50" disabled={resend.isPending} onClick={onResend}>
          skicka igen
        </button>
      )}
    </div>
  );
}

/** Mail status per submission, with a resend button: shown in the review list and the app editor. */
export function SubmissionMailStatus({ app }: { app: AdminApp }) {
  if (!app.submitter_email) return null;
  return (
    <div className="space-y-1">
      <Line app={app} kind="confirm" state={app.mail?.confirm ?? null} />
      <Line app={app} kind="published" state={app.mail?.published ?? null} />
    </div>
  );
}
