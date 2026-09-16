// Framework-agnostic layout engine for the NetworkDiagram component family.
// Takes a declarative layer/connection config and returns absolute SVG coordinates,
// so the .astro components stay purely presentational.

export type LayerRole = "input" | "hidden" | "output";

export interface NetworkLayerConfig {
    /** Unique id, referenced by connections. */
    id: string;
    /** Layer name rendered under the column. */
    label: string;
    /** Secondary line under the label (dimensions, activation...). */
    sublabel?: string;
    /** Defaults to "hidden". Input/output layers get their own color and IO arrows. */
    role?: LayerRole;
    /** Real neuron count. Collapsed with an ellipsis when above maxVisibleNodes. */
    nodes: number;
    /** Per-layer override of the collapse threshold. */
    maxVisibleNodes?: number;
    /** Text next to each node (feature names on inputs, heads on outputs). */
    nodeLabels?: string[];
    /**
     * Horizontal slot. Defaults to the layer's index in the array; give two layers
     * the same column to stack them vertically (e.g. parallel heads).
     */
    column?: number;
}

export interface NetworkConnection {
    from: string;
    to: string;
}

export interface DiagramOptions {
    /** Node circle radius. */
    nodeRadius: number;
    /** Vertical distance between node centers within a layer. */
    nodeGap: number;
    /** Horizontal distance between column centers. */
    columnGap: number;
    /** Vertical gap between layers stacked in the same column. */
    layerGap: number;
    /** Default collapse threshold (odd numbers center the ellipsis nicely). */
    maxVisibleNodes: number;
    /** Outer padding of the drawing. */
    padding: number;
    /** Length of the input/output annotation arrows. */
    ioArrowLength: number;
}

export interface PositionedNode {
    cx: number;
    cy: number;
    /** True for the collapse marker slot (rendered as vertical dots). */
    ellipsis: boolean;
    label?: string;
}

export interface PositionedLayer {
    id: string;
    role: LayerRole;
    label: string;
    sublabel?: string;
    totalNodes: number;
    collapsed: boolean;
    x: number;
    /** 0-based horizontal slot, used to stagger entry animations. */
    columnRank: number;
    nodes: PositionedNode[];
    labelX: number;
    labelY: number;
}

export interface PositionedEdge {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    /** Endpoint keys ("layerId:rowIndex"), used to highlight edges on node hover. */
    fromNode: string;
    toNode: string;
}

export interface DiagramLayout {
    width: number;
    height: number;
    nodeRadius: number;
    ioArrowLength: number;
    layers: PositionedLayer[];
    edges: PositionedEdge[];
}

const DEFAULT_OPTIONS: DiagramOptions = {
    nodeRadius: 9,
    nodeGap: 30,
    columnGap: 200,
    layerGap: 64,
    maxVisibleNodes: 9,
    padding: 28,
    ioArrowLength: 16,
};

// Rough glyph width of the 11px node-label font; only used to reserve margin space.
const LABEL_CHAR_WIDTH = 6.4;
const LABEL_BLOCK_HEIGHT = 34;
const SUBLABEL_HEIGHT = 18;

interface NodeSlot {
    ellipsis: boolean;
    label?: string;
}

function nodeSlots(config: NetworkLayerConfig, fallbackMax: number): NodeSlot[] {
    const max = Math.max(3, config.maxVisibleNodes ?? fallbackMax);
    if (config.nodes <= max) {
        return Array.from({ length: config.nodes }, (_, i) => ({ ellipsis: false, label: config.nodeLabels?.[i] }));
    }
    // Show the first/last real nodes with a single ellipsis slot in between.
    const shown = max - 1;
    const top = Math.ceil(shown / 2);
    const bottom = shown - top;
    const slots: NodeSlot[] = [];
    for (let i = 0; i < top; i++) slots.push({ ellipsis: false, label: config.nodeLabels?.[i] });
    slots.push({ ellipsis: true });
    for (let i = config.nodes - bottom; i < config.nodes; i++) {
        slots.push({ ellipsis: false, label: config.nodeLabels?.[i] });
    }
    return slots;
}

function round(n: number): number {
    return Math.round(n * 10) / 10;
}

/** Widest node label of the layers matching `role`, in estimated px. */
function maxIoLabelWidth(layers: NetworkLayerConfig[], role: LayerRole): number {
    const lengths = layers
        .filter(l => (l.role ?? "hidden") === role)
        .flatMap(l => l.nodeLabels ?? [])
        .map(text => text.length * LABEL_CHAR_WIDTH);
    return lengths.length ? Math.max(...lengths) : 0;
}

