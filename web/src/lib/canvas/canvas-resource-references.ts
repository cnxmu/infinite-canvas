import { imageReferenceLabel } from "@/lib/image-reference-prompt";
import { seedanceReferenceLabel } from "@/lib/seedance-video";
import { CanvasNodeType, type CanvasConnection, type CanvasNodeData } from "@/types/canvas";

export type CanvasResourceKind = "image" | "video" | "audio" | "text";

export type CanvasResourceReference = {
    id: string;
    nodeId: string;
    kind: CanvasResourceKind;
    label: string;
    title: string;
    previewUrl?: string;
    text?: string;
    active: boolean;
};

export type CanvasResourceIndex = ReturnType<typeof createCanvasResourceIndex>;

export function createCanvasResourceIndex(nodes: CanvasNodeData[], connections: CanvasConnection[]) {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const incomingById = new Map<string, CanvasNodeData[]>();
    const configTargetById = new Map<string, string>();
    connections.forEach((connection) => {
        const source = nodeById.get(connection.fromNodeId);
        const target = nodeById.get(connection.toNodeId);
        if (source && target) {
            const incoming = incomingById.get(target.id);
            if (incoming) incoming.push(source);
            else incomingById.set(target.id, [source]);
        }
        if (target?.type === CanvasNodeType.Config && !configTargetById.has(connection.fromNodeId)) configTargetById.set(connection.fromNodeId, target.id);
    });
    return { nodeById, incomingById, configTargetById };
}

export function buildCanvasResourceReferences(nodes: CanvasNodeData[], connections: CanvasConnection[], contextNodeId?: string | null, index = createCanvasResourceIndex(nodes, connections)) {
    const contextNodes = contextNodeId ? getMentionResourceNodes(contextNodeId, nodes, connections, index) : [];
    const globalReferences = labelResourceNodes(nodes.filter(isResourceNode), false);
    const activeByNodeId = new Map(labelResourceNodes(contextNodes, true).map((reference) => [reference.nodeId, reference]));
    return globalReferences.map((reference) => activeByNodeId.get(reference.nodeId) || reference);
}

export function buildNodeMentionReferences(node: CanvasNodeData, nodes: CanvasNodeData[], connections: CanvasConnection[], index = createCanvasResourceIndex(nodes, connections)) {
    return labelResourceNodes(getMentionResourceNodes(node.id, nodes, connections, index), true);
}

export function getMentionResourceNodes(nodeId: string, nodes: CanvasNodeData[], connections: CanvasConnection[], index = createCanvasResourceIndex(nodes, connections)) {
    const configInputs = getConnectedConfigResourceNodes(nodeId, index);
    if (configInputs.length) return configInputs;
    const ownInputs = getContextResourceNodes(nodeId, index);
    if (ownInputs.length) return ownInputs;
    const node = index.nodeById.get(nodeId);
    return node && isResourceNode(node) ? [node] : [];
}

export function getGenerationResourceNodes(nodeId: string, nodes: CanvasNodeData[], connections: CanvasConnection[], index = createCanvasResourceIndex(nodes, connections)) {
    const configInputs = getConnectedConfigResourceNodes(nodeId, index);
    if (configInputs.length) return configInputs;
    const ownInputs = getContextResourceNodes(nodeId, index);
    if (ownInputs.length) return ownInputs;
    return [];
}

function getContextResourceNodes(nodeId: string, index: CanvasResourceIndex) {
    return (index.incomingById.get(nodeId) || []).filter(isResourceNode);
}

function getConnectedConfigResourceNodes(nodeId: string, index: CanvasResourceIndex) {
    const configTargetId = index.configTargetById.get(nodeId);
    if (!configTargetId) return [];
    return getContextResourceNodes(configTargetId, index).filter((node) => node.id !== nodeId);
}

function labelResourceNodes(nodes: CanvasNodeData[], active: boolean) {
    const counts: Record<CanvasResourceKind, number> = { image: 0, video: 0, audio: 0, text: 0 };
    return nodes.flatMap((node): CanvasResourceReference[] => {
        const kind = resourceKind(node);
        if (!kind) return [];
        const index = counts[kind]++;
        const label = labelForKind(kind, index);
        return [
            {
                id: node.id,
                nodeId: node.id,
                kind,
                label,
                title: node.title || label,
                previewUrl: node.metadata?.content,
                text: node.type === CanvasNodeType.Text ? node.metadata?.content || node.metadata?.prompt : undefined,
                active,
            },
        ];
    });
}

function labelForKind(kind: CanvasResourceKind, index: number) {
    if (kind === "image") return imageReferenceLabel(index);
    if (kind === "video") return seedanceReferenceLabel("video", index);
    if (kind === "audio") return seedanceReferenceLabel("audio", index);
    return `文本${index + 1}`;
}

function isResourceNode(node: CanvasNodeData) {
    return Boolean(resourceKind(node));
}

function resourceKind(node: CanvasNodeData): CanvasResourceKind | null {
    if (node.type === CanvasNodeType.Image && node.metadata?.content) return "image";
    if (node.type === CanvasNodeType.Video && node.metadata?.content) return "video";
    if (node.type === CanvasNodeType.Audio && node.metadata?.content) return "audio";
    if (node.type === CanvasNodeType.Text && (node.metadata?.content || node.metadata?.prompt)) return "text";
    return null;
}
