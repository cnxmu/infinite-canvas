import { unzipSync, zipSync } from "fflate";

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
    const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
    const names = Object.keys(entries);
    if (names.length > maxEntries) throw new Error(`压缩包文件数量不能超过 ${maxEntries} 个`);
    const outputBytes = names.reduce((total, name) => total + entries[name].byteLength, 0);
    if (outputBytes > maxOutputBytes) throw new Error(`压缩包解压后不能超过 ${formatBytes(maxOutputBytes)}`);
    return new Map(Object.entries(entries).map(([name, data]) => [name, new Blob([data])]));
}

function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / 1024 / 1024)}MB`;
}
