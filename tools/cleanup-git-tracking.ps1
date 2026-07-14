$ErrorActionPreference = "Stop"

Write-Host "Çalışma ağacı kontrol ediliyor..."
git status --short

Write-Host "node_modules ve dist Git indeksinden çıkarılıyor (diskten silinmez)..."
git rm -r --cached --ignore-unmatch node_modules dist

git add .gitignore

Write-Host "Hazır. Sonucu kontrol et:"
git status --short
Write-Host "Kontrol sonrası commit önerisi:"
Write-Host 'git commit -m "Git takibini ve build çıktıları temizle"'
