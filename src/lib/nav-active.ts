/**
 * True when the current route is this nav item or a nested subpage of it.
 * e.g. `/instant` stays active on `/instant/custom` and legacy kit routes.
 */
export function isNavPathActive(pathname: string, path: string): boolean {
  if (!path) return false;
  if (pathname === path) return true;
  return pathname.startsWith(`${path}/`);
}
