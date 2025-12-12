.PHONY: compile-scss-windows compile-scss deploy-windows deploy

# Windows: requires 'sass' on PATH (Dart Sass or compatible)
compile-scss-windows:
	@sass src/scss:src/css

# Unix-like: uses local dev dependency
compile-scss:
	@node_modules/.bin/sass src/scss:src/css

# Windows deploy via PowerShell
deploy-windows: compile-scss-windows
	@pwsh -NoProfile -Command "Write-Host 'Deploying...'; \
		$targets = @('..\\..\\web', '..\\..\\src\\main\\resources\\static'); \
		foreach ($t in $targets) { \
			New-Item -Path $t -ItemType Directory -Force | Out-Null; \
			New-Item -Path (Join-Path $t 'assets') -ItemType Directory -Force | Out-Null; \
			Remove-Item -Path (Join-Path $t 'assets\\*') -Recurse -Force -ErrorAction SilentlyContinue; \
			Copy-Item -Path 'dist\\assets\\*' -Destination (Join-Path $t 'assets') -Recurse -Force; \
			Copy-Item -Path 'dist\\*' -Destination $t -Recurse -Force; \
		}; \
		Write-Host 'Deployed!'"

# Unix-like deploy
deploy: compile-scss
	@echo "Deploying..."
	@for target in ../../web ../../src/main/resources/static; do \
		mkdir -p "$$target"; \
		mkdir -p "$$target/assets"; \
		rm -rf "$$target/assets"/*; \
		cp -r dist/* "$$target/"; \
		done
	@echo "Deployed!"
