type TestCase = {
  name: string;
  fn: () => void | Promise<void>;
};

const tests: TestCase[] = [];

export function test(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

function formatValue(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

export function expect(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? 'Expected condition to be truthy');
  }
}

export function expectEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message ?? `Expected ${formatValue(actual)} to equal ${formatValue(expected)}`,
    );
  }
}

export function expectDeepEqual(actual: unknown, expected: unknown, message?: string): void {
  if (formatValue(actual) !== formatValue(expected)) {
    throw new Error(
      message ?? `Expected ${formatValue(actual)} to deeply equal ${formatValue(expected)}`,
    );
  }
}

export async function run() {
  let failures = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✓ ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`✗ ${name}`);
      console.error(error);
    }
  }

  console.log(`\n${tests.length - failures} passed, ${failures} failed`);

  if (failures > 0) {
    throw new Error(`${failures} test(s) failed`);
  }
}
