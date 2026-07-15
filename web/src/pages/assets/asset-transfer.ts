import { saveAs } from "file-saver";

import { createZip, readZip } from "@/lib/zip";
import { getMediaBlob, resolveMediaUrl, setMediaBlob } from "@/services/file-storage";
import { getImageBlob, resolveImageUrl, setImageBlob } from "@/services/image-storage";
import type { Asset } from "@/stores/use-asset-store";

type AssetExportFile = {
    app: "infinite-canvas";
    version: 1;
    exportedAt: string;
    assets: Asset[];
    files: AssetExportItem[];
};

type AssetExportItem = {
    storageKey: string;
    path: string;
    mimeType: string;
    bytes: number;
};

const MAX_ASSETS_JSON_BYTES = 8 * 1024 * 1024;
const MAX_IMPORTED_ASSETS = 1000;
const MAX_IMPORTED_FILES = 500;

export async function exportAssets(assets: Asset[]) {
    const files: AssetExportItem[] = [];
    const zipFiles: { name: string; data: BlobPart }[] = [];
    const exportedStorageKeys = new Set<string>();

    await Promise.all(
        assets.map(async (asset) => {
            if (asset.kind !== "image" && asset.kind !== "video") return;
            const storageKey = asset.data.storageKey;
            if (!storageKey || exportedStorageKeys.has(storageKey)) return;
            exportedStorageKeys.add(storageKey);
            const blob = asset.kind === "image" ? await getImageBlob(storageKey) : await getMediaBlob(storageKey);
            if (!blob) return;
            const path = `files/${safeFileName(storageKey)}.${fileExtension(blob.type, asset.kind)}`;
            files.push({ storageKey, path, mimeType: blob.type || asset.data.mimeType, bytes: blob.size });
            zipFiles.push({ name: path, data: blob });
        }),
    );

    const data: AssetExportFile = { app: "infinite-canvas", version: 1, exportedAt: new Date().toISOString(), assets, files };
    const zip = await createZip([{ name: "assets.json", data: JSON.stringify(data, null, 2) }, ...zipFiles]);
    saveAs(zip, "我的素材.zip");
}

export async function readAssetPackage(file: File) {
    const zip = await readZip(file);
    const assetFile = zip.get("assets.json");
    if (!assetFile) throw new Error("压缩包缺少 assets.json");
    if (assetFile.size > MAX_ASSETS_JSON_BYTES) throw new Error("assets.json 过大");
    const data = parseAssetExportFile(await assetFile.text());
    await Promise.all(
        data.files.map(async (item) => {
            const blob = zip.get(item.path);
            if (!blob) throw new Error(`缺少媒体文件：${item.path}`);
            if (blob.size !== item.bytes) throw new Error(`媒体文件大小不一致：${item.path}`);
            const typedBlob = blob.type ? blob : blob.slice(0, blob.size, item.mimeType);
            await (item.storageKey.startsWith("image:") ? setImageBlob(item.storageKey, typedBlob) : setMediaBlob(item.storageKey, typedBlob));
        }),
    );
    return Promise.all(
        data.assets.map(async (asset) => {
            if (asset.kind === "image" && asset.data.storageKey) {
                const dataUrl = await resolveImageUrl(asset.data.storageKey, asset.data.dataUrl);
                return { ...asset, coverUrl: asset.coverUrl.startsWith("blob:") ? dataUrl : asset.coverUrl, data: { ...asset.data, dataUrl } };
            }
            if (asset.kind === "video" && asset.data.storageKey) {
                const url = await resolveMediaUrl(asset.data.storageKey, asset.data.url);
                return { ...asset, coverUrl: asset.coverUrl.startsWith("blob:") ? url : asset.coverUrl, data: { ...asset.data, url } };
            }
            return asset;
        }),
    );
}

