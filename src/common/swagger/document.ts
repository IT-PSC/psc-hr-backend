import { DocumentBuilder, type OpenAPIObject } from '@nestjs/swagger';
import { roleDocsIndexMarkdown } from './role-docs';
import { SWAGGER_TAGS } from './tags';

const DESCRIPTION = `
REST API for the PSC HRM application. Interactive docs: \`/api/docs\`. Machine-readable spec: [\`/api/docs-json\`](/api/docs-json).

${roleDocsIndexMarkdown()}

## Base path

Every route is served under **\`/api\`**. Example: \`POST /api/auth/login\`.

## Authentication

Protected routes expect **JWT Bearer** auth.

1. Call \`POST /api/auth/login\` with a demo user.
2. If the response has \`requires2FA: true\`, call \`POST /api/auth/2fa/verify\` with \`challengeToken\` and code \`123456\`.
3. Click **Authorize** and paste the \`accessToken\` only (no \`Bearer \` prefix; Swagger adds the scheme).
4. \`POST /api/auth/refresh\` rotates the refresh token. \`POST /api/auth/logout\` revokes a refresh token or, if the body is omitted, every refresh token for the current user.

\`manager\` and \`employee\` receive tokens directly from login. \`system_admin\`, \`hr\`, and \`finance_manager\` must complete 2FA unless a still-valid trusted-device token is sent. The demo OTP is \`123456\`.

Authorization is stored in the browser when **persist authorization** is on.

## Demo users

Local seed only. The same password is in \`prisma/seed.ts\`.

| Email | Roles | 2FA |
| --- | --- | --- |
| \`admin@psc.local\` | \`system_admin\`, \`employee\` | yes |
| \`hr@psc.local\` | \`hr\`, \`employee\` | yes |
| \`finance@psc.local\` | \`finance_manager\`, \`employee\` | yes |
| \`manager@psc.local\` | \`manager\`, \`employee\` | no |
| \`employee@psc.local\` | \`employee\` | no |

Password: \`Password123!\`

## Roles

Only these **AppRole** values exist. There is no Super Admin, HR Staff, or Accountant role.

- **system_admin** — Merges employee, manager, finance, and HR access, plus executive approvals (payroll and recruitment approve) and platform administration of users, roles, and settings.
- **hr** — Company-wide people operations: employees, organization, time, leave, payroll preparation, workplace, compliance, and also finance and accounts payable. Does not administer users or roles.
- **finance_manager** — Company finance and accounts payable (ledger through tax and AP specialty), with payroll and payslip visibility. Not a company HR administrator.
- **manager** — Team lead on top of self-service: approve attendance, leave, overtime, and timesheets; edit roster and probation; view the team calendar and team reports. No finance or accounts-payable modules.
- **employee** — Self-service at \`own\` scope: profile, attendance, leave, overtime, payslip, documents, training, helpdesk, workplace participation, and resignation.

Scopes on each grant are \`own\`, \`team\`, \`department\`, or \`company\`. A wider scope includes the narrower ones.

## Permissions

\`JwtAuthGuard\` requires a valid access token unless the handler is marked \`@Public()\`. \`PermissionsGuard\` reads \`@RequirePermission(module, action)\` and checks \`ROLE_PERMISSIONS\` (or database grants when they exist). Swagger documents that contract with \`x-required-permission\` and 401/403 responses. **The UI does not enforce permissions**; the guards do.

Public operations are marked \`x-public: true\` (health and the login, 2FA verify, and refresh routes).
`.trim();

/** OpenAPI info, bearer scheme, and tag catalog. Paths are added by SwaggerModule. */
export function buildSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  const builder = new DocumentBuilder()
    .setTitle('PSC HRM API')
    .setDescription(DESCRIPTION)
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'Paste accessToken from POST /api/auth/login (or 2FA verify)',
    });

  for (const tag of SWAGGER_TAGS) {
    builder.addTag(tag.name, tag.description);
  }

  return builder.build();
}
