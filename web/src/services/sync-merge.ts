import type { SyncTombstones } from "@/services/sync-tombstones";

export function mergeById<T extends { id?: string }>(local: T[], remote: T[], timeKey: string, deleted: SyncTombstones = {}) {
    const items = new Map<string, T>();
    remote.forEach((item) => {
        const id = item.id || "";
        if (id) items.set(id, item);
    });
    local.forEach((item) => {
        const id = item.id || "";
        if (!id) return;
        const current = items.get(id);
        if (!current || getTime(item as Record<string, unknown>, timeKey) >= getTime(current as Record<string, unknown>, timeKey)) items.set(id, item);
    });
    return Array.from(items.values())
        .filter((item) => {
            const id = item.id || "";
            const deletedAt = Date.parse(deleted[id] || "");
            return !id || !Number.isFinite(deletedAt) || getTime(item as Record<string, unknown>, timeKey) > deletedAt;
        })
        .sort((a, b) => getTime(b as Record<string, unknown>, timeKey) - getTime(a as Record<string, unknown>, timeKey));
}

function getTime(item: Record<string, unknown>, key: string) {
    const value = item[key];
    if (typeof value === "number") return value;
    if (typeof value === "string") return Date.parse(value) || 0;
    return 0;
}
