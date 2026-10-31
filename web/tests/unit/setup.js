import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});
