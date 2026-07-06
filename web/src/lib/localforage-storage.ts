import localforage from "localforage";
import type { StateStorage } from "zustand/middleware";

localforage.config({
    name: "infinite-canvas",
    storeName: "app_state",
});

export const STORAGE_ERROR_EVENT = "infinite-canvas:storage-error";
const LOCAL_STORAGE_FALLBACK_KEYS = new Set(["infinite-canvas:ai_config_store", "infinite-canvas:theme_store"]);

export const localForageStorage: StateStorage = {
    getItem: async (name) => {
        if (typeof window === "undefined") return null;
        try {
            return (await localforage.getItem<string>(name)) || null;
        } catch {
            if (canUseLocalStorageFallback(name)) return readLocalStorage(name);
            notifyStorageError(name);
            return null;
        }
    },
    setItem: async (name, value) => {
        if (typeof window === "undefined") return;
        try {
            await localforage.setItem(name, value);
        } catch {
            if (canUseLocalStorageFallback(name)) {
                writeLocalStorage(name, value);
                return;
            }
            notifyStorageError(name);
        }
    },
    removeItem: async (name) => {
        if (typeof window === "undefined") return;
        try {
            await localforage.removeItem(name);
        } catch {
            if (canUseLocalStorageFallback(name)) removeLocalStorage(name);
        }
    },
};

function canUseLocalStorageFallback(name: string) {
    return LOCAL_STORAGE_FALLBACK_KEYS.has(name);
}

function notifyStorageError(name: string) {
    window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { name } }));
}

function readLocalStorage(name: string) {
    try {
        return window.localStorage.getItem(name);
    } catch {
        return null;
    }
}

function writeLocalStorage(name: string, value: string) {
    try {
        window.localStorage.setItem(name, value);
    } catch {
        notifyStorageError(name);
    }
}

function removeLocalStorage(name: string) {
    try {
        window.localStorage.removeItem(name);
    } catch {
        notifyStorageError(name);
    }
}
