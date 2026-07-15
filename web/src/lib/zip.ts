import { Unzip, UnzipInflate, zipSync } from "fflate";

type ZipFile = {
    name: string;
    data: BlobPart;
};

type ReadZipOptions = {
    maxInputBytes?: number;
    maxEntries?: number;
    maxOutputBytes?: number;
};

const DEFAULT_MAX_INPUT_BYTES = 200 * 1024 * 1024;
const DEFAULT_MAX_ENTRIES = 500;
const DEFAULT_MAX_OUTPUT_BYTES = 600 * 1024 * 1024;

export async function createZip(files: ZipFile[]) {
    const entries = await Promise.all(
        files.map(async (file) => {
            const data = new Uint8Array(await new Blob([file.data]).arrayBuffer());
            return [file.name, data] as const;
        }),
    );
    return new Blob([zipSync(Object.fromEntries(entries), { level: 0 })], { type: "application/zip" });
}

export async function readZip(file: Blob, options: ReadZipOptions = {}) {
    const maxInputBytes = options.maxInputBytes ?? DEFAULT_MAX_INPUT_BYTES;
    const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
    if (file.size > maxInputBytes) throw new Error(`压缩包不能超过 ${formatBytes(maxInputBytes)}`);
    const entries = new Map<string, Blob>();
    const entryNames = new Set<string>();
    let outputBytes = 0;
    let entryCount = 0;
    const unzip = new Unzip((entry) => {
        entryCount += 1;
        if (entryCount > maxEntries) throw new Error(`压缩包文件数量不能超过 ${maxEntries} 个`);
        if (entryNames.has(entry.name)) throw new Error(`压缩包包含重复文件：${entry.name}`);
        entryNames.add(entry.name);
        const chunks: Uint8Array[] = [];
        entry.ondata = (error, chunk, final) => {
            if (error) throw error;
            outputBytes += chunk.byteLength;
            if (outputBytes > maxOutputBytes) throw new Error(`压缩包解压后不能超过 ${formatBytes(maxOutputBytes)}`);
            chunks.push(chunk);
            if (final) entries.set(entry.name, new Blob(chunks));
        };
        entry.start();
    });
    unzip.register(UnzipInflate);
    unzip.push(new Uint8Array(await file.arrayBuffer()), true);
    return entries;
}

function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / 1024 / 1024)}MB`;
}
