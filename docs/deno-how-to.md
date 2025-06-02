# Comprehensive Deno How-To Guide

## Introduction to Deno

### What Deno is and its core philosophy

**Deno** (pronounced "dee-no") is a modern, secure runtime for JavaScript, TypeScript, and WebAssembly created by Ryan Dahl, the original creator of Node.js. Built on V8, Rust, and Tokio, Deno represents a fundamental rethinking of JavaScript runtime design with a security-first approach.

**Core Philosophy:**
- **Security by Default**: Code runs in a secure sandbox requiring explicit permissions
- **Modern JavaScript/TypeScript**: Native TypeScript support without configuration
- **Web Standards Alignment**: Uses standard web APIs like fetch, Promises, and ES Modules
- **All-in-One Toolchain**: Includes formatter, linter, test runner, and bundler
- **Zero Configuration**: Works immediately without complex setup files

### Key differences from Node.js

| Feature | Deno | Node.js |
|---------|------|---------|
| **Security** | Secure by default, explicit permissions | Full system access by default |
| **TypeScript** | Native support, no setup needed | Requires additional configuration |
| **Module System** | ES Modules, URL imports | CommonJS and ES Modules, npm registry |
| **Dependency Management** | URL/JSR imports, deno.json | npm/yarn with package.json |
| **Built-in Tools** | Complete toolchain included | Requires separate tools |
| **Runtime APIs** | Web-standard APIs (fetch, Web Workers) | Node-specific APIs |

### Installation instructions for major platforms

#### Windows
```powershell
# PowerShell (Recommended)
irm https://deno.land/install.ps1 | iex

# Chocolatey
choco install deno

# Scoop
scoop install deno
```

#### macOS
```bash
# Shell Script (Recommended)
curl -fsSL https://deno.land/install.sh | sh

# Homebrew
brew install deno
```

#### Linux
```bash
# Shell Script (Recommended)
curl -fsSL https://deno.land/install.sh | sh

# Ubuntu/Debian
sudo apt install deno

# Arch Linux
pacman -S deno
```

**Verify Installation:**
```bash
deno --version
```

### First script walkthrough with detailed explanations

#### Hello World (JavaScript)
```javascript
// hello-world.js
// Simple function to capitalize first letter
function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

// Function that creates greeting message
function hello(name) {
    return "Hello " + capitalize(name);
}

// Call the function and print results
console.log(hello("john"));    // Output: Hello John
console.log(hello("Sarah"));   // Output: Hello Sarah

// Run with: deno run hello-world.js
```

#### Hello World (TypeScript)
```typescript
// hello-world.ts
// Function with TypeScript type annotations
function capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function hello(name: string): string {
    return "Hello " + capitalize(name);
}

// TypeScript provides compile-time type checking
console.log(hello("john"));
console.log(hello("Sarah"));

// Run with: deno run hello-world.ts
```

#### HTTP Server Example
```typescript
// server.ts
// Using Deno's built-in serve function (Deno 2.0+)
Deno.serve((req: Request) => {
    const url = new URL(req.url);
    
    if (url.pathname === "/") {
        return new Response("Hello, World!", {
            headers: { "content-type": "text/plain" },
        });
    }
    
    return new Response("404 Not Found", { status: 404 });
});

console.log("Server running on http://localhost:8000");

// Run with: deno run --allow-net server.ts
```

## Running Scripts and Applications

### Basic script execution with permissions

Deno's security model requires explicit permissions for system access:

#### Core Permission Flags
- `--allow-read[=<path>]` - File system read access
- `--allow-write[=<path>]` - File system write access  
- `--allow-net[=<domain>]` - Network access
- `--allow-env[=<var>]` - Environment variable access
- `--allow-run[=<program>]` - Subprocess execution
- `--allow-all` or `-A` - All permissions (use cautiously)

#### Permission Examples
```bash
# Allow specific file access
deno run --allow-read=/etc --allow-write=/tmp script.ts

# Allow specific network domains
deno run --allow-net=api.github.com,deno.land script.ts

# Allow specific environment variables
deno run --allow-env=HOME,PATH script.ts

# Runtime permission prompts
deno run script.ts  # Will prompt for permissions as needed
```

### Import maps and dependency management

#### Three Import Methods

**1. URL Imports (Traditional Deno)**
```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
```

