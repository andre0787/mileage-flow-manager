import { beforeEach, describe, expect, it } from "vitest";
import { shouldIgnoreShortcutTarget } from "@/hooks/useKeyboardShortcuts";

describe("shouldIgnoreShortcutTarget", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("ignora campos contenteditable", () => {
    const editor = document.createElement("div");
    editor.setAttribute("contenteditable", "true");
    document.body.appendChild(editor);

    expect(shouldIgnoreShortcutTarget(editor)).toBe(true);
  });

  it("ignora alvos dentro de dialogs", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-state", "open");
    const target = document.createElement("button");
    dialog.appendChild(target);
    document.body.appendChild(dialog);

    expect(shouldIgnoreShortcutTarget(target)).toBe(true);
  });

  it("ignora atalhos quando há um dialog Radix aberto", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-state", "open");
    document.body.appendChild(dialog);

    expect(shouldIgnoreShortcutTarget(document.body)).toBe(true);
  });

  it("ignora triggers Radix", () => {
    const trigger = document.createElement("button");
    trigger.setAttribute("aria-haspopup", "dialog");
    document.body.appendChild(trigger);

    expect(shouldIgnoreShortcutTarget(trigger)).toBe(true);
  });
});
