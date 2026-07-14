export class DemoAuthConfigurationError extends Error {
  constructor(missing: string[]) {
    super(`Missing demo authentication settings: ${missing.join(', ')}`);
    this.name = 'DemoAuthConfigurationError';
  }
}

export interface DemoAuthConfig {
  jwtSecret: string;
  adminEmail: string;
  adminPassword: string;
}

export function getDemoAuthConfig(): DemoAuthConfig {
  const values = {
    jwtSecret: process.env.JWT_SECRET,
    adminEmail: process.env.DEMO_ADMIN_EMAIL,
    adminPassword: process.env.DEMO_ADMIN_PASSWORD,
  };
  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new DemoAuthConfigurationError(missing);
  }

  return values as DemoAuthConfig;
}