**2. npm: Specifier (Deno 2.0)**
```typescript
import chalk from "npm:chalk@5.3.0";
import express from "npm:express@^4.18.0";
```

**3. JSR Specifier (JavaScript Registry)**
```typescript
import { assert } from "jsr:@std/assert@^1.0.0";
import { parseArgs } from "jsr:@std/cli@^1.0.0";
```

#### Import Maps in deno.json
```json
{
  "imports": {
    "@std/assert": "jsr:@std/assert@^1.0.0",
    "@std/http": "jsr:@std/http@^1.0.0",
    "chalk": "npm:chalk@^5.3.0",
    "express": "npm:express@^4.18.0",
    "~/": "./"
  }
}
```

**Usage:**
```typescript
import { assertEquals } from "@std/assert";
import chalk from "chalk";
import { utils } from "~/utils/mod.ts";
```

### Task runners and deno.json configuration

#### Complete deno.json Configuration
```json
{
  "name": "my-deno-project",
  "version": "1.0.0",
  "exports": "./mod.ts",
  
  "tasks": {
    "start": "deno run --allow-net --allow-read main.ts",
    "dev": "deno run --allow-net --allow-read --watch main.ts",
    "test": "deno test --allow-read",
    "lint": "deno lint",
    "fmt": "deno fmt",
    "build": "deno compile --output bin/app main.ts"
  },
  
  "imports": {
    "@std/assert": "jsr:@std/assert@^1.0.0",
    "@std/http": "jsr:@std/http@^1.0.0",
    "chalk": "npm:chalk@^5.3.0"
  },
  
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": true
  },
  
  "lint": {
    "include": ["src/"],
    "exclude": ["src/testdata/"],
    "rules": {
      "tags": ["recommended"],
      "include": ["ban-untagged-todo"],
      "exclude": ["no-unused-vars"]
    }
  },
  
  "fmt": {
    "useTabs": false,
    "lineWidth": 80,
    "indentWidth": 2,
    "semiColons": true,
    "singleQuote": false,
    "proseWrap": "preserve"
  }
}
```

**Execute tasks:**
```bash
deno task start       # Run the start task
deno task dev         # Run dev with file watching
deno task test        # Run tests
deno task build       # Compile to executable
```

### Common CLI flags and their uses

```bash
# Development flags
deno run --watch main.ts                    # Auto-restart on file changes
deno run --watch-hmr main.ts               # Hot module replacement
deno run --reload main.ts                  # Force reload dependencies
deno run --check main.ts                   # Enable type checking

# Debugging
deno run --inspect main.ts                 # Enable Chrome DevTools debugging
deno run --inspect-brk main.ts             # Break on first line

# Configuration
deno run --config deno.json main.ts        # Use specific config file
deno run --import-map import_map.json main.ts  # Use import map
```

### Debugging techniques and tools

#### VS Code Debug Configuration
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Deno: Run",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "deno",
      "runtimeArgs": ["run", "--inspect-brk", "--allow-all"],
      "program": "${file}",
      "attachSimplePort": 9229,
      "outputCapture": "std"
    }
  ]
}
```

#### Chrome DevTools Debugging
```bash
# Start with debugger
deno run --inspect-brk --allow-all main.ts

# Connect via Chrome
# Open chrome://inspect in Chrome
# Click "Inspect" next to your Deno process
```

## Working with HTTP and APIs

### Deno's built-in fetch API overview

Deno provides the standard web `fetch` API for HTTP requests, eliminating the need for external HTTP libraries.

### Making GET/POST/PUT/DELETE requests with examples

#### Basic GET Request
```typescript
// Simple GET request
const response = await fetch("https://api.github.com/users/denoland");
const userData = await response.json();
console.log(userData);

// With error handling
try {
  const response = await fetch("https://api.example.com/data");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error("Fetch failed:", error);
}
```

#### POST Request with JSON
```typescript
const postData = {
  username: "example",
  email: "user@example.com"
};

const response = await fetch("https://api.example.com/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN"
  },
  body: JSON.stringify(postData)
});

