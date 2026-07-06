import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";

import { nanoid } from "nanoid";
import { localForageStorage } from "@/lib/localforage-storage";
import type { CanvasBackgroundMode } from "@/lib/canvas-theme";
import type { CanvasAssistantSession, CanvasConnection, CanvasNodeData, ViewportTransform } from "@/types/canvas";

export type CanvasProject = {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    nodes: CanvasNodeData[];
    connections: CanvasConnection[];
    chatSessions: CanvasAssistantSession[];
    activeChatId: string | null;
    backgroundMode: CanvasBackgroundMode;
    showImageInfo: boolean;
    viewport: ViewportTransform;
};

type CanvasStore = {
    hydrated: boolean;
    projects: CanvasProject[];
    createProject: (title?: string) => string;
    importProject: (project: Partial<CanvasProject>) => string;
    openProject: (id: string) => CanvasProject | null;
    renameProject: (id: string, title: string) => void;
    deleteProjects: (ids: string[]) => void;
    replaceProjects: (projects: CanvasProject[]) => void;
    updateProject: (id: string, patch: Partial<Pick<CanvasProject, "nodes" | "connections" | "chatSessions" | "activeChatId" | "backgroundMode" | "showImageInfo" | "viewport">>) => void;
};

const initialViewport: ViewportTransform = { x: 0, y: 0, k: 1 };
const CANVAS_STORE_KEY = "infinite-canvas:canvas_store";
const CANVAS_PROJECT_KEY_PREFIX = `${CANVAS_STORE_KEY}:project:`;
type PersistedCanvasState = Pick<CanvasStore, "projects">;
type PersistedCanvasIndex = { version: 2; projectIds: string[] };
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let queuedPersistState: PersistedCanvasState | null = null;
let persistedProjectIds = new Set<string>();

const canvasStorage: PersistStorage<CanvasStore> = {
    getItem: async (name) => {
        const value = await localForageStorage.getItem(name);
        if (!value) return null;
        const parsed = JSON.parse(value) as StorageValue<CanvasStore>;
        if (isCanvasProjectIndex(parsed.state)) {
            const projects = (
                await Promise.all(
                    parsed.state.projectIds.map(async (id) => {
                        const project = await localForageStorage.getItem(canvasProjectKey(id));
                        if (!project) return null;
                        try {
                            return JSON.parse(project) as CanvasProject;
                        } catch {
                            return null;
                        }
                    }),
                )
            ).filter((project): project is CanvasProject => Boolean(project));
            persistedProjectIds = new Set(projects.map((project) => project.id));
            queuedPersistState = { projects };
            return { ...parsed, state: { projects } as StorageValue<CanvasStore>["state"] };
        }
        const state = parsed.state as PersistedCanvasState;
        queuedPersistState = state;
        persistedProjectIds = new Set((state.projects || []).map((project) => project.id));
        return parsed;
    },
    setItem: (name, value) => {
        const nextState = value.state as PersistedCanvasState;
        if (queuedPersistState && queuedPersistState.projects === nextState.projects) return;
        queuedPersistState = nextState;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveTimer = null;
            void persistCanvasProjects(name, value, nextState);
        }, 400);
    },
    removeItem: async (name) => {
        await Promise.all([...persistedProjectIds].map((id) => localForageStorage.removeItem(canvasProjectKey(id))));
        persistedProjectIds.clear();
        await localForageStorage.removeItem(name);
    },
};

export const useCanvasStore = create<CanvasStore>()(
    persist(
        (set, get) => ({
            hydrated: false,
            projects: [],
            createProject: (title = "未命名画布") => {
                const now = new Date().toISOString();
                const id = nanoid();
                const project: CanvasProject = {
                    id,
                    title,
                    createdAt: now,
                    updatedAt: now,
                    nodes: [],
                    connections: [],
                    chatSessions: [],
                    activeChatId: null,
                    backgroundMode: "lines",
                    showImageInfo: false,
                    viewport: initialViewport,
                };
                set((state) => ({ projects: [project, ...state.projects] }));
                return id;
            },
            importProject: (source) => {
                const now = new Date().toISOString();
                const project: CanvasProject = {
                    id: nanoid(),
                    title: source.title || "导入画布",
                    createdAt: source.createdAt || now,
                    updatedAt: now,
                    nodes: source.nodes || [],
                    connections: source.connections || [],
                    chatSessions: source.chatSessions || [],
                    activeChatId: source.activeChatId || null,
                    backgroundMode: source.backgroundMode || "lines",
                    showImageInfo: source.showImageInfo || false,
                    viewport: source.viewport || initialViewport,
                };
                set((state) => ({ projects: [project, ...state.projects] }));
                return project.id;
            },
            openProject: (id) => {
                return get().projects.find((item) => item.id === id) || null;
            },
            renameProject: (id, title) =>
                set((state) => ({
                    projects: state.projects.map((project) => (project.id === id ? { ...project, title: title.trim() || project.title, updatedAt: new Date().toISOString() } : project)),
                })),
            deleteProjects: (ids) =>
                set((state) => {
                    const projects = state.projects.filter((project) => !ids.includes(project.id));
                    return { projects };
                }),
            replaceProjects: (projects) => set({ projects }),
            updateProject: (id, patch) =>
                set((state) => ({
                    projects: state.projects.map((project) => (project.id === id ? { ...project, ...patch, updatedAt: new Date().toISOString() } : project)),
                })),
        }),
        {
            name: CANVAS_STORE_KEY,
            storage: canvasStorage,
            partialize: (state) =>
                ({
                    projects: state.projects,
                }) as StorageValue<CanvasStore>["state"],
            onRehydrateStorage: () => () => {
                useCanvasStore.setState({ hydrated: true });
            },
        },
    ),
);

async function persistCanvasProjects(name: string, value: StorageValue<CanvasStore>, state: PersistedCanvasState) {
    const projectIds = state.projects.map((project) => project.id);
    await Promise.all(state.projects.map((project) => localForageStorage.setItem(canvasProjectKey(project.id), JSON.stringify(project))));
    const nextProjectIds = new Set(projectIds);
    await Promise.all([...persistedProjectIds].filter((id) => !nextProjectIds.has(id)).map((id) => localForageStorage.removeItem(canvasProjectKey(id))));
    persistedProjectIds = nextProjectIds;
    const index: StorageValue<CanvasStore> = { ...value, state: { version: 2, projectIds } as unknown as StorageValue<CanvasStore>["state"] };
    await localForageStorage.setItem(name, JSON.stringify(index));
}

function canvasProjectKey(id: string) {
    return `${CANVAS_PROJECT_KEY_PREFIX}${id}`;
}

function isCanvasProjectIndex(value: unknown): value is PersistedCanvasIndex {
    return Boolean(value && typeof value === "object" && !Array.isArray(value) && (value as PersistedCanvasIndex).version === 2 && Array.isArray((value as PersistedCanvasIndex).projectIds));
}
