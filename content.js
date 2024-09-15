// content.js

console.log("YouTube Summary Extension content script loaded");

function getVideoId(url) {
  console.log("Getting video ID from URL:", url);
  const urlParams = new URLSearchParams(new URL(url).search);
  const videoId = urlParams.get('v');
  console.log("Video ID:", videoId);
  return videoId;
}

function extractJSONFromScriptTag(html) {
  console.log("Attempting to extract JSON from script tag");
  const regex = /ytInitialPlayerResponse\s*=\s*({.+?})\s*;/;
  const match = html.match(regex);
  if (match && match[1]) {
    try {
      const jsonStr = match[1].replace(/\n/g, '');
      console.log("Found JSON string, length:", jsonStr.length);
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error parsing JSON from script tag:", error);
      console.log("Problematic JSON string:", match[1].substring(0, 100) + "...");
    }
  } else {
    console.error("Couldn't find ytInitialPlayerResponse in the page source");
  }
  return null;
}

function getCaptionUrl(playerResponse) {
  console.log("Attempting to get caption URL from player response");
  if (playerResponse && 
      playerResponse.captions && 
      playerResponse.captions.playerCaptionsTracklistRenderer && 
      playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks && 
      playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks.length > 0) {
    const url = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks[0].baseUrl;
    console.log("Found caption URL:", url);
    return url;
  }
  console.error("Couldn't find caption URL in player response");
  console.log("Player response structure:", JSON.stringify(playerResponse, null, 2));
  return null;
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    remainingSeconds.toString().padStart(2, '0')
  ].join(':');
}

function fetchTranscript(videoId, progressCallback) {
  console.log("Fetching transcript for video ID:", videoId);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://www.youtube.com/watch?v=${videoId}`);
    xhr.onload = function() {
      console.log("Video page loaded, status:", xhr.status);
      if (xhr.status === 200) {
        const responseText = xhr.responseText;
        console.log("Response text length:", responseText.length);
        
        const playerResponse = extractJSONFromScriptTag(responseText);
        if (!playerResponse) {
          console.error("Couldn't extract player response from the page");
          reject("Couldn't extract player response from the page");
          return;
        }

        const captionsUrl = getCaptionUrl(playerResponse);
        if (!captionsUrl) {
          console.error("Couldn't find captions URL");
          reject("Couldn't find captions URL");
          return;
        }

        console.log("Captions URL:", captionsUrl);
        
        const transcriptXhr = new XMLHttpRequest();
        transcriptXhr.open("GET", captionsUrl);
        transcriptXhr.onload = function() {
          console.log("Transcript XML loaded, status:", transcriptXhr.status);
          if (transcriptXhr.status === 200) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(transcriptXhr.responseText, "text/xml");
            const textElements = xmlDoc.getElementsByTagName("text");
            let fullTranscript = "";
            for (let i = 0; i < textElements.length; i++) {
              const startTime = parseFloat(textElements[i].getAttribute("start"));
              const formattedTime = formatTime(startTime);
              fullTranscript += `[${formattedTime}] ${textElements[i].textContent}\n`;
              if (i % 10 === 0) {
                progressCallback(`Processed ${i} of ${textElements.length} segments`);
              }
            }
            console.log("Transcript extracted with timestamps, length:", fullTranscript.length);
            resolve(fullTranscript.trim());
          } else {
            console.error("Failed to load transcript XML, status:", transcriptXhr.status);
            reject(`Failed to load transcript XML, status: ${transcriptXhr.status}`);
          }
        };
        transcriptXhr.onerror = (error) => {
          console.error("Error fetching transcript XML:", error);
          reject("Error fetching transcript XML: " + error);
        };
        transcriptXhr.send();
      } else {
        console.error("Failed to load video page, status:", xhr.status);
        reject(`Failed to load video page, status: ${xhr.status}`);
      }
    };
    xhr.onerror = (error) => {
      console.error("Error fetching video page:", error);
      reject("Error fetching video page: " + error);
    };
    xhr.send();
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Message received in content script:", request);
  if (request.action === "getTranscript") {
    const videoId = getVideoId(window.location.href);
    if (videoId) {
      console.log("Video ID found:", videoId);
      fetchTranscript(videoId, (progress) => {
        console.log("Progress update:", progress);
        chrome.runtime.sendMessage({action: "transcriptProgress", progress: progress});
      })
        .then(transcript => {
          console.log("Transcript fetched successfully");
          sendResponse({transcript: transcript});
        })
        .catch(error => {
          console.error("Error fetching transcript:", error);
          sendResponse({error: error.toString()});
        });
      return true;  // Indicates we will send a response asynchronously
    } else {
      console.error("Couldn't find video ID");
      sendResponse({error: "Couldn't find video ID"});
    }
  }
});

console.log("YouTube Summary Extension content script setup complete");