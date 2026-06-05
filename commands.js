(function () {
  const terminal = window.WebTerminal;
  const repo = {
    owner: "yanivpaz",
    name: "yanivs-web-terminal",
    branch: "main",
    linksPath: "LINKS.MD",
  };
  const tokenKey = "yanivs-web-terminal.github-token";

  function getStoredToken() {
    try {
      return sessionStorage.getItem(tokenKey) || "";
    } catch (_error) {
      return "";
    }
  }

  function setStoredToken(token) {
    try {
      sessionStorage.setItem(tokenKey, token);
    } catch (_error) {
      throw new Error("could not store token in this browser session");
    }
  }

  function clearStoredToken() {
    try {
      sessionStorage.removeItem(tokenKey);
    } catch (_error) {
      // Ignore storage errors while clearing.
    }
  }

  function requestToken(term) {
    const existing = getStoredToken();
    if (existing) {
      return existing;
    }

    const token = window.prompt(
      "Paste a GitHub token with Contents: Read and write permission for yanivpaz/yanivs-web-terminal."
    );
    if (!token) {
      term.write("cancelled: /addlink needs a GitHub token to commit LINKS.MD", "warn");
      return "";
    }
    setStoredToken(token.trim());
    term.write("token stored for this browser tab", "muted");
    return token.trim();
  }

  function normalizeUrl(value) {
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("only http and https links are supported");
    }
    return url;
  }

  function markdownLabel(value) {
    return value
      .trim()
      .replace(/\s+/g, " ")
      .replaceAll("\\", "\\\\")
      .replaceAll("[", "\\[")
      .replaceAll("]", "\\]")
      .replaceAll("`", "\\`");
  }

  function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  function decodeBase64(value) {
    const binary = atob(value.replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new TextDecoder().decode(bytes);
  }

  async function githubRequest(path, token, options = {}) {
    const response = await fetch(`https://api.github.com/${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      const message = data.message || `GitHub API returned ${response.status}`;
      throw new Error(`${message} (${response.status})`);
    }
    return data;
  }

  function emptyLinksDocument() {
    return "# Links\n\nLinks saved through Yaniv's web terminal.\n\n## Saved Links\n\n";
  }

  async function fetchLinksFile(token) {
    const path = `repos/${repo.owner}/${repo.name}/contents/${repo.linksPath}?ref=${repo.branch}`;
    try {
      const file = await githubRequest(path, token);
      return {
        content: decodeBase64(file.content || ""),
        sha: file.sha,
      };
    } catch (error) {
      if (String(error.message).includes("(404)")) {
        return { content: emptyLinksDocument(), sha: null };
      }
      throw error;
    }
  }

  async function commitLinksFile(token, content, sha, message) {
    const path = `repos/${repo.owner}/${repo.name}/contents/${repo.linksPath}`;
    const body = {
      branch: repo.branch,
      content: encodeBase64(content),
      message,
    };
    if (sha) {
      body.sha = sha;
    }
    return githubRequest(path, token, {
      body: JSON.stringify(body),
      method: "PUT",
    });
  }

  function appendLink(content, url, title) {
    const date = new Date().toISOString().slice(0, 10);
    const label = markdownLabel(title || url.hostname || url.href);
    const entry = `- ${date}: [${label}](${url.href})`;
    return `${(content || emptyLinksDocument()).trimEnd()}\n${entry}\n`;
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
      term.printBlock([
        "projects:",
        "  ghidra-rpc            reverse-engineering automation over a local RPC daemon",
        "  web-terminal          this GitHub Pages command surface",
        "  add-more-here         edit commands.js when the next project is ready",
      ]);
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

  terminal.registerCommand("token", {
    summary: "set/clear GitHub write token",
    sensitive: true,
    run(term) {
      const action = (term.args[0] || "").toLowerCase();
      if (action === "clear") {
        clearStoredToken();
        term.write("token cleared", "muted");
        return;
      }
      if (action === "status") {
        term.write(getStoredToken() ? "token is set for this tab" : "token is not set", "muted");
        return;
      }

      const token = term.args.length
        ? term.args.join(" ").trim()
        : window.prompt(
            "Paste a GitHub token with Contents: Read and write permission for yanivpaz/yanivs-web-terminal."
          );
      if (!token) {
        term.write("token unchanged", "warn");
        return;
      }
      setStoredToken(token.trim());
      term.write("token stored for this browser tab", "muted");
    },
  });

  terminal.registerCommand("addlink", {
    summary: "append a link to LINKS.MD",
    aliases: ["link"],
    async run(term) {
      if (!term.args.length) {
        term.write("usage: /addlink https://example.com optional title", "warn");
        return;
      }

      const token = requestToken(term);
      if (!token) {
        return;
      }

      const url = normalizeUrl(term.args[0]);
      const title = term.args.slice(1).join(" ").trim();
      term.write(`saving ${url.href} to ${repo.linksPath}...`, "muted");

      const file = await fetchLinksFile(token);
      const nextContent = appendLink(file.content, url, title);
      const result = await commitLinksFile(
        token,
        nextContent,
        file.sha,
        `Add link: ${title || url.hostname}`
      );

      const commitUrl = result.commit?.html_url || "";
      term.writeHtml(
        `<span class="ok">saved:</span> ${url.href}` +
          (commitUrl ? ` <span class="muted">${commitUrl}</span>` : "")
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
