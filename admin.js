// admin.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settings-form');
  const scriptUrlInput = document.getElementById('script-url');
  const thresholdInput = document.getElementById('threshold');
  const imagesInput = document.getElementById('images');
  const statusEl = document.getElementById('form-status');

  // 既存設定を読み込む
  scriptUrlInput.value = localStorage.getItem('scriptUrl') || '';
  thresholdInput.value = localStorage.getItem('threshold') || '';
  imagesInput.value = localStorage.getItem('images') || '[]';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = scriptUrlInput.value.trim();
    const th = thresholdInput.value.trim();
    let imgs;
    // 画像URLリストの妥当性チェック
    try {
      imgs = JSON.parse(imagesInput.value.trim() || '[]');
      if (!Array.isArray(imgs)) throw new Error();
    } catch {
      statusEl.textContent = '画像URLはJSON配列で入力してください';
      statusEl.style.color = 'red';
      return;
    }
    localStorage.setItem('scriptUrl', url);
    localStorage.setItem('threshold', th);
    localStorage.setItem('images', JSON.stringify(imgs));
    statusEl.textContent = '設定を保存しました';
    statusEl.style.color = 'green';
  });
});