const result = await response.json();
```

#### PUT/PATCH Operations
```typescript
// PUT request for full update
const updateUser = async (userId: string, userData: any) => {
  const response = await fetch(`https://api.example.com/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_TOKEN"
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    throw new Error(`Update failed: ${response.status}`);
  }
  
  return await response.json();
};
```

#### DELETE Operations
```typescript
const deleteUser = async (userId: string) => {
  const response = await fetch(`https://api.example.com/users/${userId}`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer YOUR_TOKEN"
    }
  });
  
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }
  
  return response.status === 204; // No content
};
```

### Handling request/response headers

```typescript
// Custom headers
const headers = new Headers({
  "Content-Type": "application/json",
  "X-API-Key": "your-api-key",
  "User-Agent": "Deno/1.0"
});

const response = await fetch("https://api.example.com/data", {
  headers: headers
});

// Reading response headers
console.log(response.headers.get("Content-Type"));
console.log(response.headers.get("X-Rate-Limit-Remaining"));
```

### Working with different content types

```typescript
// JSON
const jsonResponse = await fetch("https://api.example.com/json");
const jsonData = await jsonResponse.json();

// Text
const textResponse = await fetch("https://api.example.com/text");
const textData = await textResponse.text();

// Binary/Blob
const imageResponse = await fetch("https://api.example.com/image");
const imageBlob = await imageResponse.blob();

// Form Data
const formData = new FormData();
formData.append("name", "John");
formData.append("file", new File(["content"], "file.txt"));

await fetch("https://api.example.com/upload", {
  method: "POST",
  body: formData
});
```

### Authentication patterns

#### Bearer Token Authentication
```typescript
class APIClient {
  constructor(private baseURL: string, private token: string) {}
  
  async request(endpoint: string, options: RequestInit = {}) {
    return fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    });
  }
}
```

#### API Key Authentication
```typescript
class APIKeyClient {
  constructor(
    private baseURL: string,
    private apiKey: string,
    private keyHeader = "X-API-Key"
  ) {}
  
  async request(endpoint: string, options: RequestInit = {}) {
    return fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        [this.keyHeader]: this.apiKey,
        "Content-Type": "application/json",
        ...options.headers
      }
    });
  }
}
```

### Comprehensive error handling strategies

#### Custom Error Classes
```typescript
class APIError extends Error {
  constructor(public status: number, message: string, public response?: Response) {
    super(message);
    this.name = "APIError";
  }
}

const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new APIError(response.status, errorBody || response.statusText, response);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network or other errors
    throw new Error(`Network error: ${error.message}`);
  }
};
```

#### Retry Logic with Exponential Backoff
```typescript
const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  maxRetries = 3,
  baseDelay = 1000
) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      // Don't retry on client errors (4xx), only server errors (5xx)
      if (response.status < 500) {
        throw new APIError(response.status, await response.text());
      }
      
      if (attempt === maxRetries) {
        throw new APIError(response.status, `Failed after ${maxRetries} retries`);
      }
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

### Rate limiting implementation

#### Token Bucket Rate Limiter
```typescript
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  
  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
    private refillInterval: number = 1000 // milliseconds
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor((timePassed / this.refillInterval) * this.refillRate);
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  async consume(tokens = 1): Promise<boolean> {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
}

// Usage
const rateLimiter = new TokenBucket(10, 2); // 10 capacity, 2 tokens/second

const rateLimitedFetch = async (url: string, options?: RequestInit) => {
  const canProceed = await rateLimiter.consume();
  
  if (!canProceed) {
    throw new Error("Rate limit exceeded");
  }
  
  return fetch(url, options);
};
```

### Creating HTTP servers with Deno.serve()

```typescript
// Basic server
Deno.serve({
  port: 8000,
  handler: async (req) => {
    const url = new URL(req.url);
    
    if (url.pathname === "/api/users" && req.method === "GET") {
      return new Response(JSON.stringify({ users: [] }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (url.pathname === "/api/users" && req.method === "POST") {
      const body = await req.json();
      // Process user creation
      return new Response(JSON.stringify({ id: 1, ...body }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response("Not Found", { status: 404 });
  }
});
```

### WebSocket implementation

#### WebSocket Server
```typescript
Deno.serve((req) => {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response(null, { status: 501 });
  }
  
  const { socket, response } = Deno.upgradeWebSocket(req);
  
  socket.addEventListener("open", () => {
    console.log("Client connected!");
    socket.send(JSON.stringify({ type: "welcome", message: "Connected to server" }));
  });
  
  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Echo message back
      socket.send(JSON.stringify({
        type: "echo",
        data: data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      socket.send(JSON.stringify({
        type: "error",
        message: "Invalid JSON"
      }));
    }
  });
  
  socket.addEventListener("close", () => {
    console.log("Client disconnected");
  });
  
  return response;
});
```

