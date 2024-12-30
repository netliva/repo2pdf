module.exports = {
  cli: {
    description: 'Git repoları veya yerel dizinlerdeki kaynak kodlarını PDF formatına dönüştürme aracı',
    arguments: {
      source: 'Git repo URL\'i veya yerel dizin yolu',
      output: 'Çıktı PDF dosyasının yolu'
    },
    options: {
      theme: 'PDF teması (açık/koyu)',
      langFilter: 'Dahil edilecek dosya uzantıları (örn: js,py,java)',
      lineNumbers: 'Satır numaralarını göster',
      gitHistory: 'Git commit geçmişini dahil et',
      metadata: 'Dosya metadata bilgilerini göster (boyut ve son değişiklik tarihi)',
      commitInfo: 'Dosya commit bilgilerini göster (son commit ve yazar)',
      exclude: 'Hariç tutulacak desenler (virgülle ayrılmış)',
      maxSize: 'Maksimum dosya boyutu (KB)',
      progress: 'İlerleme göstergesini göster',
      language: 'Arayüz dili (en/tr)'
    },
    messages: {
      starting: '🚀 Dönüştürme işlemi başlatılıyor...',
      processing: 'İşleniyor: %{percent} ({current}/{total} dosya)',
      success: '✨ PDF başarıyla oluşturuldu: {output}',
      error: '❌ Hata: {message}',
      languageChanged: '🌐 Arayüz dili değiştirildi: {language}',
      languageNotSupported: '⚠️ {language} dili desteklenmiyor. Varsayılan olarak İngilizce kullanılıyor.'
    }
  },
  progress: {
    processing: '📄 Dosya İşleniyor'
  },
  pdf: {
    title: 'Kod Dokümantasyonu',
    tableOfContents: 'İçindekiler',
    gitHistory: 'Git Commit Geçmişi',
    metadata: {
      source: 'Kaynak',
      generated: 'Oluşturulma Tarihi',
      size: 'Boyut',
      lastModified: 'Son Değişiklik',
      lastCommit: 'Son Commit',
      author: 'Yazar',
      commit: 'Commit',
      date: 'Tarih',
      message: 'Mesaj'
    },
    minifiedContent: '⚠️ Bu dosya sıkıştırılmış/minify edilmiş içeriğe sahiptir. Okunabilirlik için renklendirme atlanmıştır.'
  }
}; 