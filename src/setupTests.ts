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

// Global Axios Mock to prevent apiClient initialization errors
vi.mock("axios", () => {
    const mockAxios = {
        create: vi.fn().mockReturnThis(),
        interceptors: {
            request: { use: vi.fn(), eject: vi.fn() },
            response: { use: vi.fn(), eject: vi.fn() },
        },
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
        defaults: { headers: { common: {} } },
    };
    return {
        default: mockAxios,
    };
});

