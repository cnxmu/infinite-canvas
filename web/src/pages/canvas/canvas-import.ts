import type { CanvasExportAsset, CanvasExportFile, CanvasProjectExportItem } from "@/types/canvas-export";

export const CANVAS_IMPORT_ZIP_LIMITS = {
    maxInputBytes: 200 * 1024 * 1024,
    maxEntries: 500,
    maxOutputBytes: 600 * 1024 * 1024,
};

export const MAX_PROJECTS_JSON_BYTES = 8 * 1024 * 1024;

const MAX_CANVAS_IMPORT_PROJECTS = 100;
const MAX_CANVAS_IMPORT_FILES = 500;

export function parseCanvasExportFile(text: string): CanvasExportFile {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("projects.json 格式无效");
    }
    if (!isRecord(data) || data.app !== "infinite-canvas" || data.version !== 3 || !Array.isArray(data.projects)) throw new Error("画布压缩包结构无效");
    if (data.projects.length > MAX_CANVAS_IMPORT_PROJECTS) throw new Error(`单次最多导入 ${MAX_CANVAS_IMPORT_PROJECTS} 个画布`);
    const projects = data.projects.map(validateProjectExportItem);
    const fileCount = projects.reduce((total, item) => total + item.files.length, 0);
    if (fileCount > MAX_CANVAS_IMPORT_FILES) throw new Error(`单次最多导入 ${MAX_CANVAS_IMPORT_FILES} 个媒体文件`);
    return { app: "infinite-canvas", version: 3, exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : "", projects };
}

function validateProjectExportItem(value: unknown, index: number): CanvasProjectExportItem {
    if (!isRecord(value) || !isRecord(value.project) || !Array.isArray(value.files)) throw new Error(`第 ${index + 1} 个画布结构无效`);
    const project = value.project;
    if (project.id !== undefined && typeof project.id !== "string") throw new Error(`第 ${index + 1} 个画布 ID 无效`);
    if (project.title !== undefined && typeof project.title !== "string") throw new Error(`第 ${index + 1} 个画布标题无效`);
    if (project.nodes !== undefined && !Array.isArray(project.nodes)) throw new Error(`第 ${index + 1} 个画布节点无效`);
    if (project.connections !== undefined && !Array.isArray(project.connections)) throw new Error(`第 ${index + 1} 个画布连线无效`);
    if (project.chatSessions !== undefined && !Array.isArray(project.chatSessions)) throw new Error(`第 ${index + 1} 个画布助手会话无效`);
    return { project: project as CanvasProjectExportItem["project"], files: value.files.map(validateExportAsset) };
}

function validateExportAsset(value: unknown): CanvasExportAsset {
    if (!isRecord(value) || typeof value.storageKey !== "string" || typeof value.path !== "string" || typeof value.mimeType !== "string" || typeof value.bytes !== "number") throw new Error("媒体文件清单结构无效");
    if (!value.storageKey.includes(":") || !isSafeZipPath(value.path) || !Number.isFinite(value.bytes) || value.bytes < 0) throw new Error("媒体文件清单内容无效");
    return { storageKey: value.storageKey, path: value.path, mimeType: value.mimeType, bytes: value.bytes };
}

function isSafeZipPath(path: string) {
    return Boolean(path && !path.startsWith("/") && !path.includes("\\") && !path.split("/").includes(".."));
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
