import { describe, expect, it } from "vitest";

import { normalizeLocalAgentEndpoint, readCanvasAgentLaunchConfig } from "@/lib/canvas/canvas-agent-endpoint";

describe("Canvas Agent 地址", () => {
    it("只接受本机回环地址", () => {
        expect(normalizeLocalAgentEndpoint("http://127.0.0.1:17371/")).toBe("http://127.0.0.1:17371");
        expect(normalizeLocalAgentEndpoint("http://localhost:17371")).toBe("http://localhost:17371");
        expect(() => normalizeLocalAgentEndpoint("https://agent.example.com")).toThrow("只允许连接本机");
        expect(() => normalizeLocalAgentEndpoint("http://user:pass@127.0.0.1:17371")).toThrow("只允许连接本机");
    });

    it("从 fragment 读取启动配置", () => {
        expect(readCanvasAgentLaunchConfig("#agentUrl=http%3A%2F%2F127.0.0.1%3A17371&agentToken=secret")).toEqual({ endpoint: "http://127.0.0.1:17371", token: "secret" });
        expect(readCanvasAgentLaunchConfig("#agentUrl=http%3A%2F%2F127.0.0.1%3A17371")).toBeNull();
        expect(readCanvasAgentLaunchConfig("#agentUrl=https%3A%2F%2Fagent.example.com&agentToken=secret")).toBeNull();
    });
});
