Write-Output "=== STRUCT ==="

Get-ChildItem -Recurse | Where-Object { 
    $_.FullName -notmatch 'node_modules|\.next|dist|\.git|\.vscode|package-lock\.json' 
} | ForEach-Object {
    $path = $_.FullName.Replace((Get-Location).Path, "")
    Write-Output $path
}

Write-Output "`n=== FILES ==="

$files = @(
    "docker-compose.yml",
    "nginx/nginx.conf",
    "backend/Dockerfile",
    "backend/.dockerignore",
    "frontend/Dockerfile",
    "frontend/Dockerfile.prebuild",
    "frontend/next.config.js",
    ".env.example"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Output "`n--- FILE: $file ---"
        Get-Content $file
    }
}