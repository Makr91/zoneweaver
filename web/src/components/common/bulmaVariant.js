/**
 * Bulma → Bootstrap variant bridge (transition-only; remove once every caller passes a
 * Bootstrap variant directly). The shared modals keep their existing `submitVariant` /
 * `confirmVariant` prop API — callers still pass Bulma strings like `is-primary` — so this
 * maps `is-<name>` to the matching Bootstrap button variant (`<name>`).
 */
export const toBsVariant = (variant, fallback = "primary") => {
  if (!variant) {
    return fallback;
  }
  return variant.replace(/^is-/, "") || fallback;
};