### Streaming large responses

```typescript
// Download with progress tracking
const downloadFile = async (url: string, filename: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  
  const contentLength = response.headers.get("Content-Length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;
  
  const file = await Deno.open(filename, { write: true, create: true });
  
  if (response.body) {
    const reader = response.body.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        await file.write(value);
        loaded += value.length;
        
        if (total > 0) {
          const progress = (loaded / total) * 100;
          console.log(`Download progress: ${progress.toFixed(2)}%`);
        }
      }
    } finally {
      reader.releaseLock();
      file.close();
    }
  }
};
```

### Complete real-world API integration examples

```typescript
interface APIClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  rateLimitPerSecond?: number;
}

class ProductionAPIClient {
  private rateLimiter?: TokenBucket;
  private baseHeaders: Record<string, string> = {};
  
  constructor(private config: APIClientConfig) {
    if (config.apiKey) {
      this.baseHeaders["Authorization"] = `Bearer ${config.apiKey}`;
    }
    
    if (config.rateLimitPerSecond) {
      this.rateLimiter = new TokenBucket(
        config.rateLimitPerSecond * 10, // burst capacity
        config.rateLimitPerSecond
      );
    }
  }
  
  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    // Rate limiting
    if (this.rateLimiter) {
      const canProceed = await this.rateLimiter.consume();
      if (!canProceed) {
        throw new Error("Rate limit exceeded");
      }
    }
    
    const url = `${this.config.baseURL}${endpoint}`;
    const controller = new AbortController();
    
    // Timeout handling
    const timeoutId = this.config.timeout ? 
      setTimeout(() => controller.abort(), this.config.timeout) : 
      null;
    
    try {
      const response = await fetchWithRetry(url, {
        ...options,
        headers: {
          ...this.baseHeaders,
          "Content-Type": "application/json",
          ...options.headers
        },
        signal: controller.signal
      }, this.config.retries || 3);
      
      if (!response.ok) {
        throw new APIError(response.status, await response.text());
      }
      
      return await response.json();
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
  
  // Convenience methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }
  
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Usage
const client = new ProductionAPIClient({
  baseURL: "https://api.example.com",
  apiKey: "your-api-key",
  timeout: 10000,
  retries: 3,
  rateLimitPerSecond: 10
});

try {
  const users = await client.get<User[]>("/users");
  const newUser = await client.post<User>("/users", {
    name: "John Doe",
    email: "john@example.com"
  });
} catch (error) {
  console.error("API request failed:", error);
}
```

## Linting with Deno

### Built-in linter overview

Deno includes a fast, built-in linter (`deno lint`) that supports recommended ESLint rules without external dependencies.

### Configuration via deno.json

```json
{
  "lint": {
    "include": ["src/", "test/"],
    "exclude": ["src/testdata/", "src/fixtures/**/*.ts"],
    "rules": {
      "tags": ["recommended"],
      "include": ["ban-untagged-todo"],
      "exclude": ["no-unused-vars"]
    }
  }
}
```

### IDE integration setup

#### VS Code Setup
1. Install the official Deno extension
2. Enable Deno for workspace: `Ctrl+Shift+P` → "Deno: Initialize Workspace Configuration"
3. Enable linting in settings:
```json
{
  "deno.enable": true,
  "deno.lint": true,
  "deno.unstable": false
}
```

### Custom rules and ignoring files

```typescript
// Ignore specific rule for next line
// deno-lint-ignore no-explicit-any
function processData(data: any): void {
  // Implementation
}

// Ignore multiple rules
// deno-lint-ignore no-explicit-any explicit-function-return-type
function handleRequest(req: any) {
  return "processed";
}

// Ignore for entire file
// deno-lint-ignore-file no-explicit-any no-unused-vars

// Ignore with reason
// deno-lint-ignore no-explicit-any -- Legacy API requires any type
function legacyHandler(input: any): any {
  return input;
}
```

### Pre-commit hooks

```json
// package.json or scripts
{
  "scripts": {
    "lint": "deno lint",
    "lint:fix": "deno lint --fix",
    "pre-commit": "deno lint && deno fmt --check"
  }
}
```

