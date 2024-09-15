document.addEventListener('DOMContentLoaded', async () => {
    const saveButton = document.getElementById('save');
    const languageSelect = document.getElementById('language');
    const outputFolderInput = document.getElementById('outputFolder');

    // Initialize i18next
    await initializeI18next();

    i18next.on('initialized', function(options) {
        updateUILanguage();
    });

    i18next.on('languageChanged', function(lng) {
        updateUILanguage();
    });

    // Load saved values
    chrome.storage.sync.get(['language', 'outputFolder'], (data) => {
        languageSelect.value = data.language || i18next.language;
        outputFolderInput.value = data.outputFolder || 'YouTube_Transcripts';
        i18next.changeLanguage(languageSelect.value);
    });

    // Save settings
    saveButton.addEventListener('click', () => {
        const language = languageSelect.value;
        const outputFolder = outputFolderInput.value || 'YouTube_Transcripts';

        chrome.storage.sync.set({ language, outputFolder }, () => {
            i18next.changeLanguage(language);
            const successMessage = document.createElement('div');
            successMessage.className = 'alert alert-success mt-3';
            successMessage.textContent = i18next.t('saveSuccess');
            document.body.appendChild(successMessage);
            setTimeout(() => successMessage.remove(), 3000);
        });
    });

    // Update language immediately when changed
    languageSelect.addEventListener('change', (event) => {
        i18next.changeLanguage(event.target.value);
    });
});

function updateUILanguage() {
    document.getElementById('settingsTitle').textContent = i18next.t('settingsTitle');
    document.getElementById('languageLabel').textContent = i18next.t('languageLabel');
    document.getElementById('outputFolderLabel').textContent = i18next.t('outputFolderLabel');
    document.getElementById('save').textContent = i18next.t('saveButton');
}