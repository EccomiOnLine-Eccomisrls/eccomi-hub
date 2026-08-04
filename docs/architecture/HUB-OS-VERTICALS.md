# ECCOMI HUB, ECCOMI OS e verticali

## Architettura approvata

```text
ECCOMI HUB  <------------------------------>  ECCOMI OS
(Governance)                                 (Motore condiviso)
    |
    |-- ECCOMI POSTA
    |-- ECCOMI ENERGIA
    |-- ECCOMI NOLEGGIO
    |-- ECCOMI EDU
    |-- ECCOMI PERFORMANCE ---> Azienda A
    |                         -> Azienda B
    |                         -> Azienda C
    |                         -> ...
    |-- ECCOMI FISCAL
    |-- ECCOMI BOOK
    |-- ECCOMI IMPORTER
    `-- Futuri ecosistemi
```

## Regole fondamentali

### ECCOMI HUB

ECCOMI HUB è la cabina di regia dell'intero ecosistema. Governa i verticali, presenta KPI e priorità, ospita il Decision Center e consente al CEO di accedere alle aree operative.

HUB non sostituisce i verticali e non contiene la loro logica operativa.

### ECCOMI OS

ECCOMI OS è il motore condiviso collegato in modo bidirezionale a HUB. Fornisce servizi comuni, tra cui autenticazione, ruoli e permessi, ricerca globale, command bar, notifiche, AI, automazioni, audit e integrazioni.

OS non è un livello superiore a HUB e non è un verticale.

### Verticali

I verticali sono applicazioni specializzate governate da HUB e abilitate dai servizi di OS. Ogni verticale mantiene codice, dati, responsabilità e logiche di business proprie.

### ECCOMI PERFORMANCE

ECCOMI PERFORMANCE è un verticale speciale multi-azienda. HUB governa il prodotto e le attivazioni; ogni azienda cliente opera in un ambiente isolato con utenti, organizzazione, ruoli, dati e processi propri.

Il configuratore `Nuova Azienda` è uno strumento interno di ECCOMI PERFORMANCE accessibile dalla governance, non una registrazione pubblica autonoma del cliente.

## Regola di classificazione

Prima di sviluppare una funzione bisogna stabilire dove appartiene:

- governance trasversale: HUB;
- servizio comune riutilizzabile: OS;
- logica di settore: verticale;
- configurazione o dato del cliente: tenant aziendale di PERFORMANCE.

Questa classificazione evita duplicazioni e impedisce che HUB, OS e verticali si sovrappongano.
