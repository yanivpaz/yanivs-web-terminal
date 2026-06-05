# Yaniv's Web Terminal

A static, command-driven personal site ready for GitHub Pages.

## Local Preview

```bash
npm start
```

Then open `http://localhost:4173`.

## Add Commands

Edit `commands.js` and register a new command:

```js
terminal.registerCommand("status", {
  summary: "show current status",
  run(term) {
    term.write("online");
  },
});
```

## Deploy

This repo includes `.github/workflows/pages.yml`. Push to `main`, enable GitHub Pages
with the source set to GitHub Actions, and the workflow will publish the static site.
