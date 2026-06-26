/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

function patchWorkflow(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Swap Setup Node.js and Install pnpm, and add cache: 'pnpm'
  const oldNodePnpm = `      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9`;

  const newNodePnpm = `      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'`;

  content = content.split(oldNodePnpm).join(newNodePnpm);

  // 2. Next.js cache before "Build Next.js"
  const nextBuildTarget = `      - name: Build Next.js
        run: pnpm run build`;

  const nextCacheAndBuild = `      - name: Cache Next.js build
        uses: actions/cache@v4
        with:
          path: .next/cache
          key: \${{ runner.os }}-nextjs-\${{ hashFiles('**/pnpm-lock.yaml') }}-\${{ hashFiles('**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx') }}
          restore-keys: |
            \${{ runner.os }}-nextjs-\${{ hashFiles('**/pnpm-lock.yaml') }}-

      - name: Build Next.js
        run: pnpm run build`;

  content = content.split(nextBuildTarget).join(nextCacheAndBuild);

  // 3. Playwright browser cache before "Install Playwright Browsers"
  const playwrightTarget = `      - name: Install Playwright Browsers
        run: pnpm exec playwright install --with-deps`;

  const playwrightCache = `      - name: Cache Playwright Browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: \${{ runner.os }}-playwright-\${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            \${{ runner.os }}-playwright-

      - name: Install Playwright Browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: pnpm exec playwright install --with-deps
        
      - name: Install Playwright Dependencies
        if: steps.playwright-cache.outputs.cache-hit == 'true'
        run: pnpm exec playwright install-deps`;

  content = content.split(playwrightTarget).join(playwrightCache);

  fs.writeFileSync(filePath, content);
  console.log('Patched', filePath);
}

patchWorkflow('.github/workflows/staging.yml');
patchWorkflow('.github/workflows/production.yml');

