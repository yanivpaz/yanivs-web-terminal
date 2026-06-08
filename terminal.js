(function () {
  const output = document.querySelector("#terminalOutput");
  const input = document.querySelector("#terminalInput");
  const form = document.querySelector("#terminalForm");
  const bootLines = document.querySelector("#bootLines");
  const quickActions = document.querySelectorAll("[data-command]");

  const historyKey = "yanivs-web-terminal.history";
  const commandRegistry = new Map();
  let history = loadHistory();
  let historyIndex = history.length;

  function loadHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(historyKey) || "[]");
      return Array.isArray(value) ? value.slice(-60) : [];
    } catch (_error) {
      return [];
    }
  }

  function saveHistory() {
    localStorage.setItem(historyKey, JSON.stringify(history.slice(-60)));
  }

  function nowParts() {
    const now = new Date();
    const time = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
    const date = new Intl.DateTimeFormat(undefined, {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }).format(now);
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "local";
    return { date, time, zone };
  }

  function getPlatform() {
    const ua = navigator.userAgent;
    const browser = /Firefox/i.test(ua)
      ? "Firefox"
      : /Edg/i.test(ua)
        ? "Edge"
        : /Chrome/i.test(ua)
          ? "Chrome"
          : /Safari/i.test(ua)
            ? "Safari"
            : "Browser";
    const os = /Windows/i.test(ua)
      ? "Windows"
      : /Mac OS X/i.test(ua)
        ? "macOS"
        : /Linux/i.test(ua)
          ? "Linux"
          : "OS";
    return `${os} / ${browser}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function line(html, className = "") {
    const row = document.createElement("div");
    row.className = `output-row ${className}`.trim();
    row.innerHTML = html;
    output.appendChild(row);
    row.scrollIntoView({ block: "nearest" });
    return row;
  }

  function bootLine(html) {
    const row = document.createElement("div");
    row.className = "boot-line";
    row.innerHTML = html;
    bootLines.appendChild(row);
  }

  function registerCommand(name, config) {
    if (!name || typeof config?.run !== "function") {
      throw new Error("registerCommand(name, { run }) requires a command runner");
    }
    commandRegistry.set(normalizeCommandName(name), {
      summary: config.summary || "",
      aliases: config.aliases || [],
      sensitive: Boolean(config.sensitive),
      run: config.run,
    });
    for (const alias of config.aliases || []) {
      commandRegistry.set(normalizeCommandName(alias), {
        summary: config.summary || "",
        aliasFor: normalizeCommandName(name),
        sensitive: Boolean(config.sensitive),
        run: config.run,
      });
    }
  }

  function normalizeCommandName(value) {
    return String(value).replace(/^\/+/, "").trim().toLowerCase();
  }

  function parseCommand(raw) {
    const trimmed = raw.trim();
    const parts = trimmed.split(/\s+/).filter(Boolean);
    const command = normalizeCommandName(parts.shift() || "");
    return { raw: trimmed, command, args: parts };
  }

  function listCommands() {
    return [...commandRegistry.entries()]
      .filter(([, command]) => !command.aliasFor)
      .sort(([a], [b]) => a.localeCompare(b));
  }

  function printCommandList() {
    line('<span class="accent">available commands</span>');
    for (const [name, command] of listCommands()) {
      line(`  /${name.padEnd(10, " ")} <span class="muted">${escapeHtml(command.summary)}</span>`);
    }
  }

  function printBlock(lines, className = "") {
    for (const item of lines) {
      const text = typeof item === "string" ? item : item.text;
      const itemClass = typeof item === "string" ? className : item.className || className;
      line(escapeHtml(text), itemClass);
    }
  }

  function clear() {
    output.replaceChildren();
  }

  function runRawCommand(raw) {
    const parsed = parseCommand(raw);
    if (!parsed.command) {
      return;
    }

    const command = commandRegistry.get(parsed.command);
    const visibleCommand = command?.sensitive ? `/${parsed.command} [redacted]` : raw;
    line(`<span class="output-command">yanivpaz@web:~$ ${escapeHtml(visibleCommand)}</span>`);
    if (!command) {
      line(
        `<span class="error">command not found:</span> ${escapeHtml(parsed.command)} ` +
          '<span class="muted">(/help lists the current command table)</span>'
      );
      return;
    }

    const terminal = {
      args: parsed.args,
      clear,
      command: parsed.command,
      commands: listCommands,
      line,
      printBlock,
      printCommandList,
      raw: parsed.raw,
      write: (text, className) => line(escapeHtml(text), className),
      writeHtml: line,
    };

    try {
      const result = command.run(terminal);
      if (result && typeof result.then === "function") {
        result.catch((error) => {
          line(`<span class="error">error:</span> ${escapeHtml(error.message || error)}`);
        });
      }
    } catch (error) {
      line(`<span class="error">error:</span> ${escapeHtml(error.message || error)}`);
    }
  }

  function submit(value) {
    const raw = value.trim();
    input.value = "";
    if (!raw) {
      return;
    }
    const parsed = parseCommand(raw);
    const command = commandRegistry.get(parsed.command);
    if (!command?.sensitive) {
      history.push(raw);
      history = history.slice(-60);
      saveHistory();
    }
    historyIndex = history.length;
    runRawCommand(raw);
  }

  function autocomplete() {
    const value = input.value.trim();
    const needle = normalizeCommandName(value);
    if (!needle) {
      input.value = "/";
      return;
    }
    const matches = listCommands()
      .map(([name]) => name)
      .filter((name) => name.startsWith(needle));
    if (matches.length === 1) {
      input.value = `/${matches[0]} `;
    } else if (matches.length > 1) {
      line(`<span class="muted">${matches.map((name) => `/${name}`).join("  ")}</span>`);
    }
  }

  function boot() {
    const { date, time, zone } = nowParts();
    bootLine(`<span class="accent">yaniv paz terminal kernel f:v1.0.0 b:v0.1.0 [${date}]</span>`);
    bootLine(`<span class="accent">Local time: ${time} (${escapeHtml(zone)})</span>`);
    bootLine("");
    bootLine(`<span class="ok">[ OK ]</span> Detected visitor: ${escapeHtml(getPlatform())}`);
    bootLine(`<span class="ok">[ OK ]</span> Locale: ${escapeHtml(navigator.language || "local")} | Timezone: ${escapeHtml(zone)}`);
    bootLine(`<span class="ok">[ OK ]</span> Display: ${window.innerWidth}x${window.innerHeight}`);
    bootLine("");
    bootLine('<span class="ok">[ OK ]</span> Loading resources: commands, shortcuts, profile');
    bootLine('<span class="ok">[ OK ]</span> Starting shell service...');
    bootLine("");
    bootLine(`<span class="ready">[${time}] yanivpaz@web -- ready.</span>`);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] || "";
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || "";
    }
    if (event.key === "Tab") {
      event.preventDefault();
      autocomplete();
    }
  });

  quickActions.forEach((button) => {
    button.addEventListener("click", () => {
      submit(button.dataset.command || "");
      input.focus();
    });
  });

  document.addEventListener("click", (event) => {
    const selection = window.getSelection();
    if (!selection || selection.toString()) {
      return;
    }
    if (!event.target.closest("button, a")) {
      input.focus();
    }
  });

  window.WebTerminal = {
    registerCommand,
    run: runRawCommand,
  };

  boot();
  input.focus();
})();
