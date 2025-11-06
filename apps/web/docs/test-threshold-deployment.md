# Test Threshold Deployment

This document explains the test threshold deployment strategy used in Netlify builds.

## Overview

The project uses a **90% pass rate threshold** for deployments. This means that Netlify will proceed with deployment as long as at least 90% of tests pass, rather than requiring 100% pass rate.

This strategy provides a balance between:

- **Quality assurance**: Still requiring high test pass rate (90%+)
- **Deployment velocity**: Allowing deployment when most tests pass
- **Pragmatic testing**: Acknowledging that occasional flaky tests or minor failures shouldn't block critical deployments

## How It Works

### Test Script

The `test:threshold` script ([scripts/test-with-threshold.ts](../scripts/test-with-threshold.ts)) runs all tests and analyzes the results:

```bash
bun run test:threshold
```

The script:

1. Runs all tests using vitest (no `--bail` flag)
2. Captures and parses test output
3. Calculates pass rate: `passed tests / total tests`
4. Exits with code 0 if pass rate >= 90%, otherwise exits with code 1

### Netlify Configuration

The [netlify.toml](../../../netlify.toml) file uses `test:threshold` in all build contexts:

- Default builds
- Production deployments
- Deploy previews
- Branch deployments

## Usage

### Running Locally

Test with 90% threshold (default):

```bash
cd apps/web
bun run test:threshold
```

Test with custom threshold (e.g., 95%):

```bash
bun run test:threshold:95
# or
bun run test:threshold --threshold 0.95
```

### Output Example

```
📊 Running tests with 90% pass threshold

[test output...]

================================================================================
📊 TEST RESULTS SUMMARY
================================================================================
Total Tests:   100
✅ Passed:     92
❌ Failed:     8
📈 Pass Rate:  92.00%
🎯 Threshold:  90%
================================================================================

✅ PASS THRESHOLD MET - Proceeding with deployment
   92/100 tests passed (92.00% >= 90%)
```

## Configuration

### Adjusting the Threshold

To change the deployment threshold:

1. **For all builds**: Edit [netlify.toml](../../../netlify.toml):

   ```toml
   # Change from:
   bun run test:threshold

   # To (for 95% threshold):
   bun run test:threshold --threshold 0.95
   ```

2. **For local testing**: Use the custom threshold option:
   ```bash
   bun run test:threshold --threshold 0.95
   ```

### Reverting to Strict Mode

To require 100% test pass rate (strict mode):

1. Edit [netlify.toml](../../../netlify.toml)
2. Replace `bun run test:threshold` with `bun run test:ci`
3. The `test:ci` script uses `--bail=1` flag (stops on first failure)

## Best Practices

### When to Use Threshold Deployment

✅ **Good use cases:**

- Minor flaky tests that don't affect core functionality
- Tests for edge cases or experimental features
- When a critical hotfix needs to be deployed quickly
- Tests failing due to external service issues (network, APIs)

### When NOT to Use Threshold Deployment

❌ **Avoid threshold deployment when:**

- Security tests are failing
- Authentication/authorization tests fail
- Payment processing tests fail
- Data integrity tests fail
- Core business logic tests fail

### Monitoring Failed Tests

Even when deployment proceeds with failed tests, you should:

1. **Review the build logs** to identify which tests failed
2. **Create issues** for failed tests
3. **Fix failed tests** as soon as possible
4. **Don't let failed tests accumulate** - maintain test quality

### Example Workflow

```bash
# 1. Run tests locally to check pass rate
bun run test:threshold

# 2. If < 90%, identify and fix critical failures
bun run test:run | grep FAIL

# 3. Commit fixes
git commit -m "fix: resolve critical test failures"

# 4. Push - deployment proceeds if >= 90%
git push
```

## Scripts Reference

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `test`              | Interactive watch mode               |
| `test:run`          | Run all tests once (no threshold)    |
| `test:ci`           | Strict mode - fails on first failure |
| `test:threshold`    | 90% threshold deployment             |
| `test:threshold:95` | 95% threshold deployment             |

## Implementation Details

### Script Location

[apps/web/scripts/test-with-threshold.ts](../scripts/test-with-threshold.ts)

### How It Parses Results

The script parses vitest's verbose output for these patterns:

```
Tests  25 passed | 2 failed (27)
Test Files  4 passed | 1 failed (5)
```

It extracts:

- Number of passed tests
- Number of failed tests
- Total number of tests

Then calculates: `passRate = passed / total`

### Error Handling

If test results can't be parsed:

- Script logs an error
- Falls back to vitest's exit code
- Fails the build (conservative approach)

## Troubleshooting

### Tests pass locally but fail in Netlify

Check:

- Environment variables (database URLs, API keys)
- Node.js version consistency
- Dependencies installed correctly
- Database migrations ran successfully

### Build passes but shouldn't

If tests with failures < 10% shouldn't allow deployment:

- Review which tests failed in build logs
- Consider reverting to strict mode (`test:ci`)
- Increase threshold to 95% or higher
- Fix the failing tests immediately

### Script errors during parsing

If you see "Could not parse test results":

- Vitest output format may have changed
- Check the script's regex patterns
- Update patterns to match new vitest output
- Report issue if it's a vitest version change

## Related Documentation

- [Testing Documentation](./TESTING.md) - Comprehensive testing guide
- [CI/CD Pipeline](../../../README.md#ci-cd) - Full pipeline overview
- [Netlify Configuration](../../../netlify.toml) - Build configuration

## Questions?

For questions or issues with threshold deployment:

1. Check build logs in Netlify dashboard
2. Review failed tests in the output
3. Test locally with `bun run test:threshold`
4. Report persistent issues on GitHub
