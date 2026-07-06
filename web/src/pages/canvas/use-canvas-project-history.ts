import { useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import type { CanvasBackgroundMode } from "@/lib/canvas-theme";
import type { CanvasAssistantSession, CanvasConnection, CanvasNodeData, ContextMenuState } from "@/types/canvas";

export type CanvasHistoryEntry = {
    nodes: CanvasNodeData[];
    connections: CanvasConnection[];
    chatSessions: CanvasAssistantSession[];
    activeChatId: string | null;
    backgroundMode: CanvasBackgroundMode;
    showImageInfo: boolean;
};

type HistoryState = {
    canUndo: boolean;
    canRedo: boolean;
};

type HistoryContext = {
    history: { past: CanvasHistoryEntry[]; future: CanvasHistoryEntry[] };
    lastHistory: CanvasHistoryEntry | null;
};

type UseCanvasProjectHistoryParams = {
    projectLoaded: boolean;
    nodes: CanvasNodeData[];
    connections: CanvasConnection[];
    chatSessions: CanvasAssistantSession[];
    activeChatId: string | null;
    backgroundMode: CanvasBackgroundMode;
    showImageInfo: boolean;
    nodesRef: MutableRefObject<CanvasNodeData[]>;
    connectionsRef: MutableRefObject<CanvasConnection[]>;
    setNodes: Dispatch<SetStateAction<CanvasNodeData[]>>;
    setConnections: Dispatch<SetStateAction<CanvasConnection[]>>;
    setChatSessions: Dispatch<SetStateAction<CanvasAssistantSession[]>>;
    setActiveChatId: Dispatch<SetStateAction<string | null>>;
    setBackgroundMode: Dispatch<SetStateAction<CanvasBackgroundMode>>;
    setShowImageInfo: Dispatch<SetStateAction<boolean>>;
    setSelectedNodeIds: Dispatch<SetStateAction<Set<string>>>;
    setSelectedConnectionId: Dispatch<SetStateAction<string | null>>;
    setContextMenu: Dispatch<SetStateAction<ContextMenuState | null>>;
};

export function useCanvasProjectHistory({
    projectLoaded,
    nodes,
    connections,
    chatSessions,
    activeChatId,
    backgroundMode,
    showImageInfo,
    nodesRef,
    connectionsRef,
    setNodes,
    setConnections,
    setChatSessions,
    setActiveChatId,
    setBackgroundMode,
    setShowImageInfo,
    setSelectedNodeIds,
    setSelectedConnectionId,
    setContextMenu,
}: UseCanvasProjectHistoryParams) {
    const historyRef = useRef<HistoryContext["history"]>({ past: [], future: [] });
    const lastHistoryRef = useRef<CanvasHistoryEntry | null>(null);
    const historyCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const applyingHistoryRef = useRef(false);
    const historyPausedRef = useRef(false);
    const [historyState, setHistoryState] = useState<HistoryState>({ canUndo: false, canRedo: false });

    const createHistoryEntry = useCallback(
        (): CanvasHistoryEntry => ({
            nodes: nodesRef.current,
            connections: connectionsRef.current,
            chatSessions,
            activeChatId,
            backgroundMode,
            showImageInfo,
        }),
        [activeChatId, backgroundMode, chatSessions, connectionsRef, nodesRef, showImageInfo],
    );

    const resetHistory = useCallback((entry: CanvasHistoryEntry) => {
        historyRef.current = { past: [], future: [] };
        if (historyCommitTimerRef.current) {
            clearTimeout(historyCommitTimerRef.current);
            historyCommitTimerRef.current = null;
        }
        lastHistoryRef.current = entry;
        applyingHistoryRef.current = false;
        historyPausedRef.current = false;
        setHistoryState({ canUndo: false, canRedo: false });
    }, []);

    const getHistoryContext = useCallback(
        (): HistoryContext => ({
            history: historyRef.current,
            lastHistory: lastHistoryRef.current,
        }),
        [],
    );

    useEffect(() => {
        if (!projectLoaded || applyingHistoryRef.current || historyPausedRef.current) return;
        const next = createHistoryEntry();
        const previous = lastHistoryRef.current;
        if (previous?.nodes === next.nodes && previous.connections === next.connections && previous.chatSessions === next.chatSessions && previous.activeChatId === next.activeChatId && previous.backgroundMode === next.backgroundMode && previous.showImageInfo === next.showImageInfo) return;

        if (historyCommitTimerRef.current) clearTimeout(historyCommitTimerRef.current);
        historyCommitTimerRef.current = setTimeout(() => {
            const current = createHistoryEntry();
            const last = lastHistoryRef.current;
            if (!last) return;
            historyRef.current.past = [...historyRef.current.past.slice(-49), last];
            historyRef.current.future = [];
            setHistoryState({ canUndo: true, canRedo: false });
            lastHistoryRef.current = current;
            historyCommitTimerRef.current = null;
        }, 180);

        return () => {
            if (historyCommitTimerRef.current) {
                clearTimeout(historyCommitTimerRef.current);
                historyCommitTimerRef.current = null;
            }
        };
    }, [activeChatId, backgroundMode, chatSessions, connections, createHistoryEntry, nodes, projectLoaded, showImageInfo]);

    const applyHistory = useCallback(
        (entry: CanvasHistoryEntry) => {
            if (historyCommitTimerRef.current) {
                clearTimeout(historyCommitTimerRef.current);
                historyCommitTimerRef.current = null;
            }
            applyingHistoryRef.current = true;
            setNodes(entry.nodes);
            setConnections(entry.connections);
            setChatSessions(entry.chatSessions);
            setActiveChatId(entry.activeChatId);
            setBackgroundMode(entry.backgroundMode);
            setShowImageInfo(entry.showImageInfo);
            setSelectedNodeIds(new Set());
            setSelectedConnectionId(null);
            setContextMenu(null);
            setTimeout(() => {
                lastHistoryRef.current = entry;
                applyingHistoryRef.current = false;
                setHistoryState({ canUndo: historyRef.current.past.length > 0, canRedo: historyRef.current.future.length > 0 });
            });
        },
        [setActiveChatId, setBackgroundMode, setChatSessions, setConnections, setContextMenu, setNodes, setSelectedConnectionId, setSelectedNodeIds, setShowImageInfo],
    );

    const undoCanvas = useCallback(() => {
        const previous = historyRef.current.past.pop();
        const current = lastHistoryRef.current;
        if (!previous || !current) return;
        historyRef.current.future.push(current);
        applyHistory(previous);
    }, [applyHistory]);

    const redoCanvas = useCallback(() => {
        const next = historyRef.current.future.pop();
        const current = lastHistoryRef.current;
        if (!next || !current) return;
        historyRef.current.past.push(current);
        applyHistory(next);
    }, [applyHistory]);

    return {
        historyState,
        historyPausedRef,
        getHistoryContext,
        resetHistory,
        undoCanvas,
        redoCanvas,
    };
}
