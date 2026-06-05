(function () {
  const terminal = window.WebTerminal;

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