### Practical examples with before/after code

#### Before (Linting Issues)
```typescript
// Multiple linting issues
function processuser(data) {
    var result = data.name;
    console.log("Processing user")
    if(data.age>18){
        result = result + " (adult)"
    }
    return result
}
```

#### After (Fixed)
```typescript
// Properly formatted and typed
function processUser(data: { name: string; age: number }): string {
  let result = data.name;
  // TODO(user): Replace with proper logging
  if (data.age > 18) {
    result = result + " (adult)";
  }
  return result;
}
```

## Testing in Deno

### Built-in test runner features

Deno provides a comprehensive built-in test runner with zero configuration required.

### Writing unit tests

```typescript
// math_test.ts
import { assertEquals, assertThrows } from "jsr:@std/assert";

Deno.test("basic addition", () => {
  assertEquals(2 + 3, 5);
});

Deno.test("async operation", async () => {
  const result = await fetchData();
  assertEquals(result.status, "success");
});

Deno.test({
  name: "error handling",
  fn() {
    assertThrows(() => {
      throw new Error("Test error");
    }, Error, "Test error");
  }
});
```

### Testing HTTP endpoints and API calls

```typescript
import { assertEquals } from "jsr:@std/assert";

Deno.test("HTTP endpoint test", async () => {
  const response = await fetch("http://localhost:8000/health");
  const data = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(data.status, "ok");
});
```

### Mocking fetch and external APIs

```typescript
Deno.test("API request test", async () => {
  const originalFetch = globalThis.fetch;
  
  globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
    if (input.toString().includes("/users/123")) {
      return new Response(
        JSON.stringify({ id: 123, name: "John Doe" }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
    return new Response("Not found", { status: 404 });
  };
  
  try {
    const userData = await fetchUserData("123");
    assertEquals(userData.name, "John Doe");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
```

### Integration and end-to-end testing

```typescript
Deno.test("complex workflow", async (t) => {
  let user: User;
  
  await t.step("create user", async () => {
    user = await createUser({ name: "John", email: "john@example.com" });
    assertEquals(user.name, "John");
  });
  
  await t.step("update user", async () => {
    user = await updateUser(user.id, { name: "Jane" });
    assertEquals(user.name, "Jane");
  });
  
  await t.step("delete user", async () => {
    await deleteUser(user.id);
    // Verify deletion
  });
});
```

### Test coverage reporting

```bash
# Generate coverage data
deno test --coverage=coverage

# View coverage summary
deno coverage coverage

# Generate HTML report
deno coverage coverage --html

# Generate LCOV format
deno coverage coverage --lcov > coverage.lcov

# Exclude files from coverage
deno coverage --exclude="test_,vendor/,node_modules/" coverage
```

### Snapshot testing

```typescript
import { assertSnapshot } from "jsr:@std/testing/snapshot";

Deno.test("snapshot test", async (t) => {
  const result = generateComplexOutput();
  await assertSnapshot(t, result);
});
```

### Performance benchmarking

```typescript
Deno.test("performance benchmark", async () => {
  const start = performance.now();
  
  // Run operation multiple times
  for (let i = 0; i < 1000; i++) {
    await someOperation();
  }
  
  const duration = performance.now() - start;
  console.log(`Operation took ${duration}ms for 1000 iterations`);
  
  // Assert performance requirements
  assert(duration < 5000, "Operation should complete within 5 seconds");
});
```

### Test organization best practices

```
project/
├── src/
│   ├── user.ts
│   ├── user_test.ts      # Tests alongside source
│   └── utils/
│       ├── helper.ts
│       └── helper_test.ts
├── tests/
│   ├── integration/      # Integration tests
│   └── e2e/             # End-to-end tests
└── deno.json
```

## GitHub Actions Integration

### Setting up Deno in GitHub Actions

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        
      - name: Setup Deno
        uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
```

### Caching strategies

```yaml
- name: Setup Deno with cache
  uses: denoland/setup-deno@v2
  with:
    deno-version: v2.x
    cache: true  # Automatic dependency caching
    
# Custom cache hash for advanced scenarios
- name: Setup Deno with custom cache
  uses: denoland/setup-deno@v2
  with:
    cache-hash: ${{ hashFiles('**/deno.lock', '**/import_map.json') }}
