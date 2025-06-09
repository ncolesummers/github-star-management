#!/usr/bin/env -S deno run

/**
 * Test file for git hooks
 */

// This file is used to test the pre-commit hook's ability to detect debug statements

function testFunction(): void {
  console.log("This should be detected by pre-commit hook");
  
  const data = {
    name: "Test Data",
    value: 42
  };
  
  return;
}

testFunction();