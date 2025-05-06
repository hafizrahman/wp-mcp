# wp-mcp

[![smithery badge](https://smithery.ai/badge/@hafizrahman/wp-mcp)](https://smithery.ai/server/@hafizrahman/wp-mcp)

`wp-mcp` is a weather and WordPress integration tool built using the [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol/sdk). This project provides two primary features:

1. **Weather Alerts & Forecasts** using the [National Weather Service API](https://www.weather.gov/documentation/services-web-api).
2. **Various contents** from a personal WordPress blog (`hafiz.blog`).

The project exposes these features as tools within a MCP server, allowing easy access through a command-line interface.

## Features

### Weather Tools
- **Get Active Alerts**: Fetch current weather alerts for a U.S. state.
- **Get Forecast**: Get weather forecasts based on geographical coordinates (latitude and longitude).

### WordPress Tools
- **Get Latest Posts**: Retrieve the 10 most recent posts from a WordPress blog (specifically, my personal blog [hafiz.blog](https://hafiz.blog)).
- **Get Categories**: Retrieve all categories in the site.
- **Get Posts by Category**: Retrieve posts from a specific category by providing the category slug.

### Combine them!
To demo Claude using both tools at once, you can try some clever prompt like: 
- "Get the date from the latest post on hafiz.blog, and check the weather in San Francisco on that date."
- "Check all the categories in hafiz.blog, find one that's likely written in Indonesian, and then make me an poem in Indonesian language based on a post from that category."

## Installation

### Installing via Smithery

To install Weather and WordPress Integration Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@hafizrahman/wp-mcp):

```bash
npx -y @smithery/cli install @hafizrahman/wp-mcp --client claude
```

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v14.x or above)
- [npm](https://www.npmjs.com/)

### Steps:

1. `npm run build`
2. Connect the server with Claude Desktop, which needs to be installed locally. [Follow the instruction here.](https://modelcontextprotocol.io/quickstart/server#test-with-commands)
3. Once Claude Desktop detects the MCP server, try various prompts to check weather, or get latest posts on hafiz.blog, or do a combo prompt as mentioned above.
