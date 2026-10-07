# aisafety-mcp

MCP server wrapping the public [AISafety.com](https://aisafety.com/developers) read-only JSON API (`https://aisafety.com/api/v1`). No auth, stateless, stdio transport. Built on `@modelcontextprotocol/sdk`.

## Install

```bash
npm install
npm run build
```

Run directly:

```bash
node dist/index.js
# or for dev:
npx tsx src/index.ts
```

## MCP config

Claude Desktop (`claude_desktop_config.json`) or Claude Code (`~/.claude.json` / `.mcp.json`):

```json
{
  "mcpServers": {
    "aisafety": {
      "command": "node",
      "args": ["E:/development/aisafety-mcp/dist/index.js"]
    }
  }
}
```

With tsx (no build step):

```json
{
  "mcpServers": {
    "aisafety": {
      "command": "npx",
      "args": ["tsx", "E:/development/aisafety-mcp/src/index.ts"]
    }
  }
}
```

## Tools

One tool per API collection. Each accepts `q` (free-text search across all fields), the documented per-collection filter fields (case-insensitive substring, comma-separated for OR, AND across fields), and `limit` (1–50, default 10). Returns `{ count, license, attribution, results }`, trimmed to sane sizes (long strings truncated, total output capped).

| Tool | Collection | Filters |
|---|---|---|
| `search_communities` | `/communities` | `platform`, `type`, `activityLevel`, `focus`, `size`, `location` |
| `search_organizations` | `/organizations` | `category`, `status`, `scale` |
| `search_events` | `/events` | `type`, `location`, `host`, `mode`, `cost` |
| `search_training` | `/training` | `type`, `location`, `mode`, `focus`, `entryBar`, `stipend`, `recurring` |
| `search_jobs` | `/jobs` | `organization`, `location`, `roleType`, `workLocation`, `minimumExperience` |
| `search_funding` | `/funding` | `type`, `recipientType`, `acceptingApplications` |
| `search_courses` | `/courses` | `category`, `courseType`, `organizer` |
| `search_advisors` | `/advisors` | `focus`, `status` |
| `search_media_channels` | `/media-channels` | `type` |
| `search_founder_resources` | `/founder-resources` | `type` |
| `search_projects` | `/projects` | `status` |

## License

Server code: MIT (see `LICENSE`). API data: [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) — please credit AISafety.com when using the data.
