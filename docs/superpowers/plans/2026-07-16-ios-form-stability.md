# iOS Form Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize mobile form drawers on iPhone so focused fields stay visible while typing.

**Architecture:** Fix the shared `FormDrawer`/drawer layout instead of patching each form. Mobile forms use one stable scroll container; child forms stop creating nested vertical scroll. CSS focus margin becomes fixed and modest.

**Tech Stack:** React 18, Vite, Tailwind, shadcn/ui, Vaul, Playwright.

## Global Constraints

- No frontend stack migration.
- No new dependency.
- Desktop dialog behavior must remain unchanged.
- Interface text stays pt-BR.
- Keep the diff focused on form stability only.

---

## File Structure

- Modify `src/components/ui/drawer.tsx`: make drawer root defaults safe for form usage (`shouldScaleBackground=false`) and allow stable content classes.
- Modify `src/components/FormDrawer.tsx`: mobile drawer becomes stable full-height panel with a single scroll area.
- Modify `src/components/EntryForm.tsx`: remove nested `max-h`/`overflow-y-auto` from form wrappers inside `FormDrawer`.
- Modify `src/components/SaleForm.tsx`: same nested scroll removal.
- Modify `src/components/TransferForm.tsx`: same nested scroll removal.
- Modify `src/index.css`: reduce global field `scroll-margin-bottom`.
- Add/modify Playwright test: mobile drawer stays visible after focusing a low numeric input.

---

### Task 1: Add mobile drawer stability test

**Files:**
- Modify: `tests/entradas.spec.ts`

**Interfaces:**
- Consumes: existing Playwright auth/data setup in `tests/entradas.spec.ts`.
- Produces: regression check for mobile drawer visibility.

- [ ] **Step 1: Add viewport and visibility assertion inside the existing entradas flow after the edit drawer opens**

```ts
await page.setViewportSize({ width: 375, height: 667 });
await expect(page.locator("[role='dialog']").first()).toBeVisible();
await page.locator("#amountPaid").scrollIntoViewIfNeeded();
await page.fill("#amountPaid", "5000.00");
await expect(page.locator("[role='dialog']").first()).toBeInViewport();
```

- [ ] **Step 2: Run the focused test**

Run: `npm run test:e2e -- tests/entradas.spec.ts`
Expected: existing flow passes; before layout fix this can reproduce drawer visibility issues in mobile viewport.

---

### Task 2: Make FormDrawer the only mobile scroll container

**Files:**
- Modify: `src/components/FormDrawer.tsx`
- Modify: `src/components/ui/drawer.tsx`

**Interfaces:**
- Consumes: `FormDrawer` props unchanged.
- Produces: same component API with stable mobile layout.

- [ ] **Step 1: Change Vaul default to no background scaling**

In `src/components/ui/drawer.tsx`, set:

```tsx
shouldScaleBackground = false,
```

- [ ] **Step 2: Update mobile `FormDrawer` content classes**

Use one scroll area:

```tsx
<Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
  <DrawerContent className="top-0 mt-0 h-[100svh] max-h-[100dvh] rounded-t-none">
    <DrawerHeader className="shrink-0 text-left">
      <DrawerTitle>{title}</DrawerTitle>
      {description && <DrawerDescription>{description}</DrawerDescription>}
    </DrawerHeader>
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-safe overscroll-contain">
      {children}
    </div>
  </DrawerContent>
</Drawer>
```

- [ ] **Step 3: Run type/build check**

Run: `npm run build`
Expected: build passes. If `repositionInputs` is not accepted by current Vaul types, remove only that prop and keep the CSS fix.

---

### Task 3: Remove nested scroll from form bodies

**Files:**
- Modify: `src/components/EntryForm.tsx`
- Modify: `src/components/SaleForm.tsx`
- Modify: `src/components/TransferForm.tsx`

**Interfaces:**
- Consumes: stable scroll area from `FormDrawer`.
- Produces: form content wrappers without vertical scroll containers.

- [ ] **Step 1: Replace root form wrappers**

Replace:

```tsx
<div className="grid gap-4 py-4 max-h-[70dvh] sm:max-h-[60dvh] overflow-y-auto">
```

with:

```tsx
<div className="grid gap-4 py-4">
```

- [ ] **Step 2: Replace SaleForm wrapper**

Replace:

```tsx
<div className="grid gap-4 py-4 max-h-[70dvh] overflow-y-auto">
```

with:

```tsx
<div className="grid gap-4 py-4">
```

- [ ] **Step 3: Keep nested mini-form drawers usable**

For the nested new origem type form in `EntryForm.tsx`, also use:

```tsx
<div className="grid gap-4 py-4">
```

- [ ] **Step 4: Run search check**

Run: `rg -n "max-h-\[70dvh\]|sm:max-h-\[60dvh\].*overflow-y-auto|overflow-y-auto" src/components/{EntryForm.tsx,SaleForm.tsx,TransferForm.tsx}`
Expected: no form-body scroll wrappers remain except unrelated intentional scrolls.

---

### Task 4: Reduce global focus scroll jump

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Consumes: browser native focus scrolling.
- Produces: modest field margin that avoids bottom tab/keyboard overpush.

- [ ] **Step 1: Replace aggressive dynamic margin**

Replace:

```css
scroll-margin-bottom: 40dvh;
```

with:

```css
scroll-margin-bottom: 6rem;
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: build passes.

---

### Task 5: Validate and commit implementation

**Files:**
- All modified files.

**Interfaces:**
- Produces: PR-ready branch.

- [ ] **Step 1: Run focused checks**

Run:

```bash
npm run build
npm run test:e2e -- tests/entradas.spec.ts
```

Expected: both pass.

- [ ] **Step 2: Run full pre-pr**

Run: `npm run pre-pr`
Expected: 0 errors and report present.

- [ ] **Step 3: Commit**

Run:

```bash
git add src tests docs
 git commit -m "fix: estabiliza formularios no ios"
```

Expected: commit created on `feat/ios-form-stability`.
