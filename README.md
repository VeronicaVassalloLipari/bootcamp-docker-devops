# Bootcamp Docker & DevOps — progetto di partenza

Questo è il repository su cui lavori per tutto il bootcamp. Contiene due applicazioni campione, una per percorso: ne scegli una e lavori solo su quella.

| Cartella | Percorso | Cosa contiene |
|---|---|---|
| `percorso-be/` | Backend | API REST Node.js + Express con due endpoint, `/healthz` e `/accounts` |
| `percorso-fe/` | Frontend | Pagina Vite + React che legge la lista dei conti da `/api/accounts` |
| `docs/setup.md` | Comune | Verifiche dell'ambiente e problemi frequenti del Giorno 0 |

Al Giorno 0 l'app del tuo percorso gira a mano, senza Docker. Dal Giorno 1 la metti in container e la affianchi ai servizi che le servono; al Giorno 2 costruisci la pipeline che la verifica e ne pubblica l'immagine su GHCR.

## Mettilo sul tuo GitHub

Il progetto deve vivere su un repository tuo: al Giorno 2 è lì che girano i workflow GitHub Actions, ed è da lì che l'immagine viene pubblicata su GHCR.

```bash
cd bootcamp-docker-devops
git init -b main
git add .
git commit -m "G0: setup ambiente locale"

# Su github.com: New repository, nome bootcamp-docker-devops, vuoto
# (niente README, .gitignore o licenza: li hai già qui)
git remote add origin https://github.com/<tuo-utente>/bootcamp-docker-devops.git
git push -u origin main
```

Quando git chiede la password, incolla il tuo Personal Access Token: la password dell'account GitHub non viene accettata.

## Smoke test del Giorno 0

Percorso BE:

```bash
cd percorso-be
npm ci
npm start
# in un altro terminale:
curl http://localhost:3000/healthz
# atteso: {"status":"ok","timestamp":"..."}
```

Percorso FE:

```bash
cd percorso-fe
npm ci
npm run dev
# apri http://localhost:5173 nel browser
```

I dettagli di ciascun percorso sono nel `README.md` della sua cartella.

## Stack Docker (Giorno 1 — percorso FE)

Dalla root del progetto:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f
```

Smoke test:

```bash
# pagina (lista accounts servita dal mock-api via proxy Nginx)
# apri http://localhost:8080 nel browser
curl -s http://localhost:8080/api/healthz
curl -si http://localhost:8080/api/accounts | grep -i x-cache
# svuota la cache e ripeti: prima MISS, poi HIT
docker compose exec cache redis-cli del mock:accounts
```

Tear down:

```bash
docker compose down
docker compose down -v   # rimuove anche il volume cache_data
```

## Cache di BuildKit

Mount `RUN --mount=type=cache,target=/root/.npm` in `percorso-fe/Dockerfile`,
`mock-api/Dockerfile` e `esercizio3/Dockerfile.refactored`.

Comandi usati per la misura sul Dockerfile principale:

```bash
docker builder prune -f --filter type=exec.cachemount
docker build --progress=plain -f percorso-fe/Dockerfile -t lipari-fe:e4 percorso-fe/
# invalida il layer npm ci con una modifica innocua a percorso-fe/package.json
docker build --progress=plain -f percorso-fe/Dockerfile -t lipari-fe:e4 percorso-fe/
```

Misure sul PC di test (cache npm vuota vs calda):

| Build | Tempo totale | `npm ci` builder |
|---|---|---|
| 1 — cache npm vuota | 8,31 s | 3,1 s |
| 2 — cache npm calda | 6,27 s | 2,1 s |

Il tempo di `npm ci` scende da 3,1 s a 2,1 s (install interno da 2 s a 1 s).

Sulla demo `esercizio3`, con più dipendenze, la differenza è più marcata:

| Build | Tempo totale | `npm ci` builder |
|---|---|---|
| 1 — cache npm vuota | 12,25 s | 2,54 s |
| 2 — cache npm calda | 6,28 s | 0,97 s |

Qui la build completa è circa il **49% più veloce**: `npm ci` riesegue perché
`package.json` è cambiato, ma i tarball arrivano dal cache mount invece che
dalla rete.

## Due regole che valgono per tutto il bootcamp

Ogni giornata si chiude con un commit `GN: <argomento>` (`G0: setup ambiente locale`, `G1: ...`, `G2: ...`): la cronologia git fa parte di quello che consegni.

Le tue note di setup vanno in `setup-notes.md`, nella radice del progetto. Il `.gitignore` lo esclude, quindi resta sul tuo PC e non finisce su GitHub.
