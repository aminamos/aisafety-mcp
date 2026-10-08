<div align="center">

# aisafety-mcp

MCP server for the public AISafety.com directory API — eleven read-only tools over AI safety communities, orgs, events, jobs, funding, courses, and more.

[![MIT License][license-shield]][license-url]
[![TypeScript][typescript-shield]][typescript-url]
[![MCP][mcp-shield]][mcp-url]
[![Node][node-shield]][node-url]

</div>

## About

Thin, stateless MCP server (stdio transport) wrapping the public read-only JSON API at `https://aisafety.com/api/v1`. No auth, no dependencies beyond the MCP SDK and `fetch`. Each tool takes free-text `q`, the API's documented per-collection filters, and uniform `offset`/`limit` pagination, and returns `{ count, offset, limit, hasMore, license, attribution, results }` trimmed to sane sizes. The upstream API returns full collections, so paging is applied client-side after filters.

### Built With

- [TypeScript](https://www.typescriptlang.org/)
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk) (`@modelcontextprotocol/sdk`)
- [Zod](https://zod.dev/) (tool input schemas)
- [AISafety.com API](https://aisafety.com/developers) (data source, CC-BY-4.0)

## Getting Started

### Prerequisites

- Node.js 18+
- An MCP client (Claude Desktop, Claude Code, etc.)

### Installation

```bash
git clone https://github.com/aminamos/aisafety-mcp.git
cd aisafety-mcp
npm install
npm run build
```

Point your MCP client at the built server. Claude Desktop (`claude_desktop_config.json`) / Claude Code (`.mcp.json`):

```json
{
  "mcpServers": {
    "aisafety": {
      "command": "node",
      "args": ["/absolute/path/to/aisafety-mcp/dist/index.js"]
    }
  }
}
```

No build step — run from source with `tsx`:

```json
{
  "mcpServers": {
    "aisafety": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/aisafety-mcp/src/index.ts"]
    }
  }
}
```

## Usage

One tool per API collection. Common args: `q` (free-text search across all fields), `offset` (rows to skip, default 0), `limit` (page size 1–50, default 10). Filters are case-insensitive substrings; comma-separate for OR, combine fields for AND. `count` is total matches before paging; `hasMore` signals another page.

```json
{ "tool": "search_events", "arguments": { "q": "conference", "mode": "online", "limit": 5 } }
{ "tool": "search_jobs", "arguments": { "organization": "Redwood", "workLocation": "remote" } }
{ "tool": "search_funding", "arguments": { "acceptingApplications": "yes" } }
```

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

## Roadmap

- [x] One tool per collection with live filter passthrough
- [x] Output trimming (long strings, total size cap)
- [x] Client-side pagination (`offset` + `limit`, page size capped at 50)
- [ ] Pin / surface upstream API version from OpenAPI spec

## Contributing

PRs welcome. Keep it boring: stdio transport, stateless, no new runtime deps without a reason.

1. Fork the repo
2. Create your branch (`git checkout -b feature/thing`)
3. Commit (`git commit -m 'Add thing'`)
4. Push (`git push origin feature/thing`)
5. Open a pull request

## License

Server code: MIT — see [`LICENSE`](LICENSE). API data: [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) — credit AISafety.com when using the data.

## Contact

Amin Amos — [@aminamos](https://github.com/aminamos)

Project link: [https://github.com/aminamos/aisafety-mcp](https://github.com/aminamos/aisafety-mcp)

## Acknowledgments

- [AISafety.com](https://aisafety.com) for the open CC-BY-4.0 directory API
- [Best-README-Template](https://github.com/othneildrew/Best-README-Template) for the README structure

[license-shield]: https://img.shields.io/badge/license-MIT-green.svg
[license-url]: https://github.com/aminamos/aisafety-mcp/blob/main/LICENSE
[typescript-shield]: https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/
[mcp-shield]: https://img.shields.io/badge/MCP-stdio-blueviolet
[mcp-url]: https://modelcontextprotocol.io/
[node-shield]: https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white
[node-url]: https://nodejs.org/
