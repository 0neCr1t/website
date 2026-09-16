// Client behaviour for NetworkDiagram components: animejs entry animation and
// node-hover edge lighting. Targets every `svg[data-nn-diagram]` on the page.

import { animate } from "animejs";

const LIT_CLASSES = ["nn-edge-lit", "nn-lit-input", "nn-lit-hidden", "nn-lit-output"];

// Stagger: columns light up left to right, nodes within a column top to bottom.
const colRowDelay = (target: unknown): number => {
    const g = target as SVGGElement;
    return Number(g.dataset.col ?? 0) * 110 + Number(g.dataset.row ?? 0) * 28;
};

function initHover(svg: SVGSVGElement): void {
    let lit: Element[] = [];

    const clear = () => {
        lit.forEach(path => path.classList.remove(...LIT_CLASSES));
        lit = [];
        svg.classList.remove("nn-hovering");
    };

    svg.addEventListener("pointerover", event => {
        const node = (event.target as Element).closest("[data-node]");
        if (!node) return;
        clear();
        const key = node.getAttribute("data-node")!;
        const role = node.getAttribute("data-role")!;
        lit = [...svg.querySelectorAll(`[data-from="${CSS.escape(key)}"], [data-to="${CSS.escape(key)}"]`)];
        lit.forEach(path => path.classList.add("nn-edge-lit", `nn-lit-${role}`));
        if (lit.length) svg.classList.add("nn-hovering");
    });

    svg.addEventListener("pointerout", event => {
        const node = (event.target as Element).closest("[data-node]");
        if (!node || (event.relatedTarget && node.contains(event.relatedTarget as Node))) return;
        clear();
    });
}

function playEntry(svg: SVGSVGElement): void {
    const nodes = svg.querySelectorAll<SVGGElement>(".nn-node");
    const edges = svg.querySelector<SVGGElement>(".nn-edges");
    const annotations = svg.querySelectorAll<SVGGElement>(".nn-annotation");

    animate(nodes, {
        opacity: [0, 1],
        scale: [0.3, 1],
        duration: 450,
        ease: "outQuint",
        delay: colRowDelay,
        onComplete: () => {
            // Hand transforms back to the stylesheet so the :hover scale works.
            nodes.forEach(node => node.style.removeProperty("transform"));
            svg.classList.add("nn-ready");
        },
    });
    if (edges) animate(edges, { opacity: [0, 1], duration: 900, delay: 150, ease: "outQuad" });
    if (annotations.length) {
        animate(annotations, {
            opacity: [0, 1],
            duration: 500,
            ease: "outQuad",
            delay: (target: unknown) => colRowDelay(target) + 250,
        });
    }
}

export function initNetworkDiagrams(): void {
    const svgs = document.querySelectorAll<SVGSVGElement>("svg[data-nn-diagram]");
    if (svgs.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    svgs.forEach(svg => {
        initHover(svg);
        if (reduceMotion) {
            svg.classList.add("nn-ready");
        } else {
            playEntry(svg);
        }
    });
}
