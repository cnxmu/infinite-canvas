import { describe, expect, it } from "vitest";

import { buildApiUrl, createModelChannel, FIXED_BASE_URL, normalizeFixedBaseUrl } from "@/stores/use-config-store";

describe("固定 AI 接口站点", () => {
    it("始终使用唯一固定地址", () => {
        expect(FIXED_BASE_URL).toBe("https://www.aiba.hk");
        expect(normalizeFixedBaseUrl()).toBe(FIXED_BASE_URL);
        expect(createModelChannel({ baseUrl: "https://example.com" }).baseUrl).toBe(FIXED_BASE_URL);
        expect(buildApiUrl("/models")).toBe(`${FIXED_BASE_URL}/v1/models`);
    });
});
