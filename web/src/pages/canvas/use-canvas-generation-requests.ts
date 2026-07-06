import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";

import type { CanvasNodeData } from "@/types/canvas";

type CanvasGenerationRequest = {
    targetNodeId: string;
    originNodeId: string;
    runningNodeId: string;
    controller: AbortController;
};

type ConfirmModal = {
    confirm: (config: { title: string; content: string; okText: string; cancelText: string; okButtonProps: { danger: boolean }; onOk: () => void }) => unknown;
};

type UseCanvasGenerationRequestsParams = {
    modal: ConfirmModal;
    setNodes: Dispatch<SetStateAction<CanvasNodeData[]>>;
    setRunningNodeId: Dispatch<SetStateAction<string | null>>;
};

export function useCanvasGenerationRequests({ modal, setNodes, setRunningNodeId }: UseCanvasGenerationRequestsParams) {
    const generationRequestsRef = useRef(new Map<string, CanvasGenerationRequest>());

    const startGenerationRequest = useCallback((targetNodeId: string, originNodeId: string, runningId = originNodeId, controller = new AbortController()) => {
        const previous = generationRequestsRef.current.get(targetNodeId);
        if (previous?.controller !== controller) previous?.controller.abort();
        generationRequestsRef.current.set(targetNodeId, { targetNodeId, originNodeId, runningNodeId: runningId, controller });
        return controller;
    }, []);

    const finishGenerationRequest = useCallback((targetNodeId: string, controller: AbortController) => {
        const request = generationRequestsRef.current.get(targetNodeId);
        if (request?.controller === controller) generationRequestsRef.current.delete(targetNodeId);
    }, []);

    const stopGenerationByRunningId = useCallback(
        (runningId: string) => {
            const affectedNodeIds = new Set<string>();
            generationRequestsRef.current.forEach((request) => {
                if (request.runningNodeId !== runningId) return;
                request.controller.abort();
                generationRequestsRef.current.delete(request.targetNodeId);
                affectedNodeIds.add(request.targetNodeId);
                affectedNodeIds.add(request.originNodeId);
            });
            setRunningNodeId((current) => (current === runningId ? null : current));
            if (!affectedNodeIds.size) return;
            setNodes((prev) =>
                prev.map((node) =>
                    affectedNodeIds.has(node.id) && node.metadata?.status === "loading"
                        ? { ...node, metadata: { ...node.metadata, status: "idle" as const, errorDetails: undefined } }
                        : node,
                ),
            );
        },
        [setNodes, setRunningNodeId],
    );

    const confirmStopGeneration = useCallback(
        (nodeId: string) => {
            modal.confirm({
                title: "停止生成？",
                content: "当前生成请求会被中断，已经生成完成的内容会保留。",
                okText: "停止",
                cancelText: "继续生成",
                okButtonProps: { danger: true },
                onOk: () => stopGenerationByRunningId(nodeId),
            });
        },
        [modal, stopGenerationByRunningId],
    );

    return {
        startGenerationRequest,
        finishGenerationRequest,
        stopGenerationByRunningId,
        confirmStopGeneration,
    };
}
