import { describe, expect, it } from "vitest";

import { parseCanvasExportFile } from "@/pages/canvas/canvas-import";

describe("画布包校验", () => {
    it("拒绝越权媒体路径", () => {
        const value = { app: "infinite-canvas", version: 3, exportedAt: "", projects: [{ project: { title: "test", nodes: [], connections: [] }, files: [{ storageKey: "image:a", path: "../a.png", mimeType: "image/png", bytes: 1 }] }] };
        expect(() => parseCanvasExportFile(JSON.stringify(value))).toThrow("媒体文件清单内容无效");
    });
});
