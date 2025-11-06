#!/usr/bin/env tsx

/**
 * Test Runner with Pass Rate Threshold
 *
 * Runs vitest and allows build to proceed if at least 90% of tests pass.
 * This script:
 * 1. Runs all tests (no --bail flag)
 * 2. Captures test output
 * 3. Calculates pass rate from vitest summary
 * 4. Exits with 0 if pass rate >= threshold, otherwise exits with 1
 *
 * Usage:
 *   bun run test:threshold
 *   bun run test:threshold --threshold 0.95  (for 95%)
 */

import { spawn } from "child_process"

// Parse command line arguments
const args = process.argv.slice(2)
const thresholdIndex = args.indexOf("--threshold")
const PASS_THRESHOLD = thresholdIndex >= 0 ? parseFloat(args[thresholdIndex + 1]) : 0.9

console.log(`\n📊 Running tests with ${(PASS_THRESHOLD * 100).toFixed(0)}% pass threshold\n`)

// Buffer to capture stdout
let outputBuffer = ""

// Run vitest with verbose reporter
const vitestArgs = ["run", "--reporter=verbose", "--no-coverage"]

// Set NODE_OPTIONS environment variable for vitest
const env = {
  ...process.env,
  NODE_OPTIONS: "--experimental-vm-modules",
}

const vitest = spawn("npx", ["vitest", ...vitestArgs], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: false,
  cwd: process.cwd(),
  env,
})

// Capture stdout
vitest.stdout?.on("data", (data) => {
  const text = data.toString()
  process.stdout.write(text) // Echo to console
  outputBuffer += text
})

// Capture stderr
vitest.stderr?.on("data", (data) => {
  const text = data.toString()
  process.stderr.write(text) // Echo to console
  outputBuffer += text
})

vitest.on("close", (code) => {
  try {
    // Parse vitest output for test summary
    // Vitest output typically contains a line like:
    // "Test Files  4 passed | 1 failed (5)"
    // "Tests  25 passed | 2 failed (27)"

    const testFilesMatch = outputBuffer.match(
      /Test Files\s+(\d+)\s+passed(?:\s+\|\s+(\d+)\s+failed)?\s+\((\d+)\)/
    )
    const testsMatch = outputBuffer.match(
      /Tests\s+(\d+)\s+passed(?:\s+\|\s+(\d+)\s+failed)?(?:\s+\|\s+(\d+)\s+skipped)?\s+\((\d+)\)/
    )

    let numPassedTests = 0
    let numFailedTests = 0
    let numTotalTests = 0

    // Try to extract from "Tests" line first (more accurate)
    if (testsMatch) {
      numPassedTests = parseInt(testsMatch[1] || "0", 10)
      numFailedTests = parseInt(testsMatch[2] || "0", 10)
      numTotalTests = parseInt(testsMatch[4] || "0", 10)
    } else if (testFilesMatch) {
      // Fallback to test files count
      numPassedTests = parseInt(testFilesMatch[1] || "0", 10)
      numFailedTests = parseInt(testFilesMatch[2] || "0", 10)
      numTotalTests = parseInt(testFilesMatch[3] || "0", 10)
      console.warn("\n⚠️  Using test file counts (individual test counts not found)")
    } else {
      console.error("\n❌ Could not parse test results from output")
      console.error("   Vitest may have crashed or output format changed")
      console.error(`   Vitest exit code: ${code}`)
      process.exit(code || 1)
    }

    // Calculate pass rate
    const passRate = numTotalTests > 0 ? numPassedTests / numTotalTests : 0

    // Display results
    console.log("\n" + "=".repeat(80))
    console.log("📊 TEST RESULTS SUMMARY")
    console.log("=".repeat(80))
    console.log(`Total Tests:   ${numTotalTests}`)
    console.log(`✅ Passed:     ${numPassedTests}`)
    console.log(`❌ Failed:     ${numFailedTests}`)
    console.log(`📈 Pass Rate:  ${(passRate * 100).toFixed(2)}%`)
    console.log(`🎯 Threshold:  ${(PASS_THRESHOLD * 100).toFixed(0)}%`)
    console.log("=".repeat(80))

    // Determine if we should proceed with build
    if (passRate >= PASS_THRESHOLD) {
      console.log(`\n✅ PASS THRESHOLD MET - Proceeding with deployment`)
      console.log(
        `   ${numPassedTests}/${numTotalTests} tests passed (${(passRate * 100).toFixed(2)}% >= ${(PASS_THRESHOLD * 100).toFixed(0)}%)\n`
      )
      process.exit(0)
    } else {
      console.log(`\n❌ PASS THRESHOLD NOT MET - Blocking deployment`)
      console.log(
        `   ${numPassedTests}/${numTotalTests} tests passed (${(passRate * 100).toFixed(2)}% < ${(PASS_THRESHOLD * 100).toFixed(0)}%)`
      )
      console.log(`   ${numFailedTests} test(s) failed\n`)
      process.exit(1)
    }
  } catch (error) {
    console.error("\n❌ Error parsing test results:", error)
    console.error(`   Vitest exit code: ${code}`)
    console.error("   Falling back to strict mode - failing build")
    process.exit(code || 1)
  }
})

vitest.on("error", (error) => {
  console.error("❌ Failed to run tests:", error)
  process.exit(1)
})
