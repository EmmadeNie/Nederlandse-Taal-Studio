-- Invitation e-mail: when the docent last mailed a prepared leerling their
-- invite link (set by the send-invite-mail edge function, with the service
-- role). Clients can read it but not change it: there is no column grant for it.
alter table public.profiles add column invite_sent_at timestamptz;

comment on column public.profiles.invite_sent_at is 'When the invitation e-mail (send-invite-mail) was last sent to this prepared leerling.';
