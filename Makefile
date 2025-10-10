SHELL := bash

.PHONY: compile-scss-windows compile-scss deploy-windows deploy

# Windows: requires 'sass' on PATH (Dart Sass or compatible)
compile-scss-windows:
	@sass src/scss:src/css

# Unix-like: uses local dev dependency
compile-scss:
	@node_modules/.bin/sass src/scss:src/css

# Windows deploy via PowerShell (mirrors Justfile behavior)
deploy-windows: compile-scss-windows
	@pwsh -NoProfile -Command "Write-Host 'Deploying...'; \
		New-Item -Path '..\..\web' -ItemType Directory -Force | Out-Null; \
		New-Item -Path '..\..\web\assets' -ItemType Directory -Force | Out-Null; \
		Copy-Item -Path 'dist\assets\*' -Destination '..\..\web\assets' -Recurse -Force; \
		Copy-Item -Path 'dist\*' -Destination '..\..\web\' -Force; \
		Write-Host 'Deployed!'"

# Unix-like deploy
deploy: compile-scss
	@echo "Deploying..."
	@mkdir -p ../../web
	@mkdir -p ../../web/assets
	@cp -r dist/* ../../web/
	@echo "Deployed!"
