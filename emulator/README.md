# Cava Multimediale · Esecuzione originale

Lettore isolato basato su **v86 0.5.476**. La pagina prepara il CD originale al primo fotogramma dell’introduzione, a **640 × 480**. **Avvia il CD** avvia insieme esecuzione e audio. File locali e diagnostica restano nelle **Opzioni avanzate**.

## Stato della pubblicazione

- Il proprietario del progetto ha confermato il **25 novembre 2026** i diritti di pubblicazione del **CD originale e di Windows**, richiedendone l’avvio diretto. [Provenienza, autorizzazione, hash e procedura](MEDIA.md).
- Il lettore legge `archive.json`, che indica i due dischi e lo stato iniziale. Il workflow aggiorna il manifest con il nuovo stato verificato; `archive.example.json` ne descrive il formato.
- Windows 98, il CD e lo stato fermo all’inizio dell’introduzione vengono pubblicati in percorsi versionati. La pagina presenta soltanto l’applicazione su fondo nero, i controlli essenziali e la dicitura **Edizione originale · 1998**.
- Il workflow pubblica pagina e nuovo stato insieme soltanto dopo le verifiche native e nel browser. Risorse mancanti o verifiche fallite conservano la pubblicazione precedente.

## Sviluppo

Richiede Node.js 22 o superiore:

```sh
npm ci
npm run build
npm test
npm run serve
```

Aprire [http://localhost:4173](http://localhost:4173). Per il CD completo occorrono `archive.json` e i relativi file sotto `dist/media/`. Gli URL del manifest sono relativi alla pagina e devono appartenere alla stessa pubblicazione. Il solo `npm run build` non ricostruisce il nuovo stato: usare la pipeline descritta sotto.

Per una prova senza sistema operativo: **Opzioni avanzate → Verifica emulatore**. Il disco di prova è codice originale del progetto, senza contenuti Microsoft o del CD.

## Preparare l’archivio completo

1. Usare un’immagine Windows con diritti adatti alla pubblicazione e un driver SVGA compatibile. Cava richiede almeno **65.536 colori**; il driver VGA standard non basta.
2. Installare il titolo tramite `D:\SETUP\SETUP.EXE` e aprire `C:\CAVA\CAVA.EXE`. Il launcher è `D:\RUN\RUN.EXE`; la lettera del CD può variare.
3. Impostare **640 × 480**, almeno 16 bit di colore. La configurazione di riferimento usa **128 MiB di RAM** e **8 MiB di memoria video**.
4. Installare il driver mouse descritto sotto e salvare lo stato al **primo fotogramma dell’introduzione**, prima di consumare il primo blocco audio, con CD originale montato e nessun floppy di installazione. Verificare il ripristino con gli stessi dischi di base, versione v86 e configurazione.
5. Comprimere lo stato con Zstandard e preparare i dischi con `scripts/package-media.py`, secondo [MEDIA.md](MEDIA.md). Non sostituire la base dopo la verifica: deve corrispondere alle modifiche contenute nello stato.
6. Pubblicare le risorse in percorsi versionati, compilare `archive.json` e collaudare l’intero percorso prima dell’attivazione.

Il driver **VMDisp9x 2D 1.2025.0.119b**, MIT, offre il profilo **VESA ISA Adapter**: [release originale](https://github.com/JHRobotics/vmdisp9x/releases/tag/v1.2025.0.119). Non modifica l’eseguibile Cava.

Il mouse assoluto usa **VBMOUSE 0.67**: `C:\VBADOS\VBMOUSE.EXE` in `AUTOEXEC.BAT`, `VBMOUSE.DRV` in `C:\WINDOWS\SYSTEM`, `mouse.drv=vbmouse.drv` nella sezione `[boot]` e `mouse=*vmd` nella sezione `[386Enh]` di `SYSTEM.INI`. Sono necessarie entrambe le impostazioni: la vecchia riga `mouse=*vmouse, msmouse.vxd` impedisce l’avvio con questo driver. [Licenza, distribuzione originale e sorgenti](third-party/NOTICE.md#vbados-absolute-mouse-driver).

## Controlli

**Avvia il CD** fa partire l’introduzione originale con audio dopo il caricamento. **Ricomincia** ripristina l’inizio dell’introduzione; **Pausa** sospende la macchina; **Schermo intero** mantiene la composizione originale. La scelta di disattivare l’audio resta valida dopo pausa e ripresa.

Cliccare nello schermo per inviare mouse e tastiera alla macchina. Il puntatore usa coordinate assolute e segue la posizione del mouse anche quando il canvas viene ridimensionato. **Ctrl + Alt + Esc** restituisce il focus ai controlli della pagina.

Le opzioni avanzate accettano dischi locali IMG/BIN e ISO, che non vengono caricati su un server né modificati. **Salva sessione** è disponibile solo nella modalità locale; lo stato va riaperto con gli stessi file di base.

## Verifica e limiti

I test eseguono un vero boot x86, pausa, salvataggio e ripristino con il runtime di produzione; verificano anche configurazione, versione e percorsi del manifest. Il pacchetto CD è stato verificato decomprimendo tutti i blocchi e confrontando l’hash originale.

Lo stato aggiornato è stato ripristinato in un processo nuovo con il runtime di produzione, il disco Windows di base e il CD originale, a **640 × 480, 24 bit**. La verifica parte dal primo fotogramma, percorre l’intera introduzione con campioni PCM e raggiunge la home; apre poi **Abbazia**, **La Basilica / L’Ambone**, **Commercio** e **Ceramiche**. I 1028 file dell’installazione Cava restano invariati. La qualità sonora non è stata valutata all’ascolto.

Il controllo audio del lettore usa un gain separato dopo il mixer del sistema ospite. Disattivare il suono non sospende il clock audio: questo evita di bloccare le chiamate multimediali sincrone del programma originale.

Il build corregge anche la notifica del sample rate durante il ripristino SB16, verificando l’hash esatto del runtime originale prima di applicare la modifica. Lo stato Cava usa **11.025 Hz**: l’adapter deve ricevere questo valore prima dell’abilitazione audio, invece di mantenere i 22.050 Hz iniziali. Il test di ripristino verifica l’ordine degli eventi. La visualizzazione resta in **4:3** e adatta l’intero canvas al contenitore anche a schermo intero, ignorando il raddoppio automatico delle dimensioni effettuato da v86.

Il collaudo non copre tutti i percorsi del titolo. Il loader controlla inizialmente la disponibilità delle risorse; il runtime v86 fissato non espone un callback di errore per tutte le letture successive dei blocchi. In caso di interruzione della connessione, **Ricomincia** ricarica la sessione.

## Deploy

`emulator-pages.yml` compila e verifica il lettore su ogni modifica in `emulator-poc`. Ricompone lo stato sorgente, verifica i dischi originali, installa il mouse con `native-prepare.py`, acquisisce e verifica l’introduzione con `native-build.mjs`, quindi crea il pacchetto e il nuovo `archive.json` con `native-package.py`. Dopo il collaudo Chrome con `browser-verify.mjs`, pubblica insieme pagina e stato in `gh-pages/emulator`.

`emulator-cd.yml` e `emulator-windows.yml` mantengono i pacchetti condivisi del CD e della base Windows; lo stato storico del secondo workflow è un input della ricostruzione, non lo stato iniziale della nuova pubblicazione. I workflow condividono il gruppo di concorrenza, preservano gli altri file del sito e richiedono esplicitamente la build Pages.

Prima del prossimo deploy React da `react-v1`, integrare il `keep_files: true` già preparato nella branch, per conservare `/emulator/` e i media.
