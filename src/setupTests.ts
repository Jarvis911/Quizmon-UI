import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock ResizeObserver
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

window.ResizeObserver = ResizeObserver;

// Mock PointerEvent
if (!window.PointerEvent) {
    // @ts-ignore
    window.PointerEvent = class PointerEvent extends MouseEvent {
        constructor(type: string, props: any) {
            super(type, props);
        }
    };
}

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