export function parseAssetExportFile(text: string): AssetExportFile {
    let value: unknown;
    try {
        value = JSON.parse(text);
    } catch {
        throw new Error("assets.json 格式无效");
    }
    if (!isRecord(value) || value.app !== "infinite-canvas" || value.version !== 1 || !Array.isArray(value.assets) || !Array.isArray(value.files)) throw new Error("素材压缩包结构无效");
    if (value.assets.length > MAX_IMPORTED_ASSETS) throw new Error(`单次最多导入 ${MAX_IMPORTED_ASSETS} 个素材`);
    if (value.files.length > MAX_IMPORTED_FILES) throw new Error(`单次最多导入 ${MAX_IMPORTED_FILES} 个媒体文件`);
    const assets = value.assets.map(validateAsset);
    const files = value.files.map(validateExportItem);
    if (new Set(files.map((item) => item.storageKey)).size !== files.length || new Set(files.map((item) => item.path)).size !== files.length) throw new Error("媒体文件清单包含重复项");
    const fileKeys = new Set(files.map((item) => item.storageKey));
    assets.forEach((asset) => {
        if ((asset.kind === "image" || asset.kind === "video") && asset.data.storageKey && !fileKeys.has(asset.data.storageKey)) throw new Error(`素材缺少媒体清单：${asset.title}`);
    });
    return { app: "infinite-canvas", version: 1, exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : "", assets, files };
}

function validateAsset(value: unknown): Asset {
    if (!isRecord(value) || typeof value.id !== "string" || !["text", "image", "video"].includes(String(value.kind)) || typeof value.title !== "string" || typeof value.coverUrl !== "string" || typeof value.createdAt !== "string" || typeof value.updatedAt !== "string" || !Array.isArray(value.tags) || !value.tags.every((tag) => typeof tag === "string") || !isRecord(value.data)) throw new Error("素材条目结构无效");
    if (value.kind === "text" && typeof value.data.content !== "string") throw new Error(`文本素材内容无效：${value.title}`);
    if (value.kind === "image" && (typeof value.data.dataUrl !== "string" || !validMediaData(value.data))) throw new Error(`图片素材内容无效：${value.title}`);
    if (value.kind === "video" && (typeof value.data.url !== "string" || !validMediaData(value.data))) throw new Error(`视频素材内容无效：${value.title}`);
    if (value.kind === "image" && typeof value.data.storageKey === "string" && !value.data.storageKey.startsWith("image:")) throw new Error(`图片素材存储键无效：${value.title}`);
    if (value.kind === "video" && typeof value.data.storageKey === "string" && value.data.storageKey.startsWith("image:")) throw new Error(`视频素材存储键无效：${value.title}`);
    return value as Asset;
}

function validMediaData(value: Record<string, unknown>) {
    return (value.storageKey === undefined || typeof value.storageKey === "string") && typeof value.width === "number" && typeof value.height === "number" && typeof value.bytes === "number" && Number.isFinite(value.bytes) && value.bytes >= 0 && typeof value.mimeType === "string";
}

function validateExportItem(value: unknown): AssetExportItem {
    if (!isRecord(value) || typeof value.storageKey !== "string" || !/^(image|video|audio|file):/.test(value.storageKey) || typeof value.path !== "string" || !isSafeZipPath(value.path) || typeof value.mimeType !== "string" || typeof value.bytes !== "number" || !Number.isFinite(value.bytes) || value.bytes < 0) throw new Error("媒体文件清单无效");
    return { storageKey: value.storageKey, path: value.path, mimeType: value.mimeType, bytes: value.bytes };
}

function isSafeZipPath(path: string) {
    return Boolean(path && !path.startsWith("/") && !path.includes("\\") && !path.split("/").includes(".."));
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeFileName(value: string) {
    return value.replace(/[\\/:*?"<>|]/g, "_");
}

function fileExtension(mimeType: string, kind: Asset["kind"]) {
    if (mimeType.includes("png")) return "png";
    if (mimeType.includes("jpeg")) return "jpg";
    if (mimeType.includes("webp")) return "webp";
    if (mimeType.includes("gif")) return "gif";
    if (mimeType.includes("mp4")) return "mp4";
    if (mimeType.includes("webm")) return "webm";
    return kind === "image" ? "png" : "bin";
}
