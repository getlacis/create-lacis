# create-lacis

Scaffold a new [lacis](https://github.com/getlacis/lacis) project.

## Usage

```bash
npm create lacis@latest
# or
npx create-lacis
```

The CLI will ask three questions:

- **Project name** — directory to create
- **Platform** — Node, Bun, Vercel, or Netlify
- **Validation library** — Zod, Valibot, ArkType, or none

It then scaffolds the project and installs dependencies automatically (auto-detects npm / pnpm / yarn / bun).

## Generated structure

```
my-app/
  routes/
    index.ts       # GET / — ready to run
  server.ts
  package.json
  tsconfig.json
```

## Next steps

```bash
cd my-app
lacis dev
```

## License

MIT
