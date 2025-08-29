set shell := ["pwsh", "-c"]

compile-scss:
    @& sass src/scss:src/css

deploy: compile-scss
    @"Deploying..."
    @New-Item -Path "..\..\web" -ItemType Directory -Force
    @New-Item -Path "..\..\web\assets" -ItemType Directory -Force
    @Copy-Item -Path "dist\assets\*" -Destination "..\..\web\assets" -Recurse -Force
    @Copy-Item -Path "dist\*" -Destination "..\..\web\" -Force
    @"Deployed!"
