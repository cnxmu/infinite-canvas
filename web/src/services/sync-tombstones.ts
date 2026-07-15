import localforage from "localforage";

export type AppSyncDomainKey = "canvas" | "assets" | "image-workbench" | "video-workbench";
export type SyncTombstones = Record<string, string>;

const store = localforage.createInstance({ name: "infinite-canvas", storeName: "sync_metadata" });
let writeQueue: Promise<unknown> = Promise.resolve();

export function recordSyncDeletions(domain: AppSyncDomainKey, ids: string[]) {
    if (!ids.length) return Promise.resolve();
    const deletedAt = new Date().toISOString();
    writeQueue = writeQueue
        .catch(() => undefined)
        .then(async () => {
            const current = await readTombstones(domain);
            ids.forEach((id) => {
                if (id) current[id] = deletedAt;
            });
            await store.setItem(domain, current);
        });
    return writeQueue.catch(() => undefined);
}

export async function readSyncTombstones(domain: AppSyncDomainKey) {
    await writeQueue.catch(() => undefined);
    return readTombstones(domain);
}

export async function replaceSyncTombstones(domain: AppSyncDomainKey, tombstones: SyncTombstones) {
    await writeQueue.catch(() => undefined);
    await store.setItem(domain, tombstones);
}

export function mergeSyncTombstones(...groups: SyncTombstones[]) {
    const merged: SyncTombstones = {};
    groups.forEach((group) => {
        Object.entries(group || {}).forEach(([id, deletedAt]) => {
            if (!id || typeof deletedAt !== "string" || !Number.isFinite(Date.parse(deletedAt))) return;
            if (!merged[id] || Date.parse(deletedAt) > Date.parse(merged[id])) merged[id] = deletedAt;
        });
    });
    return merged;
}

async function readTombstones(domain: AppSyncDomainKey) {
    return (await store.getItem<SyncTombstones>(domain)) || {};
}
