# Cava Multimediale · Esecuzione originale

Lettore isolato basato su **v86 0.5.476**. Il percorso principale apre automaticamente il CD originale da uno stato con Cava già avviata, a **640 × 480**. File locali e diagnostica restano nelle **Opzioni avanzate**.

## Stato della pubblicazione

- Il proprietario del progetto ha confermato il **25 novembre 2026** i diritti di pubblicazione del **CD originale e di Windows**, richiedendone l’avvio diretto. [Provenienza, autorizzazione, hash e procedura](MEDIA.md).
- Il codice di avvio automatico legge `archive.json`, che indica i due dischi e lo stato iniziale. `archive.example.json` ne descrive il formato.
- Windows 98, il CD e lo stato con Cava già avviata vengono pubblicati in percorsi versionati. La pagina presenta soltanto l’applicazione su fondo nero, i controlli essenziali e la dicitura **Edizione originale · 1998**.
- In assenza di `archive.json`, il workflow compila ed esegue i test, conservando la pagina già pubblicata. La nuova interfaccia non viene distribuita con risorse mancanti.

## Sviluppo

Richiede Node.js 22 o superiore:

```sh
npm ci
npm run build
npm test
npm run serve
```

Aprire [http://localhost:4173](http://localhost:4173). Per l’avvio automatico occorrono `archive.json` e i relativi file sotto `dist/media/`. Gli URL del manifest sono relativi alla pagina e devono appartenere alla stessa pubblicazione.

Per una prova senza sistema operativo: **Opzioni avanzate → Verifica emulatore**. Il disco di prova è codice originale del progetto, senza contenuti Microsoft o del CD.

## Preparare l’archivio completo

1. Usare un’immagine Windows con diritti adatti alla pubblicazione e un driver SVGA compatibile. Cava richiede almeno **65.536 colori**; il driver VGA standard non basta.
2. Installare il titolo tramite `D:\SETUP\SETUP.EXE` e aprire `C:\CAVA\CAVA.EXE`. Il launcher è `D:\RUN\RUN.EXE`; la lettera del CD può variare.
3. Impostare **640 × 480**, almeno 16 bit di colore. La configurazione di riferimento usa **128 MiB di RAM** e **8 MiB di memoria video**.
4. Salvare uno stato con Cava pronta, CD originale montato e nessun floppy di installazione. Verificare il ripristino con gli stessi dischi di base, versione v86 e configurazione.
5. Comprimere lo stato con Zstandard e preparare i dischi con `scripts/package-media.py`, secondo [MEDIA.md](MEDIA.md). Non sostituire la base dopo la verifica: deve corrispondere alle modifiche contenute nello stato.
6. Pubblicare le risorse in percorsi versionati, compilare `archive.json` e collaudare l’intero percorso prima dell’attivazione.

Il driver **VMDisp9x 2D 1.2025.0.119b**, MIT, offre il profilo **VESA ISA Adapter**: [release originale](https://github.com/JHRobotics/vmdisp9x/releases/tag/v1.2025.0.119). Non modifica l’eseguibile Cava.

## Controlli

L’app si avvia al caricamento della pagina. **Ricomincia** ripristina lo stato iniziale; **Pausa** sospende la macchina; **Schermo intero** mantiene la composizione originale. L’audio si abilita con un’interazione dell’utente, come richiesto dai browser. La scelta di disattivarlo resta valida dopo pausa e ripresa.

Cliccare nello schermo per inviare mouse e tastiera alla macchina. **Ctrl + Alt + Esc** restituisce il focus ai controlli della pagina.

Le opzioni avanzate accettano dischi locali IMG/BIN e ISO, che non vengono caricati su un server né modificati. **Salva sessione** è disponibile solo nella modalità locale; lo stato va riaperto con gli stessi file di base.

## Verifica e limiti

I test eseguono un vero boot x86, pausa, salvataggio e ripristino con il runtime di produzione; verificano anche configurazione, versione e percorsi del manifest. Il pacchetto CD è stato verificato decomprimendo tutti i blocchi e confrontando l’hash originale.

Nella prova privata con Windows 98 e VMDisp9x sono stati eseguiti l’introduzione video, la schermata principale originale e una sezione con testo scrollabile, con ritorno alla home. È stata configurata la modalità **640 × 480, 24 bit**. Il flusso audio ha prodotto campioni PCM, ma la qualità sonora non è stata ascoltata.

Lo stato definitivo, compresso con Zstandard, è stato ripristinato in un processo nuovo con il runtime di produzione, il disco Windows di base e il CD originale. La schermata principale riappare direttamente a **640 × 480, 24 bit**; la CPU continua a eseguire e il flusso PCM riprende. Le parti statiche del panorama e del menu coincidono con la cattura precedente al salvataggio.

Il controllo audio del lettore usa un gain separato dopo il mixer del sistema ospite. Disattivare il suono non sospende il clock audio: questo evita di bloccare le chiamate multimediali sincrone del programma originale.

Il build corregge anche la notifica del sample rate durante il ripristino SB16, verificando l’hash esatto del runtime originale prima di applicare la modifica. Lo stato Cava usa **11.025 Hz**: l’adapter deve ricevere questo valore prima dell’abilitazione audio, invece di mantenere i 22.050 Hz iniziali. Il test di ripristino verifica l’ordine degli eventi. La visualizzazione resta in **4:3** e adatta l’intero canvas al contenitore anche a schermo intero, ignorando il raddoppio automatico delle dimensioni effettuato da v86.

Il collaudo non copre tutti i percorsi del titolo. Il loader controlla inizialmente la disponibilità delle risorse; il runtime v86 fissato non espone un callback di errore per tutte le letture successive dei blocchi. In caso di interruzione della connessione, **Ricomincia** ricarica la sessione.

## Deploy

`emulator-pages.yml` compila e verifica il lettore su ogni modifica in `emulator-poc`, pubblicandolo in `gh-pages/emulator` quando esiste la configurazione completa. `emulator-cd.yml` pubblica il CD e `emulator-windows.yml` pubblica la base Windows e lo stato pronto. Condividono il gruppo di concorrenza, preservano gli altri file del sito e usano il token integrato di GitHub con richiesta esplicita della build Pages.

Prima del prossimo deploy React da `react-v1`, integrare il `keep_files: true` già preparato nella branch, per conservare `/emulator/` e i media.
