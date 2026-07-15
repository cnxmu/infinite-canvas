import localforage from "localforage";

export const imageGenerationLogStore = localforage.createInstance({ name: "infinite-canvas", storeName: "image_generation_logs" });
export const videoGenerationLogStore = localforage.createInstance({ name: "infinite-canvas", storeName: "video_generation_logs" });
const runtimeUsage = new Map<string, unknown>();

export function setGenerationRuntimeUsage(key: string, value: unknown) {
    runtimeUsage.set(key, value);
    return () => {
        runtimeUsage.delete(key);
    };
}

export async function readGenerationLogUsage() {
    const values: unknown[] = [];
    await Promise.all(
        [imageGenerationLogStore, videoGenerationLogStore].map((store) =>
            store.iterate((value) => {
                values.push(value);
            }),
        ),
    );
    return [...values, ...runtimeUsage.values()];
}