/** Every layer of column N feeds every layer of column N+1. */
function defaultConnections(layers: NetworkLayerConfig[], columnOf: Map<string, number>): NetworkConnection[] {
    const ranks = [...new Set(columnOf.values())].sort((a, b) => a - b);
    const connections: NetworkConnection[] = [];
    for (let i = 0; i < ranks.length - 1; i++) {
        const fromLayers = layers.filter(l => columnOf.get(l.id) === ranks[i]);
        const toLayers = layers.filter(l => columnOf.get(l.id) === ranks[i + 1]);
        for (const from of fromLayers) for (const to of toLayers) connections.push({ from: from.id, to: to.id });
    }
    return connections;
}

export function computeDiagramLayout(
    layers: NetworkLayerConfig[],
    connections?: NetworkConnection[],
    options?: Partial<DiagramOptions>,
): DiagramLayout {
    if (layers.length === 0) throw new Error("NetworkDiagram needs at least one layer");
    const opts: DiagramOptions = { ...DEFAULT_OPTIONS, ...options };

    const ids = new Set(layers.map(l => l.id));
    if (ids.size !== layers.length) throw new Error("NetworkDiagram layer ids must be unique");

    const columnOf = new Map(layers.map((l, i) => [l.id, l.column ?? i]));
    const columnRanks = [...new Set(columnOf.values())].sort((a, b) => a - b);
    const rankOf = new Map(columnRanks.map((col, rank) => [col, rank]));

    // Side margins for IO arrows + labels (inputs annotate left, outputs right).
    const arrowSpan = opts.nodeRadius + opts.ioArrowLength + 16;
    const inputLabelWidth = maxIoLabelWidth(layers, "input");
    const outputLabelWidth = maxIoLabelWidth(layers, "output");
    const leftExtra = inputLabelWidth ? inputLabelWidth + arrowSpan : 0;
    const rightExtra = outputLabelWidth ? outputLabelWidth + arrowSpan : 0;

    // Vertical extent per column: stacked layer blocks + gaps between them.
    const slotsOf = new Map(layers.map(l => [l.id, nodeSlots(l, opts.maxVisibleNodes)]));
    const blockHeight = (layer: NetworkLayerConfig): number => {
        const span = (slotsOf.get(layer.id)!.length - 1) * opts.nodeGap;
        return span + LABEL_BLOCK_HEIGHT + (layer.sublabel ? SUBLABEL_HEIGHT : 0);
    };
    const columnHeight = (col: number): number => {
        const stacked = layers.filter(l => columnOf.get(l.id) === col);
        return stacked.reduce((sum, l) => sum + blockHeight(l), 0) + opts.layerGap * (stacked.length - 1);
    };
    const innerHeight = Math.max(...columnRanks.map(columnHeight));

    const positioned = new Map<string, PositionedLayer>();
    for (const col of columnRanks) {
        const x = opts.padding + leftExtra + rankOf.get(col)! * opts.columnGap;
        let cursor = opts.padding + (innerHeight - columnHeight(col)) / 2;
        for (const layer of layers.filter(l => columnOf.get(l.id) === col)) {
            const slots = slotsOf.get(layer.id)!;
            const nodes: PositionedNode[] = slots.map((slot, i) => ({
                cx: round(x),
                cy: round(cursor + i * opts.nodeGap),
                ellipsis: slot.ellipsis,
                label: slot.label,
            }));
            const nodesSpan = (slots.length - 1) * opts.nodeGap;
            positioned.set(layer.id, {
                id: layer.id,
                role: layer.role ?? "hidden",
                label: layer.label,
                sublabel: layer.sublabel,
                totalNodes: layer.nodes,
                collapsed: layer.nodes > slots.length,
                x: round(x),
                columnRank: rankOf.get(col)!,
                nodes,
                labelX: round(x),
                labelY: round(cursor + nodesSpan + LABEL_BLOCK_HEIGHT),
            });
            cursor += blockHeight(layer) + opts.layerGap;
        }
    }

    const resolved = connections ?? defaultConnections(layers, columnOf);
    const edges: PositionedEdge[] = [];
    for (const { from, to } of resolved) {
        const source = positioned.get(from);
        const target = positioned.get(to);
        if (!source || !target)
            throw new Error(`NetworkDiagram connection references unknown layer "${!source ? from : to}"`);
        source.nodes.forEach((a, ai) => {
            if (a.ellipsis) return;
            target.nodes.forEach((b, bi) => {
                if (b.ellipsis) return;
                edges.push({
                    x1: round(a.cx + opts.nodeRadius),
                    y1: a.cy,
                    x2: round(b.cx - opts.nodeRadius),
                    y2: b.cy,
                    fromNode: `${from}:${ai}`,
                    toNode: `${to}:${bi}`,
                });
            });
        });
    }

    return {
        width: round(opts.padding * 2 + leftExtra + rightExtra + (columnRanks.length - 1) * opts.columnGap),
        height: round(innerHeight + opts.padding * 2),
        nodeRadius: opts.nodeRadius,
        ioArrowLength: opts.ioArrowLength,
        layers: layers.map(l => positioned.get(l.id)!),
        edges,
    };
}
