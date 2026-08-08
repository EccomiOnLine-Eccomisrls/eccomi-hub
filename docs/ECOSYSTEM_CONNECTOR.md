# ECCOMI Ecosystem Connector

Obiettivo: rendere ECCOMI HUB capace di collegare nuovi verticali con uno standard comune, senza sviluppare ogni integrazione da zero.

## Contratto minimo

Ogni ecosistema dichiara:

- identità (`key`, nome, descrizione);
- ciclo di vita e salute;
- responsabile;
- accesso operativo e supporto SSO;
- endpoint summary, quando disponibile;
- KPI con indicazione della fonte (`live`, `manual`, `unavailable`);
- priorità/alert;
- capability supportate;
- data dell'ultima sincronizzazione.

## Regola dati reali

Un KPI non collegato non deve mostrare numeri inventati. Deve avere `value: null` e `source: unavailable`; l'interfaccia lo rappresenterà come dato non ancora collegato.

## Verticali iniziali

- ECCOMI Noleggio: operativo, summary + responsabile + deleghe + SSO.
- ECCOMI Posta: operativo, summary collegato; SSO da valutare in una fase successiva.
- ECCOMI Energia: pianificato per la prossima integrazione.
- ECCOMI Performance: registrato come pianificato.
- ECCOMI Future: registrato come pianificato.

## Roadmap tecnica

1. Contratto e registry.
2. Adapter dei dati reali di Noleggio e Posta.
3. Dashboard CEO alimentata dal registry e senza KPI demo.
4. Standard SSO riutilizzabile.
5. Collegamento Energia.
6. Collegamento Performance e Future.
7. NEW ENTRY capace di generare una scheda ecosistema pronta per il Connector.

Tutte le modifiche vengono validate in Preview prima del merge in `main`.
