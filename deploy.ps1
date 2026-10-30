<#
    GitHub Pages uchun deploy skripti
    ---------------------------------
    ISHLATISH:
        .\deploy.ps1 -Owner "sizning-username" -Token "ghp_xxxxx"

    Tokenni faylga YOZMANG va git'ga qo'shmang.
    Yangi token: https://github.com/settings/tokens  (scope: repo)
#>

param(
    [Parameter(Mandatory = $true)][string]$Owner,
    [Parameter(Mandatory = $true)][string]$Token,
    [string]$Repo = "uzbek-translator",
    [string]$Branch = "main",
    [string]$CommitMessage = "Yangi alifboga mos tarjimon ilovasi va fayl o'giruvchi"
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Step($n, $text) { Write-Host "`n[$n] $text" -ForegroundColor Cyan }

# ------------------------------------------------------------------
Step 1 "Eski git tarixini tozalash"
if (Test-Path ".git") { Remove-Item -Recurse -Force ".git" }

# ------------------------------------------------------------------
Step 2 "Git'ni qayta boshlash va '$Branch' filialini ochish"
git init | Out-Null
git checkout -b $Branch

# ------------------------------------------------------------------
Step 3 "Fayllarni qo'shish (shaxsiy .xlsx fayllar .gitignore bilan chetlab o'tiladi)"
git add -A
git status --short

# ------------------------------------------------------------------
Step 4 "Commit"
if (-not (git config user.email)) { git config user.email "deploy@localhost" }
if (-not (git config user.name))  { git config user.name  "Deploy Bot" }
git commit -m $CommitMessage

# ------------------------------------------------------------------
Step 5 "Remote bilan bog'lash"
git remote remove origin 2>$null
# Token faqat shu buyruq davomida ishlatiladi, .git/config ga yozilmaydi
$env:GIT_ASKPASS = ""
$remote = "https://$Owner`:$Token@github.com/$Owner/$Repo.git"
git remote add origin "https://github.com/$Owner/$Repo.git"
git -c http.extraHeader="Authorization: Basic $([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$Owner`:$Token")))" `
    push -u origin $Branch --force

# ------------------------------------------------------------------
Step 6 "Tekshiruv"
git -c http.extraHeader="Authorization: Basic $([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$Owner`:$Token")))" `
    ls-remote --heads origin

Write-Host "`nBajarildi. Endi GitHub'da: Settings -> Pages -> Branch: $Branch / root" -ForegroundColor Green
