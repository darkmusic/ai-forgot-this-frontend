set shell := ["pwsh", "-c"]

deploy:
    @"Deploying..."
    @New-Item -Path "..\..\src\main\resources\static" -ItemType Directory -Force
    @New-Item -Path "..\..\src\main\resources\static\assets" -ItemType Directory -Force
    @Copy-Item -Path "dist\assets\*" -Destination "..\..\src\main\resources\static\assets" -Recurse -Force
    @Copy-Item -Path "dist\*" -Destination "..\..\src\main\resources\static\" -Force
    @"Deployed!"
