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

## Save Links From The Terminal

The site includes `/addlink`, which appends to `LINKS.MD` by committing through the
GitHub Contents API:

```text
/addlink https://example.com Optional link title
```

Because GitHub Pages is static, browser code cannot write to the repository unless
you authenticate. Run `/token` and paste a GitHub fine-grained token that has
`Contents: Read and write` access to `yanivpaz/yanivs-web-terminal`. The token is
stored only in this browser tab with `sessionStorage`.

Useful token commands:

```text
/token
/token status
/token clear
```

## Deploy

This repo includes `.github/workflows/pages.yml`. Push to `main`, enable GitHub Pages
with the source set to GitHub Actions, and the workflow will publish the static site.
