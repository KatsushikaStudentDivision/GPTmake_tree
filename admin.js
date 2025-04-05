/* admin.js */
/*
  A-02～A-21 の各管理機能を実装。  
  バニラJavaScript (ES6+) で記述し、adminApp オブジェクトとして構成。
*/

// localStorage に "treeAppApiUrl" が未設定の場合、テスト用ダミーURLをセットする
if (!localStorage.getItem('treeAppApiUrl')) {
  localStorage.setItem('treeAppApiUrl', 'https://script.google.com/macros/s/AKfycbxRpPzgPCSeSY4C5BNgbcrDyt7KTy-P0Q_1cVUyhoLw_cucnzrLopJfycTV8Y0MWNf7HA/exec');
}

const adminApp = {
  apiUrl: localStorage.getItem('treeAppApiUrl') || '',
  config: null,
  init() {
    this.cacheElements();
    this.populateStageRows();
    this.populateStageSelector();
    this.attachEvents();
    this.loadConfig();
  },
  cacheElements() {
    this.elements = {
      apiUrlInput: document.getElementById('api-url'),
      saveApiUrlBtn: document.getElementById('save-api-url-btn'),
      maxMeetings: document.getElementById('max-meetings'),
      autoDistributeBtn: document.getElementById('auto-distribute-btn'),
      resetStagesBtn: document.getElementById('reset-stages-btn'),
      stagesTbody: document.getElementById('stages-tbody'),
      stageSelector: document.getElementById('stage-selector'),
      imageIdUrlInput: document.getElementById('image-id-url-input'),
      setIdUrlBtn: document.getElementById('set-id-url-btn'),
      imageUploadInput: document.getElementById('image-upload-input'),
      uploadImageBtn: document.getElementById('upload-image-btn'),
      imageGrid: document.getElementById('image-grid'),
      clearAllImagesBtn: document.getElementById('clear-all-images-btn'),
      pollingIntervalInput: document.getElementById('polling-interval'),
      languageSelect: document.getElementById('language-select'),
      debugModeCheckbox: document.getElementById('debug-mode'),
      exportSettingsBtn: document.getElementById('export-settings-btn'),
      importSettingsInput: document.getElementById('import-settings-input'),
      importSettingsBtn: document.getElementById('import-settings-btn'),
      historyList: document.getElementById('history-list'),
      rollbackBtn: document.getElementById('rollback-btn'),
      loader: document.getElementById('loader'),
      successMessage: document.getElementById('success-message'),
      adminErrorMessage: document.getElementById('admin-error-message'),
      previewBtn: document.getElementById('preview-btn'),
      homeBtn: document.getElementById('home-btn'),
      debugInfo: document.getElementById('debug-info'),
      saveSettingsBtn: document.getElementById('save-settings-btn'),
      saveStagesOnlyBtn: document.getElementById('save-stages-only-btn'),
      saveImagesOnlyBtn: document.getElementById('save-images-only-btn'),
      navButtons: document.querySelectorAll('.nav-btn'),
      contentSections: document.querySelectorAll('.content-section')
    };
  },
  attachEvents() {
    // API URL設定の保存（A-02）
    this.elements.saveApiUrlBtn.addEventListener('click', () => {
      const url = this.elements.apiUrlInput.value.trim();
      if (url) {
        localStorage.setItem('treeAppApiUrl', url);
        this.apiUrl = url;
        this.showSuccess('API URLが保存されました。');
      }
    });
    // サイドナビゲーションによる画面切替（A-01）
    this.elements.navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.getAttribute('data-target');
        this.activateSection(target);
      });
    });
    // 均等割り当て（A-05）
    this.elements.autoDistributeBtn.addEventListener('click', () => this.autoDistributeStages());
    // 初期値リセット（A-05）
    this.elements.resetStagesBtn.addEventListener('click', () => this.setupDefaultStages());
    // 画像設定（A-06）
    this.elements.setIdUrlBtn.addEventListener('click', () => this.setImageIdentifier());
    // 画像アップロード（A-07）
    this.elements.uploadImageBtn.addEventListener('click', () => this.uploadAndSaveImage());
    // 全画像クリア（A-09）
    this.elements.clearAllImagesBtn.addEventListener('click', () => this.clearAllImages());
    // プレビュー（A-13）
    this.elements.previewBtn.addEventListener('click', () => this.previewSettings());
    // メイン画面へ戻る（A-14）
    this.elements.homeBtn.addEventListener('click', () => window.location.href = 'index.html');
    // 設定保存
    this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    this.elements.saveStagesOnlyBtn.addEventListener('click', () => this.saveStagesOnly());
    this.elements.saveImagesOnlyBtn.addEventListener('click', () => this.saveImagesOnly());
  },
  activateSection(sectionId) {
    this.elements.contentSections.forEach(sec => {
      sec.hidden = sec.id !== sectionId;
    });
  },
  populateStageRows() {
    // 0～30段階の設定行を生成（A-04）
    let html = '';
    for (let i = 0; i <= 30; i++) {
      html += `<tr class="stage-row">
                <td>${i}</td>
                <td><input type="number" class="stage-input" data-stage="${i}" ${i === 0 ? 'readonly value="0"' : 'value="' + Math.floor(100 / 30 * i) + '"' }></td>
              </tr>`;
    }
    this.elements.stagesTbody.innerHTML = html;
  },
  populateStageSelector() {
    let options = '';
    for (let i = 0; i <= 30; i++) {
      options += `<option value="${i}">${i}</option>`;
    }
    this.elements.stageSelector.innerHTML = options;
  },
  showLoader() {
    this.elements.loader.hidden = false;
  },
  hideLoader() {
    this.elements.loader.hidden = true;
  },
  showSuccess(message) {
    this.elements.successMessage.textContent = message;
    this.elements.successMessage.hidden = false;
    setTimeout(() => { this.elements.successMessage.hidden = true; }, 3000);
  },
  showError(message) {
    this.elements.adminErrorMessage.textContent = message;
    this.elements.adminErrorMessage.hidden = false;
    setTimeout(() => { this.elements.adminErrorMessage.hidden = true; }, 5000);
  },
  loadConfig() {
    if (!this.apiUrl) {
      this.showError('API URLが設定されていません。');
      return;
    }
    this.showLoader();
    fetch(`${this.apiUrl}?action=getConfig`)
      .then(response => response.json())
      .then(data => {
        this.config = data;
        // 読み込んだ設定をUIに反映（A-03）
        if (data.stages) {
          const inputs = document.querySelectorAll('.stage-input');
          inputs.forEach(input => {
            const stage = input.getAttribute('data-stage');
            if (stage != 0 && data.stages[stage] !== undefined) {
              input.value = data.stages[stage];
            }
          });
        }
        if (data.images) {
          this.updateImageGrid(data.images);
        }
        if (data.pollingInterval) {
          this.elements.pollingIntervalInput.value = data.pollingInterval;
        }
        if (data.language) {
          this.elements.languageSelect.value = data.language;
        }
        this.hideLoader();
      })
      .catch(err => {
        console.error(err);
        this.showError('設定情報の取得に失敗しました。');
        this.hideLoader();
      });
  },
  autoDistributeStages() {
    const maxMeetings = parseInt(this.elements.maxMeetings.value, 10);
    const inputs = document.querySelectorAll('.stage-input');
    const stages = [];
    for (let i = 0; i <= 30; i++) {
      stages.push(i === 0 ? 0 : Math.floor(maxMeetings * i / 30));
    }
    inputs.forEach(input => {
      const stage = input.getAttribute('data-stage');
      input.value = stages[stage];
    });
    this.showSuccess('自動割り当てが完了しました。');
  },
  setupDefaultStages() {
    const inputs = document.querySelectorAll('.stage-input');
    inputs.forEach(input => {
      const stage = input.getAttribute('data-stage');
      if (stage != 0) {
        input.value = Math.floor(100 / 30 * stage);
      }
    });
    this.showSuccess('初期値にリセットしました。');
  },
  setImageIdentifier() {
    const stage = this.elements.stageSelector.value;
    const identifier = this.elements.imageIdUrlInput.value.trim();
    if (!this.config) this.config = {};
    if (!this.config.images) this.config.images = [];
    this.config.images[stage] = identifier;
    this.updateImageGrid(this.config.images);
    this.showSuccess(`段階 ${stage} の画像設定が保存されました。`);
  },
  updateImageGrid(images) {
    let html = '';
    for (let i = 0; i <= 30; i++) {
      const imgSrc = images && images[i] ? images[i] : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
      html += `<div class="image-item" data-stage="${i}">
                  <img src="${imgSrc}" alt="段階 ${i} の画像">
                  <span>段階 ${i}</span>
               </div>`;
    }
    this.elements.imageGrid.innerHTML = html;
  },
  uploadAndSaveImage() {
    const fileInput = this.elements.imageUploadInput;
    const file = fileInput.files[0];
    if (!file) {
      this.showError('ファイルが選択されていません。');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.showError('ファイルサイズが8MBを超えています。');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      const payload = {
        action: 'uploadImage',
        data: {
          base64: base64Data,
          mimeType: file.type,
          fileName: file.name,
          stage: this.elements.stageSelector.value
        }
      };
      this.showLoader();
      fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(response => response.json())
      .then(data => {
        if (data.fileId) {
          if (!this.config) this.config = {};
          if (!this.config.images) this.config.images = [];
          this.config.images[this.elements.stageSelector.value] = `https://drive.google.com/uc?id=${data.fileId}`;
          this.updateImageGrid(this.config.images);
          this.showSuccess('画像がアップロードされました。');
        } else {
          this.showError('画像アップロードに失敗しました。');
        }
        this.hideLoader();
      })
      .catch(err => {
        console.error(err);
        this.showError('画像アップロード中にエラーが発生しました。');
        this.hideLoader();
      });
    };
    reader.readAsDataURL(file);
  },
  clearAllImages() {
    if (confirm('全ての画像設定をクリアしますか？')) {
      if (!this.config) this.config = {};
      this.config.images = [];
      this.updateImageGrid(this.config.images);
      this.showSuccess('全ての画像設定がクリアされました。');
    }
  },
  previewSettings() {
    // A-13: リアルタイムプレビュー（メイン画面を別タブで開く例）
    window.open('index.html', '_blank');
  },
  saveSettings() {
    this.saveConfig('all');
  },
  saveStagesOnly() {
    this.saveConfig('stages');
  },
  saveImagesOnly() {
    this.saveConfig('images');
  },
  saveConfig(saveType = 'all') {
    if (!this.apiUrl) {
      this.showError('API URLが設定されていません。');
      return;
    }
    const stagesInputs = document.querySelectorAll('.stage-input');
    const stages = [];
    stagesInputs.forEach(input => {
      stages[input.getAttribute('data-stage')] = parseInt(input.value, 10);
    });
    const configToSave = {};
    if (saveType === 'all' || saveType === 'stages') {
      configToSave.stages = stages;
    }
    if (saveType === 'all' || saveType === 'images') {
      configToSave.images = this.config && this.config.images ? this.config.images : [];
    }
    configToSave.pollingInterval = parseInt(this.elements.pollingIntervalInput.value, 10);
    configToSave.language = this.elements.languageSelect.value;
    configToSave.debug = this.elements.debugModeCheckbox.checked;
    const payload = {
      action: 'saveConfig',
      data: configToSave
    };
    this.showLoader();
    fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
      this.showSuccess('設定が保存されました。');
      this.hideLoader();
    })
    .catch(err => {
      console.error(err);
      this.showError('設定保存に失敗しました。');
      this.hideLoader();
    });
  }
};

document.addEventListener('DOMContentLoaded', () => adminApp.init());
