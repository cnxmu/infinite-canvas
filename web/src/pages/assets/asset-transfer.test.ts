import { describe, expect, it } from "vitest";

import { parseAssetExportFile } from "@/pages/assets/asset-transfer";

describe("素材包校验", () => {
    it("拒绝缺少媒体清单的素材", () => {
        const value = {
            app: "infinite-canvas",
            version: 1,
            exportedAt: "",
            assets: [{ id: "a", kind: "image", title: "image", coverUrl: "", tags: [], createdAt: "", updatedAt: "", data: { dataUrl: "", storageKey: "image:a", width: 1, height: 1, bytes: 1, mimeType: "image/png" } }],
            files: [],
        };
        expect(() => parseAssetExportFile(JSON.stringify(value))).toThrow("缺少媒体清单");
    });
});
