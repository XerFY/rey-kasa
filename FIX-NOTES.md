# REY KASA — Uygulanan İlk Düzeltmeler

## Uygulandı

- `firestore.rules` Print Bridge akışına göre sıkılaştırıldı.
- PWA yalnızca deterministik `printJobs/{transactionId}` belgesini ilk kez oluşturabilir.
- PWA print job güncelleyemez veya silemez.
- PWA yalnızca bağlı `job-created-{transactionId}` oluşturma logunu yazabilir.
- `printLogs` istemci okuma/güncelleme/silmeye kapatıldı.
- `bridgeStatus` istemci erişimine tamamen kapatıldı.
- Print job payload, başlangıç durumu, kullanıcı kimliği, printer ID ve transaction varlığı kurallarda doğrulanır.
- `printerQueueService.ts` içindeki oluşturma loguna `createdBy` eklendi.
- `.gitignore` UTF-8 olarak yeniden yazıldı ve servis hesabı dosyaları korumaya alındı.
- `tools/cleanup-git-tracking.ps1` eklendi.

## Doğrulama

Temiz bağımlılık kurulumu ile:

```text
npm ci
npm run build
```

başarıyla tamamlandı. TypeScript ve Vite production build hatası yoktur.

Vite yalnızca ana JavaScript paketinin 500 kB üstünde olduğuna dair performans uyarısı verdi; bu çalışmayı engelleyen bir hata değildir.

## Bilgisayarda uygulanacak komutlar

Önce mevcut klasörün ayrıca yedeğini alın. Ardından proje klasöründe:

```powershell
npm ci
npm run build
firebase deploy --only firestore:rules
```

Git'te yanlış takip edilen klasörleri temizlemek için:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\cleanup-git-tracking.ps1
```

Bu betik `node_modules` ve `dist` klasörlerini bilgisayardan silmez; yalnız Git indeksinden çıkarır.

## Henüz yapılamayan

Yüklenen ZIP içinde `bridge/` klasörü ve .NET kaynakları bulunmadığı için Bridge restore/build/install işlemleri bu pakette yapılamadı. Ayrı çalışma kopyasındaki `bridge/` klasörünün ayrıca projeye eklenmesi gerekir.

Gerçek KODDATA KDP95 Windows kuyruk adı, servis hesabı, IAM ve fiziksel RAW ESC/POS testi hâlâ gerçek dükkân bilgisayarında tamamlanmalıdır.
