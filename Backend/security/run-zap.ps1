param(
    [string]$ZapImage = 'ghcr.io/zaproxy/zaproxy:stable'
)

$securityDirectory = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$reportDirectory = Join-Path $securityDirectory 'reports'
New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null

# This scan intentionally excludes account-creating or emergency-creating routes.
# Run it against a disposable local/staging backend, never live incident traffic.
docker run --rm `
    -v "${securityDirectory}:/zap/wrk" `
    $ZapImage zap-api-scan.py `
    -t /zap/wrk/openapi.yaml -f openapi -r /zap/wrk/reports/api-scan.html

exit $LASTEXITCODE
