set shell := ["pwsh", "-c"]

deploy:
    @"Deploying..."
    @& Copy-Item -Path "dist\assets\*" -Destination "..\..\src\main\resources\static\assets" -Recurse -Force
    @& Copy-Item -Path "dist\*" -Destination "..\..\src\main\resources\static\" -Force
    @"Deployed!"
