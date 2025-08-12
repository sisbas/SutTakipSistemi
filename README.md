# 🥛 Süt Takip Sistemi

Modern süt üretimi takip ve raporlama sistemi. PWA (Progressive Web App) teknolojisi ile geliştirilmiş, offline çalışabilen, mobil uyumlu bir web uygulaması.

## ✨ Özellikler

### 📊 Veri Yönetimi
- Köy bazında süt üretimi kaydı
- Müstahsil (üretici) bazında takip
- Sabah/Akşam öğün ayrımı
- Yağ oranı, protein oranı, sıcaklık takibi
- Tarih bazlı filtreleme

### 📈 Raporlama & Analiz
- Günlük, haftalık, aylık istatistikler
- Trend grafikleri
- Köy bazında karşılaştırma
- CSV/Excel export
- PDF rapor oluşturma
- Yazdırma desteği

### 📱 PWA Özellikleri
- Offline çalışabilme
- Ana ekrana ekleme
- Push notification desteği
- Service Worker ile cache yönetimi
- Responsive tasarım

### 🔧 Teknik Özellikler
- Vanilla JavaScript (framework bağımsız)
- LocalStorage ile veri persistence
- Airtable API entegrasyonu
- Modern CSS Grid/Flexbox
- Dark mode desteği

## 🚀 Netlify'ye Deploy Etme

### Yöntem 1: Drag & Drop
1. Tüm dosyaları bir klasöre çıkarın
2. [Netlify Dashboard](https://app.netlify.com/)'a gidin
3. "Sites" bölümüne klasörü sürükle-bırak yapın
4. Otomatik deploy başlayacak

### Yöntem 2: Git Repository
1. Dosyaları GitHub repository'sine yükleyin
2. Netlify'de "New site from Git" seçin
3. Repository'yi bağlayın
4. Build settings:
   - Build command: `echo "Static site"`
   - Publish directory: `/`

### Yöntem 3: Netlify CLI
```bash
# Netlify CLI kurulumu
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=.
```

## 📁 Dosya Yapısı

```
sut-takip-sistemi/
├── index.html              # Ana sayfa (veri girişi)
├── raporlar.html           # Rapor sayfası
├── manifest.json           # PWA manifest
├── service-worker.js       # Service Worker
├── netlify.toml           # Netlify yapılandırma
├── _redirects             # URL yönlendirmeleri
├── README.md              # Bu dosya
└── icons/                 # Uygulama ikonları
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-384.png
    ├── icon-512.png
    └── favicon.ico
```

## ⚙️ Yapılandırma

### Airtable API Ayarları
1. Netlify panelinde aşağıdaki ortam değişkenlerini tanımlayın:
   - `AIRTABLE_PAT`: Airtable Personal Access Token
   - `AIRTABLE_BASE_ID`: Airtable Base ID

2. `index.html` ve `raporlar.html` dosyalarında yalnızca tablo adlarını tanımlayın:
```javascript
TABLO_YAPISI: {
  "Köy 1": { tablo: "your_table_name" }
  // ...
}
```

3. İstemciden yapılacak isteklerde sadece tablo adını geçin. Örnek bir kayıt isteği:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"records":[{"fields":{"Ad":"Örnek"}}]}' \
  /.netlify/functions/airtable?table=your_table_name
```

`AIRTABLE_BASE_ID` değeri sunucu tarafında kullanılır ve istemciden gönderilmez.

### Custom Domain
Netlify'de custom domain ayarlamak için:
1. Site Settings > Domain management
2. "Add custom domain" butonuna tıklayın
3. Domain'inizi girin ve DNS ayarlarını yapın

## 🔒 Güvenlik

### Environment Variables
Hassas bilgileri Netlify environment variables ile saklayın:
1. Site Settings > Environment variables
2. Yeni variable ekleyin:
   - `AIRTABLE_PAT`
   - `AIRTABLE_BASE_ID`

### HTTPS
Netlify otomatik olarak HTTPS sağlar. Custom domain için Let's Encrypt sertifikası otomatik oluşturulur.

## 📱 PWA Yükleme

### Android
1. Chrome'da siteyi açın
2. Menu > "Add to Home screen"
3. Uygulama ana ekranınıza eklenir

### iOS
1. Safari'de siteyi açın
2. Share butonu > "Add to Home Screen"
3. Uygulama ana ekranınıza eklenir

### Desktop
1. Chrome'da siteyi açın
2. Adres çubuğundaki install ikonu
3. "Install" butonuna tıklayın

## 🔧 Geliştirme

### Local Development
```bash
# Python ile local server
python -m http.server 8000

# Node.js ile
npx serve .

# PHP ile
php -S localhost:8000
```

### Build Process
Bu statik bir site olduğu için build process gerektirmez. Ancak production için:

1. Dosyaları minify edin
2. Görselleri optimize edin
3. Critical CSS inline yapın

## 📊 Analytics

Netlify Analytics otomatik olarak aktiftir. Ayrıca Google Analytics eklemek için:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🐛 Troubleshooting

### Common Issues

**1. PWA yüklenmiyor**
- HTTPS kontrolü yapın
- manifest.json dosyasını kontrol edin
- Service Worker registration kontrolü

**2. Offline çalışmıyor**
- Service Worker active mi kontrol edin
- Network tab'da cache kontrolü
- Console'da hata mesajları

**3. Airtable bağlantı hatası**
- API token kontrolü (`HTTP 401`)
- Token yetkileri ve Base ID erişimi (`HTTP 403`)
- Base ID ve tablo isimleri

**4. Mobile responsive problems**
- Viewport meta tag kontrolü
- CSS media queries
- Touch events

### Debug Kommandları

```javascript
// Service Worker durumu
navigator.serviceWorker.getRegistrations().then(console.log);

// Cache durumu
caches.keys().then(console.log);

// Local storage
console.log(localStorage.getItem('sutVerileri'));
```

## 📄 Lisans

Apache License 2.0 - Detaylar için `LICENSE` dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📞 Destek

- 📧 Email: sisbas@yahoo.com

## 📈 Versioning

- **v1.0.0** - Initial release
- **v2.0.0** - PWA features, improved UI
- **v2.1.0** - Netlify optimization, better offline support

---

Made with ❤️ for dairy farmers
