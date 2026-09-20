SHELL := /bin/sh
.DEFAULT_GOAL := help
.PHONY: help install run test check build preview browser examples cloudflare-login deploy deploy-check clean

help:
	@echo "make run      Start the interactive lab at http://127.0.0.1:5173"
	@echo "make test     Verify the learning calculations and standalone examples"
	@echo "make examples Run all the from-scratch JavaScript examples"
	@echo "make check    Typecheck, build, math tests, and desktop/mobile browser tests"
	@echo "make build    Produce the static site in dist/"
	@echo "make preview  Build and serve the production site"
	@echo "make cloudflare-login  Sign in to Cloudflare for publishing"
	@echo "make deploy-check     Build and validate the Cloudflare upload without publishing"
	@echo "make deploy           Build and publish the static site to Cloudflare"
	@echo "make clean    Remove generated build and test artifacts"

node_modules/.install-stamp: package.json package-lock.json
	@command -v node >/dev/null 2>&1 || { echo "Install Node.js 24 LTS, then run make run again."; exit 1; }
	npm ci
	@touch node_modules/.install-stamp

install: node_modules/.install-stamp

run: install
	npm run dev

test: install
	npm test
	npm run test:examples

examples: install
	npm run examples

browser: install
	npx playwright install chromium

check: browser
	npm run check

build: install
	npm run build

preview: build
	npm run preview

cloudflare-login: install
	npm run cloudflare:login

deploy-check: install
	npm run deploy:check

deploy: install
	npm run deploy

clean:
	rm -rf dist coverage playwright-report test-results
