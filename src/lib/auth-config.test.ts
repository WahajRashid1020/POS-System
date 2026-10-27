import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ connectDB: vi.fn() }));
vi.mock("./models/User", () => ({ UserModel: {} }));

type DemoAuthorize = (credentials: Record<string, string>) => Promise<{ role: string } | null>;
interface ProviderLike {
  id: string;
  authorize?: DemoAuthorize;
  options?: { authorize?: DemoAuthorize };
}

async function loadAuth(flag: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_ENABLE_DEMO_LOGIN", flag);
  return import("./auth");
}

const providerIds = (providers: unknown[]) =>
  (providers as ProviderLike[]).map((p) => p.id);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("demo login flag", () => {
  it.each(["", "false", "TRUE", "1", "yes"])(
    "offers only Google sign-in when the flag is %j",
    async (flag) => {
      const { authOptions, DEMO_LOGIN_ENABLED } = await loadAuth(flag);

      expect(DEMO_LOGIN_ENABLED).toBe(false);
      expect(providerIds(authOptions.providers)).toEqual(["google"]);
    },
  );

  it("adds the passwordless demo provider only when explicitly set to true", async () => {
    const { authOptions, DEMO_LOGIN_ENABLED } = await loadAuth("true");

    expect(DEMO_LOGIN_ENABLED).toBe(true);
    expect(providerIds(authOptions.providers)).toEqual(["google", "credentials"]);
  });

  it("still serves the four demo roles when enabled, and nothing for unknown roles", async () => {
    const { authOptions } = await loadAuth("true");
    const demo = (authOptions.providers as unknown as ProviderLike[]).find(
      (p) => p.id === "credentials",
    );
    const authorize = demo?.options?.authorize ?? demo?.authorize;

    for (const role of ["admin", "manager", "cashier", "kitchen"]) {
      expect(await authorize?.({ role })).toMatchObject({ role });
    }
    expect(await authorize?.({ role: "superuser" })).toBeNull();
  });
});

describe("session settings", () => {
  it("uses JWT sessions that expire after 12 hours", async () => {
    const { authOptions } = await loadAuth("false");

    expect(authOptions.session?.strategy).toBe("jwt");
    expect(authOptions.session?.maxAge).toBe(12 * 60 * 60);
  });
});
