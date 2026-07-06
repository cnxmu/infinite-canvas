import type { CanvasNodeData, SelectionBox } from "@/types/canvas";

export type DragNodePosition = { id: string; x: number; y: number };

export function nextNodeSelection(currentSelected: Set<string>, nodeId: string, additive: boolean) {
    const nextSelected = new Set(currentSelected);
    if (additive) {
        if (nextSelected.has(nodeId)) nextSelected.delete(nodeId);
        else nextSelected.add(nodeId);
    } else if (!nextSelected.has(nodeId)) {
        nextSelected.clear();
        nextSelected.add(nodeId);
    }
    return nextSelected;
}

export function dragInitialPositions(nodes: CanvasNodeData[], selectedNodeIds: Set<string>) {
    const dragIds = new Set(selectedNodeIds);
    nodes.forEach((node) => {
        if (selectedNodeIds.has(node.id)) node.metadata?.batchChildIds?.forEach((childId) => dragIds.add(childId));
    });
    return nodes.filter((node) => dragIds.has(node.id)).map((node) => ({ id: node.id, x: node.position.x, y: node.position.y }));
}

export function moveNodesByDrag(nodes: CanvasNodeData[], initialPositions: DragNodePosition[], dx: number, dy: number) {
    return nodes.map((node) => {
        const initial = initialPositions.find((item) => item.id === node.id);
        return initial ? { ...node, position: { x: initial.x + dx, y: initial.y + dy } } : node;
    });
}

export function selectedNodesInBox(nodes: CanvasNodeData[], allNodes: CanvasNodeData[], selection: SelectionBox, isHidden: (node: CanvasNodeData, nodes: CanvasNodeData[]) => boolean) {
    const rectX = Math.min(selection.startWorldX, selection.currentWorldX);
    const rectY = Math.min(selection.startWorldY, selection.currentWorldY);
    const rectW = Math.abs(selection.currentWorldX - selection.startWorldX);
    const rectH = Math.abs(selection.currentWorldY - selection.startWorldY);
    const nextSelected = new Set<string>(selection.additive ? selection.initialSelectedNodeIds : []);
    nodes.filter((node) => !isHidden(node, allNodes)).forEach((node) => {
        const intersects = rectX < node.position.x + node.width && rectX + rectW > node.position.x && rectY < node.position.y + node.height && rectY + rectH > node.position.y;
        if (intersects) nextSelected.add(node.id);
    });
    return nextSelected;
}
