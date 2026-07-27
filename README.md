# ECCOMI HUB

Cabina di governo dell'ecosistema Eccomi. La versione corrente mantiene i KPI
dimostrativi, ma usa già Supabase Auth, Resend e i ruoli HUB per l'accesso reale.
Il flusso `+ NEW ENTRY` salva le iniziative nel database centrale dopo
l'applicazione di `backend/sql/002_hub_entries.sql`. La fase Valutazione usa
`backend/sql/003_hub_evaluations.sql` per punteggio, semaforo, analisi e
decisioni CEO atomiche.

La prima integrazione verticale è Eccomi Posta. L’HUB inoltra la sessione del
profilo autorizzato al backend Posta e riceve soltanto un riepilogo in sola
lettura: conteggi, stati, tipo di servizio e riferimenti pratica. Email,
indirizzi, contenuti e documenti non vengono trasferiti all’HUB.

La seconda integrazione verticale è Eccomi Noleggio. L’HUB verifica prima il
ruolo centrale, poi interroga un endpoint server-to-server protetto del
verticale. Riceve soltanto KPI aggregati su promozioni, lead, contratti,
commissioni e ultimi eventi; non riceve dati anagrafici, documenti o
credenziali Shopify.

## Avvio locale

```bash
npm install
npm run dev
```

Con `HUB_API_BASE_URL` il sito usa il backend nella cartella `backend/`. Il sito
può anche gestire l'accesso OTP direttamente dal proprio worker impostando
`SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` nell'ambiente di hosting. Senza
queste variabili l'accesso resta chiuso.
Con `OPENAI_API_KEY` l'analisi testuale usa OpenAI; in sua assenza resta attivo
il motore preliminare verificabile di ECCOMI HUB. Non inserire mai credenziali
nei file versionati.

Per Eccomi Noleggio configurare in hosting:

- `NOLEGGIO_API_URL`, indirizzo dell’area gestionale;
- `NOLEGGIO_HUB_READ_SECRET`, segreto condiviso esclusivamente tra i due worker.

Lo stesso valore va registrato come `HUB_READ_SECRET` nell’ambiente di Eccomi
Noleggio. Le tre variabili non devono essere salvate nel repository.

## Preparazione GitHub

Il progetto è pronto per un repository GitHub privato:

1. conservare `main` come branch principale;
2. mantenere il repository di Sites come remote di pubblicazione;
3. aggiungere GitHub come remote separato, senza sostituire quello di Sites;
4. versionare soltanto `.env.example`, mai file `.env` o credenziali;
5. prima di ogni pubblicazione eseguire `npm run test:auth`.

Il file `.openai/hosting.json` deve restare versionato: identifica il progetto
Sites già esistente e impedisce la creazione accidentale di un secondo HUB.

## Accesso e dati di test

1. Accedi tramite email, codice temporaneo e ruolo autorizzato.
2. Esplora Dashboard CEO, Ecosistemi, Cliente unico, Responsabili, Operatori, Decision Center, AI, Report e Impostazioni.
3. Usa `+ NEW ENTRY` per compilare bisogno, obiettivo, collegamento con ECCOMI
   DNA, modello di ricavo, costi, responsabile, tempi e rischi.
4. La new entry viene salvata nello stato "Da valutare" soltanto dopo la
   verifica del profilo autorizzato.
5. Usa "Segnala una modifica" per salvare note locali durante il test.

## Percorso reale della valutazione

1. Una new entry passa da `Da valutare` a `Valutazione`.
2. HUB calcola cinque punteggi e un semaforo finale con formula verificabile.
3. L'analisi produce punti di forza, criticità e condizioni; usa OpenAI quando
   la chiave di progetto è configurata in hosting.
4. Solo il CEO può scegliere `Chiedi dettagli`, `Sospendi` o `Approva`.
5. L'approvazione porta l'iniziativa nello stato `Approvato`; nessun automatismo
   può approvare al posto del CEO.
