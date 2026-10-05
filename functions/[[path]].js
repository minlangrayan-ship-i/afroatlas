import { handleAdminRequest } from '../server/access-admin.mjs';
import { panelHTML, basePath } from '../server/generated/admin-panel.mjs';

export function onRequest(context) {
  return handleAdminRequest(context, { panelHTML, basePath });
}
