export type CanvasAgentLaunchConfig = {
    endpoint: string;
    token: string;
};

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function normalizeLocalAgentEndpoint(value: string) {
    const endpoint = value.trim().replace(/\/+$/, "");
    if (!endpoint) throw new Error("请填写本地 Agent 地址");
    let url: URL;
    try {
        url = new URL(endpoint);
    } catch {
        throw new Error("本地 Agent 地址格式不正确");
    }
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !LOOPBACK_HOSTS.has(url.hostname) || url.username || url.password) {
        throw new Error("Canvas Agent 只允许连接本机 localhost、127.0.0.1 或 ::1 地址");
    }
    return url.origin;
}

export function readCanvasAgentLaunchConfig(hash = window.location.hash): CanvasAgentLaunchConfig | null {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const endpoint = params.get("agentUrl") || "";
    const token = params.get("agentToken") || "";
    if (!endpoint || !token) return null;
    try {
        return { endpoint: normalizeLocalAgentEndpoint(endpoint), token };
    } catch {
        return null;
    }
}

export function clearCanvasAgentLaunchConfig() {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    params.delete("agentUrl");
    params.delete("agentToken");
    const hash = params.size ? `#${params}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
}
