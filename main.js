// main.js
document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const currentSlideEl = document.getElementById('current-slide');
  const totalValueEl = document.getElementById('total-value');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  // 管理画面で保存した設定を取得
  const scriptUrl = localStorage.getItem('scriptUrl');
  const threshold = parseFloat(localStorage.getItem('threshold'));
  // 未設定なら null にしておく
  const useThreshold = !isNaN(threshold);
  
  if (!scriptUrl) {
    statusEl.textContent = '管理画面でWebアプリURLを設定してください';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  let slides = [];
  let currentIndex = 0;

  // データフェッチ＆初期化
  async function fetchData() {
    try {
      const res = await fetch(scriptUrl);
      if (!res.ok) throw new Error(`ステータス ${res.status}`);
      slides = await res.json();
      if (!Array.isArray(slides) || slides.length === 0) {
        statusEl.textContent = 'スライドデータが見つかりません';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }
      statusEl.textContent = 'データ読み込み完了';
      updateSlide();
    } catch (err) {
      console.error(err);
      statusEl.textContent = `データ取得エラー: ${err.message}`;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
    }
  }

  // スライド更新
  function updateSlide() {
    const slide = slides[currentIndex];
    currentSlideEl.textContent = currentIndex + 1;
    // 合計を計算
    const total = slides.reduce((sum, s) => {
      const v = typeof s.value === 'number' ? s.value : parseFloat(s.value) || 0;
      return sum + v;
    }, 0);
    totalValueEl.textContent = total;
    // 閾値以上なら色を変える
    if (useThreshold && slide.value > threshold) {
      currentSlideEl.style.color = 'red';
    } else {
      currentSlideEl.style.color = '';
    }
  }

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateSlide();
    }
  });
  nextBtn.addEventListener('click', () => {
    if (currentIndex < slides.length - 1) {
      currentIndex++;
      updateSlide();
    }
  });

  fetchData();
});
