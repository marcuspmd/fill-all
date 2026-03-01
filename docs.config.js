/** @type {import('docs-kit').Config} */
export default {
  rootDir: "src",
  output: {
    site: "docs",   // used by `docs-kit build-site`
    docs: "docs-kit-md",     // used by `docs-kit build-docs`
  },
  include: [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx",
    "**/*.php",
    "**/*.py",
    "**/*.java",
    "**/*.go",
    "**/*.rs",
  ],
  exclude: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/out/**",
    "**/.next/**",
    "**/vendor/**",
    "**/__pycache__/**",
    "**/target/**",
    "**/.git/**",
    "**/coverage/**",
    "**/*.min.js",
    "**/*.bundle.js",
    "**/*.map",
    "**/*.d.ts",
    "**/package-lock.json",
    "**/yarn.lock",
    "**/pnpm-lock.yaml",
  ],
  respectGitignore: true,
  maxFileSize: 512_000,
  dbPath: ".docs-kit/index.db",
  promptRules: [],
  coverage: {
    lcovPath: "coverage/lcov.info",
    enabled: false,
  },
  docs: [
    {
      path: "README.md",
      title: "README",
      category: "Documentation",
      showOnMenu: true
    },
    {
      path: "./docs-md/",
      category: "Documentation",
      autoDiscovery: true,
      showOnMenu: true
    }
  ],
};
