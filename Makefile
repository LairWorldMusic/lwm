.PHONY: help install dev build dist clean lint format

help:
	@echo "Voicemod VST3 Audio Processor - Available commands:"
	@echo ""
	@echo "  make install      Install dependencies"
	@echo "  make dev          Start development environment"
	@echo "  make build        Build for production"
	@echo "  make dist         Build distributables with electron-builder"
	@echo "  make dist-dev     Build portable dev version"
	@echo "  make clean        Clean build artifacts"
	@echo "  make lint         Run ESLint"
	@echo "  make format       Format code with Prettier (if available)"
	@echo ""

install:
	npm install

dev:
	npm start

build:
	npm run build

dist:
	npm run dist

dist-dev:
	npm run dist:dev

clean:
	rm -rf dist build release out node_modules

lint:
	npx eslint src --ext .js,.jsx

format:
	@command -v prettier >/dev/null 2>&1 && npx prettier --write src || echo "Prettier not installed"
