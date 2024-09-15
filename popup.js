let currentTab;

function getVideoId(url) {
    const urlObject = new URL(url);
    if (urlObject.hostname === 'www.youtube.com' || urlObject.hostname === 'youtube.com') {
        return urlObject.searchParams.get('v');
    }
    return null;
}

function saveAndDisplayTranscript(videoId, transcript) {
    chrome.storage.local.set({[videoId]: transcript}, function() {
        if (chrome.runtime.lastError) {
            console.error('Error saving transcript:', chrome.runtime.lastError);
            showAlert(i18next.t('errorSavingTranscript'), 'danger');
        } else {
            console.log('Transcript saved successfully');
        }
    });

    const transcriptElement = document.getElementById('transcript');
    transcriptElement.textContent = transcript;
    document.getElementById('transcriptSection').classList.remove('d-none');
}

function updateUILanguage() {
    const elements = {
        'extensionTitle': i18next.t('extensionName'),
        'transcriptTitle': i18next.t('transcriptTitle'),
        'downloadBtn': i18next.t('downloadTranscript'),
        'copyTranscriptBtn': i18next.t('copyTranscript')
    };

    for (const [id, text] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'downloadBtn' || id === 'copyTranscriptBtn') {
                const span = element.querySelector('span');
                if (span) {
                    span.textContent = text;
                }
            } else {
                element.textContent = text;
            }
        } else {
            console.warn(`Element with id "${id}" not found`);
        }
    }
}

function getCurrentTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            resolve(tabs[0]);
        });
    });
}

function checkExistingTranscript(videoId) {
    chrome.storage.local.get(videoId, function(result) {
        if (chrome.runtime.lastError) {
            console.error('Error checking for existing transcript:', chrome.runtime.lastError);
            showAlert(i18next.t('errorCheckingTranscript'), 'danger');
        } else if (result[videoId]) {
            console.log('Existing transcript found');
            displayTranscript(result[videoId]);
            showAlert(i18next.t('existingTranscriptFound'), 'info');
        } else {
            console.log('No existing transcript found');
        }
    });
}

function displayTranscript(transcript) {
    const transcriptElement = document.getElementById('transcript');
    if (transcriptElement) {
        transcriptElement.textContent = transcript;
        document.getElementById('transcriptSection').classList.remove('d-none');
    } else {
        console.error('Transcript element not found');
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM fully loaded');

    try {
        currentTab = await getCurrentTab();
        console.log('Current tab set:', currentTab);
    } catch (error) {
        console.error('Error getting current tab:', error);
        showAlert(i18next.t('errorGettingTab'), 'danger');
    }

    const toggleTranscriptBtn = document.getElementById('toggleTranscriptBtn');
    const transcriptContent = document.getElementById('transcriptContent');

    if (toggleTranscriptBtn && transcriptContent) {
        toggleTranscriptBtn.addEventListener('click', function() {
            transcriptContent.classList.toggle('show');
            const icon = toggleTranscriptBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-chevron-up');
                icon.classList.toggle('fa-chevron-down');
            }
        });
    }

    try {
        await initializeI18next();
        updateUILanguage();
    } catch (err) {
        console.error('Error initializing i18next:', err);
    }

    i18next.on('languageChanged', updateUILanguage);

    if (currentTab) {
        const videoId = getVideoId(currentTab.url);
        if (videoId) {
            checkExistingTranscript(videoId);
        } else {
            console.warn('No video ID found in current tab URL');
            showAlert(i18next.t('noVideoIdFound'), 'warning');
        }
    } else {
        console.warn('Current tab is not set');
        showAlert(i18next.t('errorGettingTab'), 'danger');
    }

    const downloadBtn = document.getElementById('downloadBtn');
    const copyTranscriptBtn = document.getElementById('copyTranscriptBtn');

    if (downloadBtn) downloadBtn.addEventListener('click', downloadTranscript);
    if (copyTranscriptBtn) copyTranscriptBtn.addEventListener('click', copyTranscript);
});

function showLoading(show) {
    const loadingBar = document.getElementById('loadingBar');
    if (loadingBar) {
        if (show) {
            loadingBar.classList.remove('d-none');
            loadingBar.querySelector('.progress-bar').style.width = '100%';
        } else {
            loadingBar.classList.add('d-none');
            loadingBar.querySelector('.progress-bar').style.width = '0%';
        }
    }
}

function showAlert(message, type = 'info') {
    const alertElement = document.getElementById('alert');
    if (alertElement) {
        alertElement.textContent = message;
        alertElement.className = `alert alert-${type}`;
        alertElement.classList.remove('d-none');
        setTimeout(() => alertElement.classList.add('d-none'), 3000);
    }
}

function downloadTranscript() {
    if (!currentTab) {
        showAlert(i18next.t('errorNoTab'), 'danger');
        return;
    }

    const videoId = getVideoId(currentTab.url);
    if (!videoId) {
        showAlert(i18next.t('errorNoVideoId'), 'danger');
        return;
    }

    showLoading(true);
    chrome.tabs.sendMessage(currentTab.id, {action: "getTranscript"}, function(response) {
        showLoading(false);
        if (chrome.runtime.lastError) {
            showAlert("Error communicating with the page: " + chrome.runtime.lastError.message, 'danger');
        } else if (response && response.transcript) {
            const fileName = `transcript_${videoId}.txt`;
            chrome.runtime.sendMessage({
              action: "writeFile",
              fileName: fileName,
              content: response.transcript
            }, function(response) {
              if (response.success) {
                showAlert(i18next.t('transcriptDownloaded'), 'success');
              } else {
                showAlert("Error saving transcript: " + (response.error || "Unknown error"), 'danger');
              }
            });
            saveAndDisplayTranscript(videoId, response.transcript);
        } else if (response && response.error) {
            showAlert("Error fetching transcript: " + response.error, 'danger');
        } else {
            showAlert("Unexpected error occurred", 'danger');
        }
    });
}

function copyTranscript() {
    const transcriptElement = document.getElementById('transcript');
    if (transcriptElement) {
        navigator.clipboard.writeText(transcriptElement.textContent).then(() => {
            showAlert(i18next.t('copiedText'), 'success');
        }, (err) => {
            console.error('Could not copy text: ', err);
            showAlert(i18next.t('errorCopyingText'), 'danger');
        });
    } else {
        showAlert(i18next.t('errorCopyingText'), 'danger');
    }
}

function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'alert alert-danger mt-3';
    errorElement.textContent = message;
    document.body.appendChild(errorElement);
    setTimeout(() => errorElement.remove(), 5000);
}