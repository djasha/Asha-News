const { execFile } = require("child_process");

// Execute `docker mcp ...` with optional remote context
function dockerMcpExec(args, parseJson = true) {
  return new Promise((resolve, reject) => {
    const ctx = process.env.MCP_DOCKER_CONTEXT;
    const fullArgs = (ctx ? ["--context", ctx] : []).concat(args);
    execFile(
      "docker",
      fullArgs,
      { maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          const e = new Error(`docker mcp failed: ${stderr || err.message}`);
          e.code = err.code;
          return reject(e);
        }
        if (!parseJson) return resolve(stdout);
        try {
          const text = (stdout || "").trim();
          const json = JSON.parse(text || "{}");
          return resolve(json);
        } catch {
          // Try to extract JSON object/array substring (some CLIs print non-JSON prefixes)
          const text = (stdout || "").trim();
          const firstBrace = text.indexOf("{");
          const firstBracket = text.indexOf("[");
          let start = -1;
          if (firstBrace !== -1 && firstBracket !== -1) start = Math.min(firstBrace, firstBracket);
          else if (firstBrace !== -1) start = firstBrace;
          else if (firstBracket !== -1) start = firstBracket;
          if (start !== -1) {
            const candidate = text.slice(start);
            try {
              const parsed = JSON.parse(candidate);
              return resolve(parsed);
            } catch {}
          }
          // Fallback: return raw stdout so callers can still see results
          return resolve({ raw: stdout });
        }
      }
    );
  });
}

// Build CLI args for a given tool call, preserving types using := for non-strings
function buildToolCliArgs(name, params) {
  const out = ["mcp", "tools", "call", name];
  if (params && typeof params === "object") {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      if (typeof v === "string") out.push(`${k}=${v}`);
      else out.push(`${k}:=${JSON.stringify(v)}`);
    }
  }
  return out;
}

async function listTools() {
  return dockerMcpExec(["mcp", "tools", "ls", "--format", "json"]);
}

async function listResources() {
  try {
    return await dockerMcpExec(["mcp", "resources", "ls", "--format", "json"]);
  } catch {
    return { resources: [] };
  }
}

async function callTool(name, args = {}) {
  if (!name) throw new Error("Tool name is required");
  return dockerMcpExec(buildToolCliArgs(name, args));
}

module.exports = {
  listTools,
  listResources,
  callTool,
};
