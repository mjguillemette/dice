/**
 * Global development state
 * Shared between DevPanel and Scene for debug visualizations
 */

let showDiceTrayBounds = false;

export function getShowDiceTrayBounds(): boolean {
  return showDiceTrayBounds;
}

export function setShowDiceTrayBounds(value: boolean): void {
  showDiceTrayBounds = value;
}
