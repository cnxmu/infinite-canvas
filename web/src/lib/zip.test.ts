import { describe, expect, it } from "vitest";

import { createZip, readZip } from "@/lib/zip";

describe("ZIP 限制", () => {
    it("在解压过程中阻止超出输出上限", async () => {
        const zip = await createZip([{ name: "large.txt", data: "x".repeat(4096) }]);
        await expect(readZip(zip, { maxInputBytes: 1024 * 1024, maxEntries: 10, maxOutputBytes: 1024 })).rejects.toThrow("解压后不能超过");
    });

    it("读取正常压缩包", async () => {
        const zip = await createZip([{ name: "hello.txt", data: "hello" }]);
        const entries = await readZip(zip);
        expect(await entries.get("hello.txt")?.text()).toBe("hello");
    });
});
