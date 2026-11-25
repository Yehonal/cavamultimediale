# CD originale: provenienza e pubblicazione

Il pacchetto contiene la copia di riferimento di **Cava de’ Tirreni Multimediale**, AMI Informatica, 1998. La fonte è il [CD originale indicato nel repository](https://github.com/Yehonal/cavamultimediale/blob/react-v1/src/pages/projectinfo-pages/i-origin.tsx), disponibile tramite questo [link pubblico Google Drive](https://drive.google.com/uc?export=download&id=0B8vXUyM07TrCOE51bkNWT25nS00&resourcekey=0-dhLYmzRmNSpYnWd3oc7TZw).

| Proprietà | Valore |
|---|---|
| File di riferimento | `CAVA.iso` |
| Dimensione logica | `645816320` byte |
| SHA-256 | `f8cfdc7753c9d712750f13a2d4f60f6e6ff3796673b9342876d07f2dff284704` |
| Destinazione Pages | `emulator/media/cava-f8cfdc7753c9/` |
| Blocchi compressi | `2464` |
| Dimensione compressa, livello 10 | `568576863` byte |
| Pacchetto con manifest | `569145275` byte |

## Autorizzazione ricevuta

Il **25 novembre 2026** Joseph, titolare del progetto, ha confermato nella conversazione del progetto di disporre dei diritti sul CD e ha autorizzato la sua pubblicazione per l’esecuzione dell’applicazione originale nel browser. Questa nota registra la dichiarazione e l’autorizzazione ricevute.

Windows resta separato: questo pacchetto e il relativo workflow non includono Windows. Questo documento non dichiara una licenza Windows né diritti di distribuzione dell’immagine OEM.

## Formato e verifica

Il CD è diviso in blocchi indipendenti da **262144 byte**, compressi con Zstandard. I nomi seguono il formato richiesto da v86: `0-262144.img.zst`, `262144-524288.img.zst` e così via. L’ultimo blocco è completato con byte zero fino alla dimensione fissa; la dimensione logica del disco resta invariata.

`manifest.json` registra dimensione logica, dimensione dei blocchi, padding, SHA-256 del disco originale, dimensione compressa totale e SHA-256 di ogni blocco compresso. La proprietà `v86` contiene la configurazione del lettore; l’URL `.img.zst` è un nome virtuale dal quale v86 ricava gli URL dei singoli blocchi.

Downloader e packager verificano entrambi l’hash atteso. Un download o un pacchetto incompleto viene eliminato senza comparire nel percorso finale. Il packager è utilizzabile con qualunque immagine disco raw, fornendo il relativo SHA-256 atteso; non modifica il file sorgente.

## Riprodurre il pacchetto

Con Python 3.12, dalla cartella `emulator/`:

```sh
python -m pip install -r requirements-media.txt
python scripts/download-cd.py --output /tmp/cava-source/CAVA.iso
python scripts/package-media.py /tmp/cava-source/CAVA.iso /tmp/cava-cd-package \
  --expected-sha256 f8cfdc7753c9d712750f13a2d4f60f6e6ff3796673b9342876d07f2dff284704 \
  --expected-size 645816320
```

Usare una directory di output nuova. Il downloader riutilizza una copia locale già valida, dopo averne verificato dimensione e hash.

Il workflow [`emulator-cd.yml`](../.github/workflows/emulator-cd.yml) pubblica soltanto il pacchetto CD nella sottocartella indicata, conservando gli altri file della branch `gh-pages`. Condivide il gruppo di concorrenza `emulator-pages` con il deploy del lettore e richiede esplicitamente una build Pages dopo il commit. Si avvia su modifiche agli script, alle dipendenze media o al workflow nella branch `emulator-poc`; include anche `workflow_dispatch`.
