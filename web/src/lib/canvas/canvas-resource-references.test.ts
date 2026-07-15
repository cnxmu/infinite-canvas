import { describe, expect, it } from "vitest";

import { createCanvasResourceIndex, getGenerationResourceNodes } from "@/lib/canvas/canvas-resource-references";
import { CanvasNodeType, type CanvasConnection, type CanvasNodeData } from "@/types/canvas";

const node = (id: string, type: CanvasNodeType, content?: string): CanvasNodeData => ({ id, type, title: id, position: { x: 0, y: 0 }, width: 100, height: 100, metadata: content ? { content } : {} });

describe("画布资源索引", () => {
    it("复用入边索引读取配置节点的资源", () => {
        const nodes = [node("image", CanvasNodeType.Image, "blob:image"), node("text", CanvasNodeType.Text, "prompt"), node("config", CanvasNodeType.Config)];
        const connections: CanvasConnection[] = [
            { id: "1", fromNodeId: "image", toNodeId: "config" },
            { id: "2", fromNodeId: "text", toNodeId: "config" },
        ];
        const index = createCanvasResourceIndex(nodes, connections);
        expect(getGenerationResourceNodes("config", nodes, connections, index).map((item) => item.id)).toEqual(["image", "text"]);
        expect(getGenerationResourceNodes("image", nodes, connections, index).map((item) => item.id)).toEqual(["text"]);
    });
});
