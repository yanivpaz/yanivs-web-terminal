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

The site includes `/addlink`, which opens a prefilled GitHub issue:

```text
/addlink https://example.com Optional link title
```

GitHub handles the browser-side authentication. When the issue is submitted, the
`Persist Add Link Requests` workflow checks the issue author's repository permission.
Only users with `write`, `maintain`, or `admin` access can cause the workflow to append
the link to `LINKS.MD` and commit it. Unauthorized requests are closed without a commit.

## Deploy

This repo includes `.github/workflows/pages.yml`. Push to `main`, enable GitHub Pages
with the source set to GitHub Actions, and the workflow will publish the static site.