```

### Running tests and linting in CI

```yaml
- name: Check formatting
  run: deno fmt --check
  
- name: Run linter
  run: deno lint
  
- name: Type check
  run: deno check main.ts
  
- name: Run tests
  run: deno test --allow-all --coverage=cov/
  
- name: Generate coverage report
  run: deno coverage --lcov cov > cov.lcov
  
- name: Upload coverage
  uses: coverallsapp/github-action@master
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    path-to-lcov: cov.lcov
```

### Building and releasing applications

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        
    steps:
      - uses: actions/checkout@v4
      
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
          
      - name: Build executable
        run: |
          deno compile --allow-net --allow-read \
            --output dist/myapp-${{ matrix.os }} \
            main.ts
            
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: myapp-${{ matrix.os }}
          path: dist/myapp-${{ matrix.os }}
```

### Security scanning

```yaml
- name: Security audit
  run: deno lint --rules=recommended
  
- name: Dependency vulnerability check
  run: |
    # Check for known vulnerabilities in npm dependencies
    deno run --allow-read --allow-net npm:audit-ci
```

### Matrix testing across versions

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        deno-version: ["v1.x", "v2.x", "canary"]
        
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Deno
        uses: denoland/setup-deno@v2
        with:
          deno-version: ${{ matrix.deno-version }}
          
      - name: Run tests
        run: deno test --allow-all
```

### Complete workflow examples

```yaml
name: Production CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
          cache: true
          
      - name: Quality checks
        run: |
          deno fmt --check
          deno lint
          deno check main.ts
          
  test:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
          cache: true
          
      - name: Run tests with coverage
        run: |
          deno test --allow-all --coverage=coverage
          deno coverage coverage --lcov > coverage.lcov
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.lcov
          
  deploy:
    runs-on: ubuntu-latest
    needs: [quality, test]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
          
      - name: Deploy to Deno Deploy
        run: |
          # Deploy to production
          deployctl deploy --project=myapp --prod main.ts
        env:
          DENO_DEPLOY_TOKEN: ${{ secrets.DENO_DEPLOY_TOKEN }}
```

## Best Practices and Patterns

### Project structure

```
my-deno-app/
├── deno.json           # Project configuration
├── deno.lock          # Lock file for dependencies
├── main.ts            # Application entry point
├── deps.ts            # Centralized dependencies
├── src/
│   ├── handlers/      # Request handlers
│   ├── middleware/    # Middleware functions
│   ├── services/      # Business logic
│   └── utils/         # Utility functions
├── tests/
│   ├── unit/         # Unit tests
│   └── integration/  # Integration tests
├── scripts/          # Build and utility scripts
└── docs/            # Documentation
```

### Security and permissions strategies

```typescript
// Use minimal permissions for each operation
const server = Deno.serve({
  port: 8000,
  handler: async (req) => {
    // Only request permissions when needed
    if (req.url.includes('/files')) {
      const status = await Deno.permissions.query({ name: "read", path: "./data" });
      if (status.state !== "granted") {
        return new Response("Insufficient permissions", { status: 403 });
      }
    }
    return new Response("Hello World");
  }
});

// Runtime permission management
async function secureFileOperation(path: string) {
  const permission = await Deno.permissions.query({ 
    name: "read", 
    path 
  });
  
  if (permission.state !== "granted") {
    const requested = await Deno.permissions.request({ 
      name: "read", 
      path 
    });
    
    if (requested.state !== "granted") {
      throw new Error("File read permission denied");
    }
  }
  
  return await Deno.readTextFile(path);
}
```

### API client design patterns

```typescript
// Layered architecture example
// domain/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

// repositories/user.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// services/user.ts
export class UserService {
  constructor(private userRepo: UserRepository) {}
  
  async getUser(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }
}
```

### Error handling and logging standards

```typescript
// Custom error classes
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Centralized error handler
export function errorHandler(error: unknown): Response {
  console.error("Error:", error);
  
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code
      }),
      { status: error.statusCode }
    );
  }
  
  return new Response("Internal Server Error", { status: 500 });
}
```

### Performance optimization

```typescript
// Dependency preloading
// deps.ts - Centralized dependency management
export { serve } from "jsr:@std/http@1.0.0/server";
export { oakCors } from "jsr:@oak/cors@1.0.0";
export { z } from "npm:zod@3.22.0";

