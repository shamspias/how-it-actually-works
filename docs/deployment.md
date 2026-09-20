# Publish the learning lab to Cloudflare

Public site: **[learn.algolyzerlab.com](https://learn.algolyzerlab.com)**.

The original [workers.dev address](https://how-it-actually-works.algolyzerlab.workers.dev) also serves the same application.

This project is a static React application. Cloudflare serves the HTML, JavaScript, CSS, fonts, and icons; the browser runs the simulations. There is no application backend, database, AI API, or server-side training process.

The [Wrangler configuration](../wrangler.jsonc) publishes only `dist/`, using [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/binding/). It deliberately has no Worker script entry point. The name “Workers” here identifies the hosting product; this deployment contains static files only.

## First publication

From the repository root:

```sh
make cloudflare-login
make deploy-check
make deploy
```

The login opens Cloudflare's authorization flow in your browser. Complete it using the account that owns the site and the active `algolyzerlab.com` zone. `make deploy-check` builds and validates the configuration without publishing. `make deploy` builds the current source and uploads the result. Wrangler prints the public addresses after a successful deployment.

The `routes` entry in `wrangler.jsonc` connects `learn.algolyzerlab.com` as a [Cloudflare Custom Domain](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/). Cloudflare creates the DNS record and HTTPS certificate for this hostname. The bare `algolyzerlab.com` domain and its other subdomains are not deployment targets.

For a fork in a different account, remove this `routes` entry to publish only to `https://how-it-actually-works.<your-subdomain>.workers.dev`, or replace it with a hostname and active zone you own. Do not reuse the project's custom domain in an unrelated account.

If more than one Cloudflare account is available, select the intended account or provide its ID for the command:

```sh
CLOUDFLARE_ACCOUNT_ID=your-account-id make deploy
```

Wrangler is pinned in the project's development dependencies. Credentials stay in Wrangler's login storage, outside the repository. For an automated deployment, supply `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` through the automation platform's secrets, not a tracked file. No automatic deployment workflow is enabled by this configuration.

## Later updates

```sh
make deploy
```

This updates the same named site and preserves the custom domain configured in `wrangler.jsonc`. The computer does not need to keep a local server running afterward. See [Cloudflare's static-site deployment guide](https://developers.cloudflare.com/workers/static-assets/get-started/).

## What to check after publishing

- Open the printed public URL and complete one Pip practice step; the first saved dial should become `1.4`.
- Open a chapter link such as `/#neural-network`, reload it, and switch all three learning modes.
- Confirm fonts and diagrams load, then check a narrow phone viewport.

Chapter navigation uses URL fragments, so the host receives a request for the root document and the browser chooses the lesson. No server router or catch-all rewrite is needed. Browser progress is stored per origin: progress from `localhost`, `127.0.0.1`, the public address, or a custom domain does not automatically transfer between them.

Only the generated build directory is uploaded. Source, tests, documentation screenshots, Git history, local environment files, and deployment credentials are not part of that upload.
