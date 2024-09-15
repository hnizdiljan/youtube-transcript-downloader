const resources = {
    en: {
      translation: {
        extensionName: "YouTube Transcript Downloader",
        downloadTranscript: "Download Transcript",
        copyTranscript: "Copy",
        transcriptTitle: "Transcript",
        errorNoTab: "Couldn't detect active tab. Please try again.",
        errorNoVideoId: "Couldn't find video ID. Please make sure you're on a YouTube video page.",
        copiedText: "Copied!",
        errorCopyingText: "Error copying text",
        settingsTitle: "YouTube Transcript Downloader Settings",
        languageLabel: "Language:",
        outputFolderLabel: "Output Folder:",
        saveButton: "Save",
        saveSuccess: "Settings saved successfully!",
        errorSavingTranscript: "Error saving transcript. Please try again.",
        errorGettingTab: "Error getting current tab. Please try again.",
        noVideoIdFound: "No YouTube video ID found in the current tab.",
        errorCheckingTranscript: "Error checking for existing transcript. Please try again.",
        existingTranscriptFound: "Existing transcript found and loaded.",
        noVideoIdFound: "No YouTube video ID found in the current tab."
      }
    },
    cs: {
      translation: {
        extensionName: "Stahovač YouTube přepisů",
        downloadTranscript: "Stáhnout přepis",
        copyTranscript: "Kopírovat",
        transcriptTitle: "Přepis",
        errorNoTab: "Nelze detekovat aktivní záložku. Zkuste to prosím znovu.",
        errorNoVideoId: "Nelze najít ID videa. Ujistěte se prosím, že jste na stránce YouTube videa.",
        copiedText: "Zkopírováno!",
        errorCopyingText: "Chyba při kopírování textu",
        settingsTitle: "Nastavení Stahovače YouTube přepisů",
        languageLabel: "Jazyk:",
        outputFolderLabel: "Výstupní složka:",
        saveButton: "Uložit",
        saveSuccess: "Nastavení úspěšně uloženo!",
        errorSavingTranscript: "Chyba při ukládání přepisu. Prosím zkuste to znovu.",
        errorGettingTab: "Chyba při získávání aktuální záložky. Prosím, zkuste to znovu.",
        noVideoIdFound: "V aktuální záložce nebyl nalezen ID YouTube videa.",
        errorCheckingTranscript: "Chyba při kontrole existujícího přepisu. Prosím, zkuste to znovu.",
        existingTranscriptFound: "Nalezen existující přepis a načten.",
        noVideoIdFound: "V aktuální záložce nebyl nalezen ID YouTube videa."
      }
    }
  };
  
  function initializeI18next() {
    return i18next
      .use(i18nextBrowserLanguageDetector)
      .init({
        fallbackLng: 'en',
        debug: true,
        resources: resources
      });
  }