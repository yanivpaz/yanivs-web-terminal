(function () {
  const terminal = window.WebTerminal;
  const repo = {
    owner: "yanivpaz",
    name: "yanivs-web-terminal",
    linksPath: "LINKS.MD",
  };

  function normalizeUrl(value) {
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("only http and https links are supported");
    }
    return url;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function truncate(value, length) {
    const text = value.trim().replace(/\s+/g, " ");
    return text.length > length ? `${text.slice(0, length - 3)}...` : text;
  }

  function buildAddLinkIssueUrl(url, title) {
    const label = title || url.hostname || url.href;
    const payload = {
      source: "yanivs-web-terminal",
      type: "addlink",
      version: 1,
      url: url.href,
      title: label,
      createdAt: new Date().toISOString(),
    };
    const body = [
      "<!-- yanivs-web-terminal:addlink:v1",
      JSON.stringify(payload),
      "-->",
      "",
      "This issue asks the repository workflow to append a link to LINKS.MD.",
      "",
      `URL: ${url.href}`,
      `Title: ${label}`,
      "",
      "Authentication is handled by GitHub: the workflow only commits links from users",
      "who already have write, maintain, or admin permission on this repository.",
    ].join("\n");
    const issueUrl = new URL(`https://github.com/${repo.owner}/${repo.name}/issues/new`);
    issueUrl.searchParams.set("title", truncate(`Add link: ${label}`, 120));
    issueUrl.searchParams.set("body", body);
    issueUrl.searchParams.set("labels", "add-link");
    return issueUrl;
  }

  terminal.registerCommand("help", {
    summary: "print the command table",
    aliases: ["commands", "?"],
    run(term) {
      term.printCommandList();
    },
  });

  terminal.registerCommand("about", {
    summary: "short intro",
    aliases: ["whoami"],
    run(term) {
      term.printBlock([
        "Yaniv Paz",
        "Builder, automation-minded engineer, and terminal enjoyer.",
        "This site is ready for your next commands, APIs, and personal content.",
      ]);
    },
  });

  terminal.registerCommand("cv", {
    summary: "placeholder CV route",
    aliases: ["resume"],
    run(term) {
      term.printBlock([
        { text: "CV module: pending", className: "warn" },
        "Add your CV link or rendered profile in commands.js.",
      ]);
    },
  });

  terminal.registerCommand("projects", {
    summary: "show current work",
    aliases: ["work"],
    run(term) {
      term.writeHtml('<span class="accent">projects:</span>');
      term.writeHtml(
        '  <a href="https://github.com/yanivpaz/teams-dashboard" target="_blank" rel="noopener noreferrer">teams-dashboard</a> ' +
          '<span class="muted">IDP-like tool</span>'
      );
      term.writeHtml(
        '  <a href="https://github.com/yanivpaz/mp3-downloader" target="_blank" rel="noopener noreferrer">mp3-downloader</a> ' +
          '<span class="muted">MP3 downloader</span>'
      );
    },
  });

  terminal.registerCommand("contact", {
    summary: "contact placeholders",
    run(term) {
      term.writeHtml(
        '<span class="accent">contact</span> ' +
          '<span class="muted">Add email, LinkedIn, GitHub, or a form endpoint in commands.js.</span>'
      );
    },
  });

  terminal.registerCommand("addlink", {
    summary: "open an authenticated link request",
    aliases: ["link"],
    run(term) {
      if (!term.args.length) {
        term.write("usage: /addlink https://example.com optional title", "warn");
        return;
      }

      const url = normalizeUrl(term.args[0]);
      const title = term.args.slice(1).join(" ").trim();
      const issueUrl = buildAddLinkIssueUrl(url, title);
      const opened = window.open(issueUrl.href, "_blank", "noopener,noreferrer");

      term.writeHtml(
        '<span class="ok">auth handoff:</span> GitHub issue opened. ' +
          "Submit it while logged in as a repository writer, and the workflow will commit " +
          `${repo.linksPath}.`
      );
      if (!opened) {
        term.writeHtml(
          `<span class="warn">popup blocked:</span> ` +
            `<a href="${issueUrl.href}" target="_blank" rel="noopener noreferrer">open the link request</a>`
        );
      }
      term.writeHtml(
        `<span class="muted">request:</span> ${escapeHtml(url.href)} ` +
          `${title ? escapeHtml(`(${title})`) : ""}`
      );
    },
  });

  terminal.registerCommand("echo", {
    summary: "echo arguments",
    run(term) {
      term.write(term.args.join(" "));
    },
  });

  terminal.registerCommand("theme", {
    summary: "toggle terminal brightness",
    run(term) {
      document.body.classList.toggle("high-contrast");
      term.write("theme toggled");
    },
  });

  terminal.registerCommand("clear", {
    summary: "clear terminal output",
    aliases: ["cls"],
    run(term) {
      term.clear();
    },
  });

  // Add new commands here later:
  //
  // terminal.registerCommand("status", {
  //   summary: "show a live service status",
  //   async run(term) {
  //     const response = await fetch("/status.json");
  //     const status = await response.json();
  //     term.write(`status: ${status.message}`);
  //   },
  // });
})();
