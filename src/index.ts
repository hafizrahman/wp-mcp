import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const NWS_API_BASE = "https://api.weather.gov";
const WP_COM_API_BASE = "https://public-api.wordpress.com/wp/v2/sites/hafiz.blog";
const USER_AGENT = "wp-mcp/1.0";

// Create server instance
const server = new McpServer({
    name: "wp-mcp",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});

// --- Shared helpers ---
async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
    try {
        const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, ...headers } });
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return (await response.json()) as T;
    } catch (err) {
        console.error("Fetch error:", err);
        return null;
    }
}

// --- NWS (Weather) functionality ---
interface AlertFeature {
    properties: {
        event?: string;
        areaDesc?: string;
        severity?: string;
        status?: string;
        headline?: string;
    };
}

function formatAlert(feature: AlertFeature): string {
    const props = feature.properties;
    return [
        `Event: ${props.event || "Unknown"}`,
        `Area: ${props.areaDesc || "Unknown"}`,
        `Severity: ${props.severity || "Unknown"}`,
        `Status: ${props.status || "Unknown"}`,
        `Headline: ${props.headline || "No headline"}`,
        "---",
    ].join("\n");
}

interface ForecastPeriod {
    name?: string;
    temperature?: number;
    temperatureUnit?: string;
    windSpeed?: string;
    windDirection?: string;
    shortForecast?: string;
}

interface AlertsResponse {
    features: AlertFeature[];
}

interface PointsResponse {
    properties: {
        forecast?: string;
    };
}

interface ForecastResponse {
    properties: {
        periods: ForecastPeriod[];
    };
}

server.tool(
    "get-alerts",
    "Get weather alerts for a state",
    {
        state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
    },
    async ({ state }) => {
        const stateCode = state.toUpperCase();
        const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
        const alertsData = await fetchJson<AlertsResponse>(alertsUrl, {
            Accept: "application/geo+json",
        });

        if (!alertsData) {
            return {
                content: [{ type: "text", text: "Failed to retrieve alerts data" }],
            };
        }

        const features = alertsData.features || [];
        if (features.length === 0) {
            return {
                content: [{ type: "text", text: `No active alerts for ${stateCode}` }],
            };
        }

        const formattedAlerts = features.map(formatAlert);
        return {
            content: [{ type: "text", text: `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}` }],
        };
    }
);

server.tool(
    "get-forecast",
    "Get weather forecast for a location",
    {
        latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
        longitude: z.number().min(-180).max(180).describe("Longitude of the location"),
    },
    async ({ latitude, longitude }) => {
        const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
        const pointsData = await fetchJson<PointsResponse>(pointsUrl, {
            Accept: "application/geo+json",
        });

        if (!pointsData || !pointsData.properties?.forecast) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to get forecast data for coordinates: ${latitude}, ${longitude}`,
                    },
                ],
            };
        }

        const forecastData = await fetchJson<ForecastResponse>(pointsData.properties.forecast);
        if (!forecastData) {
            return {
                content: [{ type: "text", text: "Failed to retrieve forecast data" }],
            };
        }

        const periods = forecastData.properties?.periods || [];
        if (periods.length === 0) {
            return {
                content: [{ type: "text", text: "No forecast periods available" }],
            };
        }

        const formattedForecast = periods.map((period) =>
            [
                `${period.name || "Unknown"}:`,
                `Temperature: ${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
                `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
                `${period.shortForecast || "No forecast available"}`,
                "---",
            ].join("\n")
        );

        return {
            content: [{ type: "text", text: `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join("\n")}` }],
        };
    }
);

// --- WordPress functionality ---
interface WPPost {
    id: number;
    title: { rendered: string };
    link: string;
    date: string;
    excerpt: { rendered: string };
}

function stripHTML(html: string): string {
    return html.replace(/<\/?[^>]+(>|$)/g, "").replace(/&nbsp;/g, " ");
}

server.tool(
    "get-latest-posts",
    "Get the 10 most recent posts from hafiz.blog (WordPress.com)",
    {},
    async () => {
        const postsUrl = `${WP_COM_API_BASE}/posts?per_page=10&_fields=id,title,link,date,excerpt`;
        const posts = await fetchJson<WPPost[]>(postsUrl);

        if (!posts || posts.length === 0) {
            return {
                content: [{ type: "text", text: "No posts found or failed to fetch." }],
            };
        }

        const formattedPosts = posts.map((post) =>
            [
                `Title: ${post.title.rendered}`,
                `Date: ${new Date(post.date).toLocaleString()}`,
                `Link: ${post.link}`,
                `Excerpt: ${stripHTML(post.excerpt.rendered).slice(0, 200)}...`,
                "---",
            ].join("\n")
        );

        return {
            content: [{ type: "text", text: `Latest posts from hafiz.blog:\n\n${formattedPosts.join("\n")}` }],
        };
    }
);

// --- Start server ---
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("WP + Weather MCP Server running on stdio");
}

main().catch((err) => {
    console.error("Fatal error in main():", err);
    process.exit(1);
});
