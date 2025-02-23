set shell := ["pwsh", "-c"]

deploy:
    @"Deploying..."
    @& Copy-Item -Path "dist\assets\*" -Destination "..\ai-forgot-these-cards\src\main\resources\static\assets" -Recurse -Force
    @& Copy-Item -Path "dist\*" -Destination "..\ai-forgot-these-cards\src\main\resources\static\" -Force
    @"Deployed!"
