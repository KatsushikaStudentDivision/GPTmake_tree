/* main.js */
/*
  F-01～F-11, F-12 (言語切替), F-13 (利用統計表示)
  バニラJavaScript (ES6+) を利用。  
  ※API URLはローカルストレージから取得（セキュリティリスク N-03 参照）。
*/
// localStorage に "treeAppApiUrl" が未設定の場合、テスト用ダミーURLをセットする
if (!localStorage.getItem('treeAppApiUrl')) {
  localStorage.setItem('treeAppApiUrl', 'https://script.google.com/macros/s/AKfycbxRpPzgPCSeSY4C5BNgbcrDyt7KTy-P0Q_1cVUyhoLw_cucnzrLopJfycTV8Y0MWNf7HA/exec');
}

const treeApp = {
  apiUrl: localStorage.getItem('treeAppApiUrl') || '',
  pollingInterval: 30000, // 初期値30秒（F-04, A-17）
  config: null,
  currentStage: 0,
  totalValue: 0,
  recentProgress: 0,
  retryCount: 0,
  init() {
    this.cacheElements();
    this.attachEvents();
    this.loadConfig();
    this.startPolling();
  },
  cacheElements() {
    this.elements = {
      stageDisplay: document.getElementById('stage-display'),
      totalValueDisplay: document.getElementById('total-value-display'),
      progressBar: document.getElementById('progress-bar'),
      recentProgress: document.getElementById('recent-progress'),
      treeImage: document.querySelector('.tree-image'),
      loading: document.getElementById('loading'),
      errorMessage: document.getElementById('error-message')
    };
  },
  attachEvents() {
    // 言語切替等必要なイベントがあればここに追加
  },
  showLoading() {
    this.elements.loading.hidden = false;
  },
  hideLoading() {
    this.elements.loading.hidden = true;
  },
  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.hidden = false;
    // エラー発生時、画面が赤く点滅（視覚的フィードバック）
    document.body.classList.add('error-flash');
    setTimeout(() => document.body.classList.remove('error-flash'), 500);
  },
  hideError() {
    this.elements.errorMessage.hidden = true;
  },
  loadConfig() {
    if (!this.apiUrl) {
      this.showError('API URLが設定されていません。管理画面で設定してください。');
      return;
    }
    this.showLoading();
    fetch(`${this.apiUrl}?action=getConfig`)
      .then(response => response.json())
      .then(data => {
        this.config = data;
        if (data.pollingInterval) this.pollingInterval = data.pollingInterval * 1000;
        // 言語切替（F-12）の設定もここで反映可能
        this.hideLoading();
      })
      .catch(err => {
        console.error(err);
        this.showError('設定情報の取得に失敗しました。');
        this.hideLoading();
      });
  },
  fetchData() {
    if (!this.apiUrl) return;
    fetch(`${this.apiUrl}?action=getData`)
      .then(response => response.json())
      .then(data => {
        this.totalValue = data.totalValue || 0;
        this.currentStage = this.calculateStage(this.totalValue);
        this.recentProgress = data.recentProgress || 0;
        this.updateDisplay();
        // F-03: 新しい交流データで成長アニメーション開始
        if (data.newDataAdded) {
          this.startGrowthAnimation();
        }
      })
      .catch(err => {
        console.error(err);
        this.showError('データ取得に失敗しました。');
      });
  },
  calculateStage(total) {
    // F-10: config.stages（閾値配列）を元に成長段階を計算
    if (!this.config || !this.config.stages) return 0;
    let stage = 0;
    for (let i = 0; i < this.config.stages.length; i++) {
      if (total >= this.config.stages[i]) {
        stage = i;
      } else {
        break;
      }
    }
    return stage;
  },
  updateDisplay() {
    this.elements.stageDisplay.textContent = `段階: ${this.currentStage}`;
    this.elements.totalValueDisplay.textContent = `交流回数: ${this.totalValue}`;
    if (this.config && this.config.stages && this.currentStage < this.config.stages.length - 1) {
      const currentThreshold = this.config.stages[this.currentStage];
      const nextThreshold = this.config.stages[this.currentStage + 1];
      const progressPercent = ((this.totalValue - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
      this.elements.progressBar.value = Math.min(Math.max(progressPercent, 0), 100);
    } else {
      this.elements.progressBar.value = 100;
    }
    this.elements.recentProgress.textContent = `直近の進捗: ${this.recentProgress}回`;
    this.updateTreeImage();
  },
  getImageUrl(stage) {
    // F-02, F-07: 各段階の画像URL/Drive IDを返す。設定がなければ白画像を返す。
    if (this.config && this.config.images && this.config.images[stage]) {
      return this.config.images[stage];
    }
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  },
  updateTreeImage() {
    const imageUrl = this.getImageUrl(this.currentStage);
    const img = this.elements.treeImage;
    img.classList.remove('active');
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = imageUrl;
      setTimeout(() => img.classList.add('active'), 100);
    };
    tempImg.onerror = () => {
      if (this.retryCount < 3) {
        this.retryCount++;
        setTimeout(() => this.updateTreeImage(), 1000);
      } else {
        img.src = this.getImageUrl(-1);
        this.showError('画像読み込みに失敗しました。');
      }
    };
    tempImg.src = imageUrl;
  },
  startGrowthAnimation() {
    // F-03: 成長時のフェードイン/アウトアニメーション
    const img = this.elements.treeImage;
    img.classList.remove('active');
    setTimeout(() => img.classList.add('active'), 100);
    // マイルストーン達成時の特別エフェクト
    if ([5, 10, 15, 20, 25, 30].includes(this.currentStage)) {
      alert(`おめでとうございます！ マイルストーン ${this.currentStage} 達成！`);
    }
  },
  startPolling() {
    this.fetchData();
    setInterval(() => {
      this.fetchData();
    }, this.pollingInterval);
  }
};

document.addEventListener('DOMContentLoaded', () => treeApp.init());
