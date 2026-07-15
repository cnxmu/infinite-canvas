import { describe, expect, it } from "vitest";

import { mergeById } from "@/services/sync-merge";

describe("WebDAV 数据合并", () => {
    it("保留同 ID 中更新时间较新的记录", () => {
        const merged = mergeById([{ id: "a", updatedAt: "2026-01-02T00:00:00.000Z", value: "local" }], [{ id: "a", updatedAt: "2026-01-01T00:00:00.000Z", value: "remote" }], "updatedAt");
        expect(merged).toHaveLength(1);
        expect(merged[0].value).toBe("local");
    });

    it("删除墓碑晚于记录时不再恢复记录", () => {
        const merged = mergeById([], [{ id: "a", updatedAt: "2026-01-01T00:00:00.000Z" }], "updatedAt", { a: "2026-01-02T00:00:00.000Z" });
        expect(merged).toEqual([]);
    });
});
