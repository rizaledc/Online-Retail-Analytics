# Online Retail Analytics Dashboard

Proyek ini adalah sebuah dasbor interaktif yang dibangun untuk memvisualisasikan hasil analisis data dari dataset e-commerce berskala besar. Melalui pendekatan data sains, dasbor ini menyajikan wawasan mendalam mulai dari kinerja penjualan historis, segmentasi loyalitas pelanggan, deteksi anomali pada tingkat pembatalan pesanan, hingga proyeksi pertumbuhan bisnis di masa depan.

## Tech Stack
- HTML, CSS (Vanilla)
- JavaScript (ES6 Modules)
- Chart.js (Data Visualization)
- Prophet (Time Series Forecasting)
- Scikit-learn (Agglomerative Clustering)
- Pandas (Data Processing)

## Modul Analisis
- **Exploratory Data Analysis (EDA)**: Tinjauan komprehensif performa pendapatan bulanan, distribusi harga unit, dan analisis geografi penjualan.
- **RFM Segmentation**: Analisis Recency, Frequency, dan Monetary untuk membagi pelanggan ke dalam segmen perilaku (Champions, At-Risk, dll).
- **Agglomerative Clustering**: Pengelompokan algoritmik untuk mengidentifikasi 4 klaster hierarkis utama (High-Value, Loyal Active, Occasional, Dormant).
- **Anomaly Detection**: Analisis pola tingkat pembatalan transaksi (*cancellation rate*) per negara dan tren waktunya.
- **Time Series Forecasting**: Proyeksi performa bisnis 6 bulan ke depan (metrik Revenue, Quantity, Transactions) menggunakan model peramalan Meta Prophet.

## How to Run Locally
Dasbor ini adalah *Single Page Application* statis. Anda dapat menjalankannya dengan mudah:
1. Jalankan menggunakan ekstensi **Live Server** di VS Code.
2. Atau cukup buka berkas `index.html` langsung di *browser* modern pilihan Anda.
3. Pastikan `dashboard_data.json` berada pada direktori yang sama dengan `index.html`.

## Dataset Information
- **Sumber Data**: Online Retail Dataset (UCI Machine Learning Repository)
- **Konteks Dataset**: Transaksi toko ritel e-commerce berbasis di UK
- **Periode Data**: Desember 2010 – November 2011

## Author
**Kelompok 1** — Telkom University — Data Science
