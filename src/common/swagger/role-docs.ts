import type { OpenAPIObject } from '@nestjs/swagger';
import { ROLE_PERMISSIONS } from '../roles/matrix';
import type { Action, AppRole, Module, Permission } from '../roles/types';

export const SWAGGER_ROLES: AppRole[] = [
  'system_admin',
  'hr',
  'finance_manager',
  'manager',
  'employee',
];

const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace',
] as const;

type HttpMethod = (typeof HTTP_METHODS)[number];

function permissionSet(role: AppRole): Set<string> {
  const grants: Permission[] = ROLE_PERMISSIONS[role] ?? [];
  return new Set(grants.map((p) => `${p.module}:${p.action}`));
}

function operationAllowed(
  op: Record<string, unknown> | undefined,
  allowed: Set<string>,
): boolean {
  if (!op || typeof op !== 'object') return false;
  if (op['x-public'] === true) return true;

  const req = op['x-required-permission'] as
    | { module?: Module; action?: Action }
    | undefined;
  if (req?.module && req?.action) {
    return allowed.has(`${req.module}:${req.action}`);
  }

  // Authenticated helpers without @RequirePermission (e.g. /auth/me, /auth/logout)
  return true;
}

function roleBlurb(role: AppRole): string {
  switch (role) {
    case 'system_admin':
      return 'Full platform merge (employee + manager + finance + HR + users/roles).';
    case 'hr':
      return 'Company HR operations including payroll prep, workplace, compliance, finance, and AP. No users/roles admin.';
    case 'finance_manager':
      return 'Company finance and accounts payable with payroll/payslip visibility. Not company HR admin.';
    case 'manager':
      return 'Team lead: approvals, roster, probation, team calendar/reports. No finance or AP.';
    case 'employee':
      return 'Self-service at own scope (profile, time, leave, payslip, workplace participation).';
    default:
      return '';
  }
}

/** Build OpenAPI document containing only operations this role can call (plus public routes). */
export function filterDocumentForRole(
  source: OpenAPIObject,
  role: AppRole,
): OpenAPIObject {
  const allowed = permissionSet(role);
  const paths: OpenAPIObject['paths'] = {};
  const usedTags = new Set<string>();

  for (const [path, item] of Object.entries(source.paths ?? {})) {
    if (!item) continue;
    const next: Record<string, unknown> = { ...item };
    let kept = false;

    for (const method of HTTP_METHODS) {
      const op = item[method as HttpMethod] as Record<string, unknown> | undefined;
      if (!op) continue;
      if (operationAllowed(op, allowed)) {
        kept = true;
        for (const tag of (op.tags as string[] | undefined) ?? []) {
          usedTags.add(tag);
        }
      } else {
        delete next[method];
      }
    }

    const hasMethod = HTTP_METHODS.some((m) => Boolean(next[m]));
    if (kept && hasMethod) {
      paths[path] = next as OpenAPIObject['paths'][string];
    }
  }

  const tags = (source.tags ?? []).filter((t) => usedTags.has(t.name));

  const roleLinks = SWAGGER_ROLES.map(
    (r) =>
      `- [\`${r}\`](/api/docs/${r})${r === role ? ' ← **this view**' : ''}`,
  ).join('\n');

  const description = `
# Role view: \`${role}\`

${roleBlurb(role)}

This Swagger UI lists **only** operations that \`ROLE_PERMISSIONS['${role}']\` can satisfy (plus public routes). It does **not** replace JWT guards — use a matching demo user when trying endpoints.

**All roles**

${roleLinks}

- [Full API (all roles)](/api/docs)
- [This role OpenAPI JSON](/api/docs/${role}-json)

Scopes on grants: \`own\`, \`team\`, \`department\`, \`company\` (wider includes narrower).
`.trim();

  return {
    ...source,
    info: {
      ...source.info,
      title: `PSC HRM API — ${role}`,
      description,
    },
    paths,
    tags,
  };
}

export function roleDocsIndexMarkdown(): string {
  const rows = SWAGGER_ROLES.map(
    (r) => `| \`${r}\` | [/api/docs/${r}](/api/docs/${r}) | [/api/docs/${r}-json](/api/docs/${r}-json) |`,
  ).join('\n');
  return `
## Role-filtered docs

Each link shows only endpoints that role can call (from \`ROLE_PERMISSIONS\`).

| Role | Swagger UI | OpenAPI JSON |
| --- | --- | --- |
${rows}
| *(all)* | [/api/docs](/api/docs) | [/api/docs-json](/api/docs-json) |
`.trim();
}
