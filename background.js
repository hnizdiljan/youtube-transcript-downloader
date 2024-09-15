function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "writeFile") {
      chrome.storage.sync.get('outputFolder', (data) => {
        let outputFolder = data.outputFolder || 'YouTube_Summaries';
        outputFolder = sanitizeFilename(outputFolder);
        const fileName = `${outputFolder}/${request.fileName}`;
        
        const content = request.content;
        const blob = new Blob([content], {type: 'text/plain'});
        const reader = new FileReader();
        
        reader.onloadend = function() {
          chrome.downloads.download({
            url: reader.result,
            filename: fileName,
            saveAs: false,
            conflictAction: 'overwrite'  // This line ensures the file is overwritten if it exists
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              console.error("Download error:", chrome.runtime.lastError);
              sendResponse({error: chrome.runtime.lastError.message});
            } else {
              console.log("File downloaded successfully:", fileName);
              sendResponse({success: true, downloadId: downloadId});
            }
          });
        };
        
        reader.onerror = function(error) {
          console.error("FileReader error:", error);
          sendResponse({error: "Error processing file content"});
        };
        
        reader.readAsDataURL(blob);
      });
      return true; // Indicates we will send a response asynchronously
    }
  });