// Pre-compile with: deno cache deps.ts

// Efficient streaming for large files
async function processLargeFile(path: string) {
  const file = await Deno.open(path);
  const reader = file.readable.getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Process chunk
      await processChunk(value);
    }
  } finally {
    reader.releaseLock();
    file.close();
  }
}
```

### TypeScript configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "lib": ["deno.ns", "deno.unstable", "dom"]
  }
}
```

### Module design principles

```typescript
// Export only what's needed
export { UserService } from "./services/user.ts";
export type { User } from "./domain/user.ts";

// Use barrel exports for cleaner imports
// mod.ts
export * from "./user.ts";
export * from "./auth.ts";
export * from "./utils.ts";
```

### Documentation standards

```typescript
/**
 * Creates a new user account
 * 
 * @param userData - User registration data
 * @returns Promise resolving to created user
 * 
 * @example
 * ```ts
 * const user = await createUser({
 *   name: "John Doe",
 *   email: "john@example.com"
 * });
 * ```
 */
export async function createUser(userData: UserData): Promise<User> {
  // Implementation
}
```

## Essential Resources

### Official documentation links with descriptions

- **[Deno Manual](https://docs.deno.com/)** - Comprehensive official documentation covering all aspects of Deno
- **[Deno API Reference](https://deno.land/api)** - Complete API reference for all built-in Deno APIs
- **[Standard Library](https://jsr.io/@std)** - Official standard library modules for common tasks
- **[Deno Deploy Docs](https://docs.deno.com/deploy/)** - Documentation for deploying Deno applications to the edge

### Community resources

- **[Deno Discord](https://discord.gg/deno)** - Active community chat for real-time help
- **[Deno Reddit](https://reddit.com/r/Deno)** - Community discussions and news
- **[Awesome Deno](https://github.com/denolib/awesome-deno)** - Curated list of Deno modules and resources
- **[Deno News](https://deno.news)** - Weekly newsletter with Deno updates

### Useful third-party modules for API work

```typescript
// Web Frameworks
import { Hono } from "jsr:@hono/hono";           // Ultrafast web framework
import { Application } from "jsr:@oak/oak";      // Middleware framework

// Database Connectivity
import { PostgresConnector } from "jsr:@db/postgres";
import { MongoClient } from "npm:mongodb";

// Validation
import { z } from "npm:zod";                     // Schema validation
import { validate } from "jsr:@std/validate";

// Authentication
import { jose } from "npm:jose";                 // JWT handling
import { bcrypt } from "jsr:@std/crypto";

// HTTP Utilities
import { retry } from "jsr:@std/async";          // Retry mechanisms
import { RateLimiter } from "jsr:@std/ratelimit";
```

### Learning paths

1. **Beginner Path**
   - Install Deno and run first script
   - Understand permissions model
   - Learn module imports and dependencies
   - Build simple HTTP server
   - Write first tests

2. **Intermediate Path**
   - Master TypeScript in Deno
   - Build REST APIs with error handling
   - Implement authentication
   - Set up CI/CD pipelines
   - Deploy to production

3. **Advanced Path**
   - Performance optimization
   - WebSocket and streaming
   - Microservices architecture
   - Custom tooling development
   - Contributing to Deno ecosystem

### Troubleshooting guides

#### Common Issues and Solutions

**Permission Errors**
```bash
# Issue: Network access denied
# Solution: Add network permission
deno run --allow-net main.ts

# Issue: File system access denied  
# Solution: Add specific file permissions
deno run --allow-read=./config --allow-write=./logs main.ts
```

**Import Resolution Issues**
```typescript
// Issue: Module not found
// Solution: Use explicit file extensions
import { helper } from "./utils/helper.ts"; // ✅
import { helper } from "./utils/helper";    // ❌

// Issue: Type errors with npm packages
// Solution: Add Node.js types
/// <reference types="npm:@types/node" />
```

**Migration from Node.js**
```typescript
// Before (Node.js)
const express = require('express');
const fs = require('fs');

// After (Deno)
import express from "npm:express";
import { readFile } from "jsr:@std/fs";
```

This comprehensive guide provides everything needed to master Deno development, from basic concepts to advanced production patterns. Whether you're new to Deno or transitioning from Node.js, this guide serves as both a learning resource and ongoing reference for building modern, secure applications with Deno's powerful runtime and toolchain.