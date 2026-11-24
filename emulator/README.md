# Cava Multimediale · Prototipo di emulazione

Pagina autonoma per provare il CD-ROM originale con **v86 0.5.476**. Il prototipo è separato dalla ricostruzione React e viene pubblicato su `/cavamultimediale/emulator/`.

La macchina usa **128 MiB di RAM**. Il programma originale è a 16 bit e richiede il runtime Visual Basic 4. La compatibilità completa di navigazione, audio e video è ancora in verifica.

Verifica del prototipo: boot x86, pausa e salvataggio/ripristino superati con il runtime di produzione. In una macchina Windows 98 privata sono stati avviati il launcher originale con selezione IT/EN e l’installer, che ha confermato il completamento dell’installazione. `CAVA.EXE` si avvia ma richiede almeno 64K colori; l’immagine di prova usa il driver VGA standard con sole 2/16 tonalità. La schermata principale, la navigazione e la riproduzione audio/video restano quindi da verificare con un driver SVGA/VBE compatibile e High Color a 16 bit.

## Avvio locale

Con Node.js 22, dalla cartella `emulator/`:

```sh
npm ci
npm run build
npm test
npm run serve
```

Aprire [http://localhost:4173](http://localhost:4173). Il comando **Verifica emulatore** avvia una piccola dimostrazione originale di boot, senza Windows e senza il CD, per controllare il funzionamento dell’emulatore.

## Provare il CD

1. Selezionare un disco **IMG/BIN in formato raw**, con Windows 95 o Windows 98 già installato. Un’ISO di installazione di Windows non è un disco pronto all’avvio.
2. Selezionare l’ISO del CD-ROM di Cava Multimediale.
3. Avviare la macchina. In Windows, eseguire `D:\RUN\RUN.EXE`; se occorre installare il programma, eseguire `D:\SETUP\SETUP.EXE`. La lettera dell’unità CD può variare.
4. Se necessario, installare il runtime Video for Windows incluso in `D:\VIDEO\SETUP.EXE`. Verificare anche la disponibilità del codec Cinepak nel sistema ospite se i video non vengono riprodotti.

Configurare il sistema ospite a **640 × 480, colori a 16 bit**: il programma originale rifiuta modalità con meno di 65.536 colori. Se Windows mostra soltanto 2/16 colori, installare prima un driver SVGA/VBE compatibile con v86; il driver VGA standard non basta. Il prototipo non modifica né decompila l’eseguibile del CD.

I file selezionati sono letti dal browser sul dispositivo dell’utente: **non vengono caricati su un server**. Windows e l’ISO del CD non sono inclusi nel sito né nel repository. Le istruzioni del progetto in [`../AGENTS.md`](../AGENTS.md) richiedono diritti appropriati prima di distribuirli.

Cliccare nello schermo per inviare mouse e tastiera alla macchina. Premere **Ctrl + Alt + Esc** per tornare ai controlli della pagina senza usare il mouse.

## Riprendere una sessione

Premere **Salva sessione** prima di chiudere la pagina. Lo stato include la memoria della macchina e i blocchi del disco modificati nella sessione. Riaprirlo con **la stessa versione di v86, la stessa configurazione e gli stessi file di base** Windows e CD. Il browser non modifica il file del disco originale; lo stato non sostituisce questi file.

## CD di riferimento

La copia esaminata è quella indicata nella pagina [CD originale del repository](https://github.com/Yehonal/cavamultimediale/blob/react-v1/src/pages/projectinfo-pages/i-origin.tsx).

| Proprietà | Valore |
|---|---|
| Nome | `CAVA.iso` |
| Dimensione | `645816320` byte |
| SHA-256 | `f8cfdc7753c9d712750f13a2d4f60f6e6ff3796673b9342876d07f2dff284704` |
| Autorun | `RUN\RUN.EXE` |

L’hash permette di riconoscere la copia di riferimento; non attesta diritti di distribuzione.

## Pubblicazione

Il workflow [`emulator-pages.yml`](../.github/workflows/emulator-pages.yml) esegue installazione, build e test su Node.js 22 quando cambia il prototipo nella branch `emulator-poc`. Pubblica esclusivamente `emulator/dist` nella sottocartella `emulator` della branch `gh-pages`, usando il token integrato di GitHub e preservando gli altri file del sito. Richiede poi esplicitamente la build di GitHub Pages: i commit prodotti da `GITHUB_TOKEN` non la attivano da soli. Non dipende dalla vecchia chiave SSH `ACTIONS_DEPLOY_KEY`, risultata non autorizzata durante il primo tentativo.

Il workflow include anche `workflow_dispatch`; GitHub espone l’avvio manuale quando il file è presente sulla branch predefinita. La pubblicazione riguarda il lettore e i componenti redistribuibili dell’emulatore, non immagini Windows o contenuti del CD.

Il workflow React su `react-v1` attualmente ripulisce `gh-pages` a ogni deploy. Prima del prossimo deploy React, integrare anche la modifica `keep_files: true` contenuta in questa branch per conservare `/emulator/`.

Riferimenti: [v86](https://github.com/copy/v86), [configurazione Windows 9x](https://github.com/copy/v86/blob/master/docs/windows-9x.md).
