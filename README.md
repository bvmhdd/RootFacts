# Root Facts AI 🌿🤖

Sebuah aplikasi cerdas berbasis Progressive Web App (PWA) yang menggunakan **Computer Vision (TensorFlow.js)** untuk mendeteksi berbagai jenis sayuran secara langsung dari kamera, serta dilengkapi dengan **Generative AI (Transformers.js)** untuk menceritakan fakta-fakta unik, ilmiah, hingga lelucon seru mengenai sayuran yang dideteksi!

Aplikasi ini berjalan 100% secara lokal di dalam peramban (browser) pengguna tanpa perlu bergantung pada API eksternal atau koneksi internet terus-menerus.

## Fitur Utama ✨
1. **Deteksi Sayuran Real-Time**: Menggunakan model _Teachable Machine_ (Keras/Layers) yang diproses langsung oleh _TensorFlow.js_. Mendukung _fallback_ cerdas (WebGL/WebGPU ke CPU) agar kompatibel di semua perangkat.
2. **AI Fun Fact Generator**: Menghasilkan cerita dan fakta menarik tentang sayuran menggunakan model bahasa besar (LLM) `Xenova/flan-t5-small` melalui _Transformers.js_ versi WebAssembly (WASM).
3. **Kustomisasi Nada AI**: Pilihan gaya penceritaan yang fleksibel, mulai dari Normal, Profesional (Ilmiah), Lucu (Joke), hingga gaya cerita Anak-Anak.
4. **Offline Capability (PWA)**: Aplikasi dilengkapi dengan _Service Worker_ dan _Workbox_. Setelah kunjungan pertama, model AI seberat puluhan MB akan disimpan di memori dan aplikasi dapat digunakan sepenuhnya tanpa internet!

## Teknologi yang Digunakan 🛠️
- **Frontend**: React + Vite
- **Machine Learning**: TensorFlow.js (Deteksi Gambar) & Transformers.js (Generasi Teks NLP)
- **Offline / Caching**: Vite PWA Plugin (Workbox)
- **Styling**: Vanilla CSS dengan sentuhan UI/UX Modern

## Cara Menjalankan Secara Lokal 🚀

Pastikan Anda telah memasang **Node.js** di komputer Anda.

1. Lakukan _clone repository_ ini:
   ```bash
   git clone https://github.com/bvmhdd/RootFacts.git
   ```
2. Masuk ke direktori proyek:
   ```bash
   cd root-facts-react-starter
   ```
3. Pasang semua dependensi (_dependencies_):
   ```bash
   npm install
   ```
4. Jalankan _development server_:
   ```bash
   npm run dev
   ```
5. Buka `http://localhost:3000` (atau *port* yang tertera di terminal) di peramban Anda.

## Cara Mengganti Model Deteksi (Custom Model)
Anda dapat melatih model sayuran Anda sendiri menggunakan [Google Teachable Machine](https://teachablemachine.withgoogle.com/). 
1. Ekspor model Anda sebagai **TensorFlow.js (Keras/Layers)**.
2. Unduh dan ekstrak berkas `.zip`-nya.
3. Timpa (*replace*) berkas `model.json`, `weights.bin`, dan `metadata.json` lama di dalam folder `public/model/` dengan berkas milik Anda.
4. Muat ulang halaman, dan aplikasi akan menggunakan model baru Anda!

---
> _Proyek ini dibuat sebagai syarat kelulusan kelas Dicoding / Submission Machine Learning Berbasis Web._
