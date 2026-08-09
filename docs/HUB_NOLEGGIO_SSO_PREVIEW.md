# ECCOMI HUB → ECCOMI NOLEGGIO SSO Preview

La Preview #17 ora può emettere un handoff firmato e temporaneo verso ECCOMI NOLEGGIO.

## Flusso

1. L'utente accede a ECCOMI HUB con OTP.
2. Il frontend chiede al backend HUB `/v1/sso/noleggio` un URL di handoff.
3. Il backend HUB verifica la sessione Supabase e il profilo `hub_profiles`.
4. HUB firma un token HMAC-SHA256 valido 90 secondi con identità, ruolo, ecosistemi e deleghe.
5. ECCOMI NOLEGGIO verifica il token e crea la propria sessione applicativa senza richiedere nuovamente credenziali.

## Variabili Render

- `HUB_SSO_SECRET`: stesso valore casuale lungo su HUB e NOLEGGIO.
- `NOLEGGIO_SSO_BASE_URL`: URL della preview NOLEGGIO durante i test; in produzione `https://noleggio.eccomionline.com`.

Il segreto non deve essere inserito nel repository o nel frontend.
