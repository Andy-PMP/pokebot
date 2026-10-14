# Pokebot

Pick Pokémon for a matchup and find the right berries, powered by [PokéAPI](https://pokeapi.co).

This started as a Discord bot (`main.py`, `helpers.py`, kept for reference). The web app in `web/` replaces it:
a static React site that calls PokéAPI from the browser and saves your team and berries in localStorage.
There is no server or database to host.

## Develop

```sh
cd web
npm install
npm run dev     # http://localhost:5173
npm test        # matchup logic tests
npm run build   # outputs web/dist
```

## Deploy (Cloudflare Pages, free)

1. Push this repo to GitHub.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings:
   - Root directory: `web`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Save and deploy. You'll get a `*.pages.dev` URL, and every push to `main` redeploys.

## How recommendations work

`web/src/logic/matchups.ts` has the Gen 6+ type chart. For an opponent it shows:

- **Hit it with**: attacking types that deal more than ×1, multiplied across both of its types (so Electric vs. Gyarados is ×4, Ground is ×0).
- **Its attacks are strong against**: types its own (same-type) attacks hit super-effectively.
- **From your team**: each saved Pokémon's best same-type hit on the opponent vs. the opponent's best hit on it:
  *Send it out* (≥×2 and not weak to it), *Hits hard, but weak to it*, *Even match*, or *Keep it benched*.
