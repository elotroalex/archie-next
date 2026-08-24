(function () {
  "use strict";

  var containerId = "parham_hype_container";
  var audibleAttribute = "data-archipelagos-audible";
  var observedAttribute = "data-archipelagos-audio-observed";
  var secretBoxId = "archipelagos_dawes_secretbox";
  var ncmSecretBoxId = "archipelagos_ncm_secretbox";
  var assemblyPreludeId = "archipelagos_assembly_dawes_prelude";
  var assemblySecretBoxId = "archipelagos_assembly_secretbox";
  var hoverButtonAttribute = "data-archipelagos-hover-audio-button";
  var hoverButtonStyleId = "archipelagos-hover-audio-button-styles";
  var audioPlayer = document.createElement("audio");
  var poetryPlayer = document.createElement("audio");
  var hoverPlayer = document.createElement("audio");
  var activeVideo = null;
  var activeHoverVideo = null;
  var soundAuthorized = false;
  var syncTimer = null;
  var hoverSyncTimer = null;
  var poetryTimer = null;
  var aboutPromptTimer = null;
  var assemblyPreludeTimer = null;
  var assemblyPreludeFadeTimer = null;
  var assemblyPreludeDocument = null;
  var activeAudioScene = null;
  var silentAudioUrl = null;
  var hoverAudioFiles = ["dance cut NCM-1.mp4", "NCM rope end.mp4"];
  var ncmCompositeFile = "dawes-stop-cong.mp4";
  var ncmCompositeDuration = 45.397333;
  var sceneAudioCues = {
    "dawes-break": {
      source: "parham.hyperesources/Dawes-stopTime-first.m4a",
      delay: 45000,
    },
    assembly: {
      source: "parham.hyperesources/2dawes-stop-time-healing.m4a",
      delay: 0,
    },
  };

  audioPlayer.id = "archipelagos_shared_audio";
  audioPlayer.preload = "auto";
  audioPlayer.setAttribute("aria-hidden", "true");
  audioPlayer.style.display = "none";
  document.body.appendChild(audioPlayer);

  poetryPlayer.id = "archipelagos_poetry_audio";
  poetryPlayer.preload = "auto";
  poetryPlayer.setAttribute("aria-hidden", "true");
  poetryPlayer.style.display = "none";
  document.body.appendChild(poetryPlayer);

  hoverPlayer.id = "archipelagos_hover_audio";
  hoverPlayer.preload = "auto";
  hoverPlayer.setAttribute("aria-hidden", "true");
  hoverPlayer.style.display = "none";
  document.body.appendChild(hoverPlayer);

  function isChooseScene() {
    var hypeDocuments =
      window.HYPE && window.HYPE.documents
        ? Object.keys(window.HYPE.documents).map(function (key) {
            return window.HYPE.documents[key];
          })
        : [];

    if (hypeDocuments.length > 0) {
      return hypeDocuments.some(function (hypeDocument) {
        return (
          typeof hypeDocument.currentSceneName === "function" &&
          hypeDocument.currentSceneName().toLowerCase() === "choose"
        );
      });
    }

    return window.location.hash.toLowerCase() === "#choose";
  }

  function isInsideHype(eventTarget) {
    var element =
      eventTarget && eventTarget.nodeType === 1
        ? eventTarget
        : eventTarget && eventTarget.parentElement;
    return Boolean(element && element.closest("#" + containerId));
  }

  function makeSilentAudioUrl() {
    var sampleRate = 8000;
    var sampleCount = 800;
    var bytesPerSample = 2;
    var dataLength = sampleCount * bytesPerSample;
    var buffer = new ArrayBuffer(44 + dataLength);
    var view = new DataView(buffer);

    function writeString(offset, value) {
      for (var index = 0; index < value.length; index += 1) {
        view.setUint8(offset + index, value.charCodeAt(index));
      }
    }

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, dataLength, true);

    return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
  }

  function authorizeSound(event) {
    if (
      soundAuthorized ||
      !isChooseScene() ||
      !isInsideHype(event.target)
    ) {
      return;
    }

    soundAuthorized = true;
    silentAudioUrl = makeSilentAudioUrl();
    [audioPlayer, poetryPlayer, hoverPlayer].forEach(function (player) {
      player.src = silentAudioUrl;
      player.volume = 0;

      var playAttempt = player.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () {
          // The later real-media play attempts remain the source of truth.
        });
      }
    });
  }

  function clearPoetryTimer() {
    if (poetryTimer !== null) {
      window.clearTimeout(poetryTimer);
      poetryTimer = null;
    }
  }

  function clearAboutPromptTimer() {
    if (aboutPromptTimer !== null) {
      window.clearTimeout(aboutPromptTimer);
      aboutPromptTimer = null;
    }
  }

  function scheduleAboutPrompt(hypeDocument) {
    clearAboutPromptTimer();
    var prompt = document.querySelector(
      "#" + containerId +
        ' .HYPE_scene[hype_scene_index="1"] .archipelagos-about-tendwa-prompt',
    );
    if (!prompt) {
      return;
    }

    prompt.style.opacity = "0";
    aboutPromptTimer = window.setTimeout(function () {
      aboutPromptTimer = null;
      if (
        prompt.isConnected &&
        typeof hypeDocument.currentSceneName === "function" &&
        hypeDocument.currentSceneName().toLowerCase() === "about"
      ) {
        prompt.style.opacity = "1";
      }
    }, 24000);
  }

  function stopPoetry() {
    clearPoetryTimer();
    poetryPlayer.pause();
    activeAudioScene = null;
    try {
      poetryPlayer.currentTime = 0;
    } catch (_error) {
      // The provisional source may not have loaded before the scene changed.
    }
  }

  function clearAssemblyPreludeTimers() {
    if (assemblyPreludeTimer !== null) {
      window.clearTimeout(assemblyPreludeTimer);
      assemblyPreludeTimer = null;
    }
    if (assemblyPreludeFadeTimer !== null) {
      window.clearTimeout(assemblyPreludeFadeTimer);
      assemblyPreludeFadeTimer = null;
    }
  }

  function removeAssemblyPrelude() {
    var prelude = document.getElementById(assemblyPreludeId);
    if (prelude && prelude.parentNode) {
      prelude.parentNode.removeChild(prelude);
    }
  }

  function cancelAssemblyPrelude() {
    clearAssemblyPreludeTimers();
    removeAssemblyPrelude();
    assemblyPreludeDocument = null;
  }

  function finishAssemblyPrelude() {
    var hypeDocument = assemblyPreludeDocument;
    var prelude = document.getElementById(assemblyPreludeId);
    if (!hypeDocument) {
      return;
    }

    clearAssemblyPreludeTimers();
    stopPoetry();

    var resumeAssembly = function () {
      removeAssemblyPrelude();
      assemblyPreludeDocument = null;
      if (
        typeof hypeDocument.currentSceneName === "function" &&
        hypeDocument.currentSceneName().toLowerCase() === "assembly" &&
        typeof hypeDocument.continueTimelineNamed === "function"
      ) {
        hypeDocument.continueTimelineNamed("Main Timeline");
      }
    };

    if (!prelude) {
      resumeAssembly();
      return;
    }

    prelude.style.transition = "opacity 1000ms ease";
    prelude.style.opacity = "0";
    assemblyPreludeFadeTimer = window.setTimeout(resumeAssembly, 1000);
  }

  function jumpAssemblyPreludeNearEnd(event) {
    event.preventDefault();
    event.stopPropagation();

    if (assemblyPreludeTimer !== null) {
      window.clearTimeout(assemblyPreludeTimer);
      assemblyPreludeTimer = null;
    }

    if (
      activeAudioScene !== "assembly" ||
      !Number.isFinite(poetryPlayer.duration) ||
      poetryPlayer.duration <= 0
    ) {
      finishAssemblyPrelude();
      return;
    }

    var jumpTime = Math.max(0, poetryPlayer.duration - 3);
    try {
      poetryPlayer.currentTime = jumpTime;
    } catch (_error) {
      finishAssemblyPrelude();
      return;
    }

    if (poetryPlayer.paused && soundAuthorized) {
      var playAttempt = poetryPlayer.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () {
          // The timed fallback below still releases the assembly scene.
        });
      }
    }

    assemblyPreludeTimer = window.setTimeout(finishAssemblyPrelude, 3250);
  }

  function addAssemblyPrelude(hypeDocument) {
    cancelAssemblyPrelude();

    var assemblyScene = document.querySelector(
      "#" + containerId + ' .HYPE_scene[hype_scene_index="23"]',
    );
    if (!assemblyScene) {
      return;
    }

    assemblyPreludeDocument = hypeDocument;
    if (typeof hypeDocument.goToTimeInTimelineNamed === "function") {
      hypeDocument.goToTimeInTimelineNamed(0, "Main Timeline");
    }
    if (typeof hypeDocument.pauseTimelineNamed === "function") {
      hypeDocument.pauseTimelineNamed("Main Timeline");
    }

    var prelude = document.createElement("div");
    prelude.id = assemblyPreludeId;
    prelude.style.position = "absolute";
    prelude.style.inset = "0";
    prelude.style.background = "#000000";
    prelude.style.opacity = "1";
    prelude.style.overflow = "hidden";
    prelude.style.zIndex = "10000";

    var card = document.createElement("div");
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "Excerpt from Kwame Dawes’s Stop Time");
    card.style.position = "absolute";
    card.style.left = "451px";
    card.style.top = "175px";
    card.style.width = "318px";
    card.style.height = "305px";
    card.style.padding = "8px";
    card.style.background = "#FFFFFF";
    card.style.boxShadow = "0 0 21px #C0C0C0";
    card.style.color = "#000000";
    card.style.fontFamily = 'Optima, "Lucida Grande", Helvetica, sans-serif';
    card.style.fontSize = "14px";
    card.style.lineHeight = "7px";
    card.style.overflowWrap = "break-word";
    card.style.opacity = "0";
    card.style.transition = "opacity 1290ms ease";
    card.innerHTML =
      '<p><span style="word-spacing: normal;">[…] a body</span></p>' +
      '<p>finds itself in the gap, and this</p>' +
      '<p>dance that lifts a big clumsy</p>' +
      '<p>man to his feet makes him</p>' +
      '<p>turn, makes him jump, makes</p>' +
      '<p>him holler, <i>everything</i>, louder</p>' +
      '<p>and louder, <i>everything</i>! And here</p>' +
      '<p>in this chapel the world is held</p>' +
      '<p>in the cradle of a song, and for this</p>' +
      '<p>one moment, he knows how to walk,</p>' +
      '<p>how to ride through the world, how stop</p>' +
      '<p>time is the music of our resistance</p>' +
      '<p>and the song is the healing of all pain.</p>' +
      '<p style="text-align: right;">— <span style="font-size: 9px;">from</span>&nbsp;Kwame Dawes, “Stop Time”</p>';

    var secretBox = document.createElement("button");
    secretBox.id = assemblySecretBoxId;
    secretBox.type = "button";
    secretBox.setAttribute(
      "aria-label",
      "Skip to the final three seconds of the assembly Dawes reading",
    );
    secretBox.style.position = "absolute";
    secretBox.style.left = "13px";
    secretBox.style.top = "44px";
    secretBox.style.width = "65px";
    secretBox.style.height = "75px";
    secretBox.style.margin = "0";
    secretBox.style.padding = "0";
    secretBox.style.border = "0";
    secretBox.style.background = "transparent";
    secretBox.style.opacity = "0";
    secretBox.style.cursor = "pointer";
    secretBox.style.zIndex = "1000";
    secretBox.addEventListener("click", jumpAssemblyPreludeNearEnd);

    prelude.appendChild(card);
    prelude.appendChild(secretBox);
    assemblyScene.appendChild(prelude);
    window.setTimeout(function () {
      if (card.isConnected) {
        card.style.opacity = "1";
      }
    }, 20);

    // The assembly recording is 40.427 seconds. This fallback also releases
    // assembly if a direct link or browser policy prevents playback.
    assemblyPreludeTimer = window.setTimeout(finishAssemblyPrelude, 40427);
  }

  function turnDawesArrowFuchsia() {
    var arrow = null;
    Array.prototype.some.call(
      document.querySelectorAll("#" + containerId + " div"),
      function (element) {
        if (
          window
            .getComputedStyle(element)
            .backgroundImage.indexOf(
              "Screenshot%202018-07-27%2022.20.02",
            ) !== -1
        ) {
          arrow = element;
          return true;
        }
        return false;
      },
    );

    if (arrow) {
      arrow.style.backgroundColor = "#E2009A";
      arrow.style.backgroundBlendMode = "screen";
    }
  }

  function playPoetry(source, sceneName) {
    poetryTimer = null;
    if (!soundAuthorized) {
      return;
    }

    activeAudioScene = sceneName;
    poetryPlayer.src = source;
    poetryPlayer.loop = false;
    poetryPlayer.volume = 1;
    poetryPlayer.playbackRate = 1;

    var playAttempt = poetryPlayer.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(function () {
        // The scene remains usable if a browser or direct link denies sound.
      });
    }
  }

  function removeSecretBox() {
    var secretBox = document.getElementById(secretBoxId);
    if (secretBox && secretBox.parentNode) {
      secretBox.parentNode.removeChild(secretBox);
    }
  }

  function addDawesSecretBox(hypeDocument, sceneElement) {
    removeSecretBox();

    var secretBox = document.createElement("button");
    secretBox.id = secretBoxId;
    secretBox.type = "button";
    secretBox.setAttribute(
      "aria-label",
      "Skip Dawes-break presentation to the Continue arrow",
    );
    secretBox.style.position = "absolute";
    secretBox.style.left = "13px";
    secretBox.style.top = "44px";
    secretBox.style.width = "65px";
    secretBox.style.height = "75px";
    secretBox.style.margin = "0";
    secretBox.style.padding = "0";
    secretBox.style.border = "0";
    secretBox.style.background = "transparent";
    secretBox.style.opacity = "0";
    secretBox.style.cursor = "pointer";
    secretBox.style.zIndex = "1000";

    secretBox.addEventListener("click", function (event) {
      event.preventDefault();
      stopPoetry();
      hypeDocument.goToTimeInTimelineNamed(57, "Main Timeline");
    });

    sceneElement.appendChild(secretBox);
  }

  function removeNcmSecretBox() {
    var secretBox = document.getElementById(ncmSecretBoxId);
    if (secretBox && secretBox.parentNode) {
      secretBox.parentNode.removeChild(secretBox);
    }
  }

  function findNcmCompositeVideo(sceneElement) {
    return Array.prototype.find.call(
      sceneElement.querySelectorAll("video"),
      function (video) {
        var source = videoSource(video);
        try {
          source = decodeURIComponent(source);
        } catch (_error) {
          // The encoded filename is still safe to compare below.
        }
        return source.toLowerCase().indexOf(ncmCompositeFile) !== -1;
      },
    );
  }

  function prepareNcmComposite(sceneElement) {
    if (!sceneElement || !sceneElement.isConnected) {
      return;
    }

    var video = findNcmCompositeVideo(sceneElement);
    if (!video) {
      return;
    }

    video.setAttribute("autoplay", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("preload", "auto");
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "auto";

    var playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(function () {
        // Direct links may still require a browser-approved user gesture.
      });
    }
  }

  function addNcmSecretBox(hypeDocument, sceneElement) {
    removeNcmSecretBox();

    var secretBox = document.createElement("button");
    secretBox.id = ncmSecretBoxId;
    secretBox.type = "button";
    secretBox.setAttribute(
      "aria-label",
      "Skip to the final three seconds of the NCM-break composite",
    );
    secretBox.style.position = "absolute";
    secretBox.style.left = "13px";
    secretBox.style.top = "44px";
    secretBox.style.width = "65px";
    secretBox.style.height = "75px";
    secretBox.style.margin = "0";
    secretBox.style.padding = "0";
    secretBox.style.border = "0";
    secretBox.style.background = "transparent";
    secretBox.style.opacity = "0";
    secretBox.style.cursor = "pointer";
    secretBox.style.zIndex = "1000";

    secretBox.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var jumpTime = Math.max(0, ncmCompositeDuration - 3);
      hypeDocument.goToTimeInTimelineNamed(jumpTime, "Main Timeline");
      window.setTimeout(function () {
        hypeDocument.continueTimelineNamed("Main Timeline");
      }, 20);
      var seekCompositeNearEnd = function () {
        if (!secretBox.isConnected) {
          return;
        }
        var compositeVideo = findNcmCompositeVideo(sceneElement);
        if (compositeVideo) {
          try {
            compositeVideo.currentTime = jumpTime;
          } catch (_error) {
            // The timeline remains correctly positioned if seeking fails.
          }
          var videoPlayAttempt = compositeVideo.play();
          if (
            videoPlayAttempt &&
            typeof videoPlayAttempt.catch === "function"
          ) {
            videoPlayAttempt.catch(function () {
              // The timeline remains usable if the browser denies playback.
            });
          }
        }
      };
      [150, 450, 800].forEach(function (delay) {
        window.setTimeout(seekCompositeNearEnd, delay);
      });
    });

    sceneElement.appendChild(secretBox);
  }

  function handleSceneLoad(hypeDocument) {
    if (!hypeDocument || typeof hypeDocument.currentSceneName !== "function") {
      return;
    }

    var sceneName = hypeDocument.currentSceneName().toLowerCase();
    var cue = sceneAudioCues[sceneName];
    if (sceneName === "dawes-break") {
      var dawesSceneElement = document.querySelector(
        "#" + containerId + ' .HYPE_scene[hype_scene_index="16"]',
      );
      if (dawesSceneElement) {
        addDawesSecretBox(hypeDocument, dawesSceneElement);
      }
    }
    if (sceneName === "ncm-break") {
      var ncmSceneElement = document.querySelector(
        "#" + containerId + ' .HYPE_scene[hype_scene_index="24"]',
      );
      if (ncmSceneElement) {
        addNcmSecretBox(hypeDocument, ncmSceneElement);
        prepareNcmComposite(ncmSceneElement);
        window.setTimeout(function () {
          prepareNcmComposite(ncmSceneElement);
        }, 150);
        window.setTimeout(function () {
          prepareNcmComposite(ncmSceneElement);
        }, 500);
      }
    }
    if (sceneName === "assembly") {
      addAssemblyPrelude(hypeDocument);
    }
    if (sceneName === "about") {
      scheduleAboutPrompt(hypeDocument);
    }
    if (cue) {
      stopPoetry();
      poetryTimer = window.setTimeout(function () {
        playPoetry(cue.source, hypeDocument.currentSceneName().toLowerCase());
      }, cue.delay);
    }
    window.setTimeout(scanHoverAudioVideos, 0);
    window.setTimeout(scanHoverAudioVideos, 500);
  }

  function handleSceneUnload() {
    clearAboutPromptTimer();
    cancelAssemblyPrelude();
    removeSecretBox();
    removeNcmSecretBox();
    stopPoetry();
    audioPlayer.pause();
    stopSync();
    activeVideo = null;
    stopHoverAudio();
  }

  function videoSource(video) {
    return (
      video.currentSrc ||
      video.src ||
      (video.querySelector("source") && video.querySelector("source").src) ||
      ""
    );
  }

  function stopSync() {
    if (syncTimer !== null) {
      window.clearInterval(syncTimer);
      syncTimer = null;
    }
  }

  function stopHoverSync() {
    if (hoverSyncTimer !== null) {
      window.clearInterval(hoverSyncTimer);
      hoverSyncTimer = null;
    }
  }

  function isHoverAudioVideo(video) {
    var source = videoSource(video);
    try {
      source = decodeURIComponent(source);
    } catch (_error) {
      // A valid URL can still be matched in its encoded form below.
    }
    source = source.toLowerCase();

    return hoverAudioFiles.some(function (fileName) {
      return source.indexOf(fileName.toLowerCase()) !== -1;
    });
  }

  function ensureHoverButtonStyles() {
    if (document.getElementById(hoverButtonStyleId)) {
      return;
    }

    var style = document.createElement("style");
    style.id = hoverButtonStyleId;
    style.textContent =
      "@keyframes archipelagos-sound-pulse{" +
      "0%,100%{opacity:.72;transform:scale(.96)}" +
      "50%{opacity:1;transform:scale(1.06)}}" +
      "button[" + hoverButtonAttribute + '="true"] .archipelagos-sound-mark{' +
      "display:inline-block;opacity:.78;transform-origin:center;" +
      "text-shadow:0 1px 3px rgba(0,0,0,.95),0 0 8px rgba(0,0,0,.85)}" +
      "button[" + hoverButtonAttribute + '="true"][aria-pressed="true"] ' +
      ".archipelagos-sound-mark{" +
      "animation:archipelagos-sound-pulse 1100ms ease-in-out infinite}" +
      "button[" + hoverButtonAttribute + '="true"]:hover .archipelagos-sound-mark{' +
      "opacity:1}" +
      "button[" + hoverButtonAttribute + '="true"]:focus-visible{' +
      "outline:none}" +
      "button[" + hoverButtonAttribute + '="true"]:focus-visible ' +
      ".archipelagos-sound-mark{" +
      "opacity:1;filter:drop-shadow(0 0 3px #fff)}" +
      "@media (prefers-reduced-motion:reduce){" +
      "button[" + hoverButtonAttribute + '="true"][aria-pressed="true"] ' +
      ".archipelagos-sound-mark{animation:none;opacity:1}}";
    document.head.appendChild(style);
  }

  function hoverButtonMarkup() {
    return (
      '<span class="archipelagos-sound-mark" aria-hidden="true">' +
      "※&nbsp;)))</span>"
    );
  }

  function setHoverButtonState(video, isPlaying) {
    var button = video._archipelagosHoverAudioButton;
    if (!button) {
      return;
    }

    button.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    button.setAttribute(
      "aria-label",
      isPlaying ? "Stop sound for this video" : "Play sound for this video",
    );
    button.title = isPlaying ? "Stop sound" : "Play sound";
    button.innerHTML = hoverButtonMarkup();
  }

  function positionHoverAudioButton(video, button) {
    button.style.left = video.offsetLeft + 10 + "px";
    button.style.top = video.offsetTop + video.offsetHeight - 58 + "px";
  }

  function addHoverAudioButton(video) {
    if (
      video._archipelagosHoverAudioButton ||
      !video.parentElement ||
      !isHoverAudioVideo(video)
    ) {
      return;
    }

    ensureHoverButtonStyles();

    var button = document.createElement("button");
    button.type = "button";
    button.setAttribute(hoverButtonAttribute, "true");
    button.style.position = "absolute";
    button.style.width = "80px";
    button.style.height = "48px";
    button.style.margin = "0";
    button.style.padding = "0";
    button.style.border = "0";
    button.style.background = "transparent";
    button.style.color = "#FFFFFF";
    button.style.fontFamily = 'Cochin, "Times New Roman", serif';
    button.style.fontSize = "28px";
    button.style.fontWeight = "normal";
    button.style.lineHeight = "1";
    button.style.letterSpacing = "1px";
    button.style.textAlign = "center";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.pointerEvents = "auto";
    button.style.cursor = "pointer";
    button.style.touchAction = "manipulation";
    button.style.zIndex = "1000";
    button.style.boxSizing = "border-box";
    button.style.webkitTapHighlightColor = "transparent";

    video._archipelagosHoverAudioButton = button;
    positionHoverAudioButton(video, button);
    setHoverButtonState(video, false);

    button.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
    });
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (activeHoverVideo === video && !hoverPlayer.paused) {
        stopHoverAudio(video);
        return;
      }

      // A deliberate tap/click is itself sufficient browser authorization.
      soundAuthorized = true;
      playHoverAudio(video);
    });

    video.parentElement.appendChild(button);
  }

  function prepareHoverAudioVideo(video) {
    if (
      !(video instanceof HTMLVideoElement) ||
      video.getAttribute("data-archipelagos-hover-audio") === "true" ||
      !isHoverAudioVideo(video)
    ) {
      return;
    }

    video.setAttribute("data-archipelagos-hover-audio", "true");
    addHoverAudioButton(video);
    video.addEventListener("pointerenter", function (event) {
      if (event.pointerType === "mouse" || event.pointerType === "pen") {
        playHoverAudio(video);
      }
    });
    video.addEventListener("pointerleave", function (event) {
      if (event.pointerType === "mouse" || event.pointerType === "pen") {
        stopHoverAudio(video);
      }
    });
  }

  function scanHoverAudioVideos() {
    var container = document.getElementById(containerId);
    Array.prototype.forEach.call(
      container ? container.querySelectorAll("video") : [],
      function (video) {
        prepareHoverAudioVideo(video);
        if (video._archipelagosHoverAudioButton) {
          positionHoverAudioButton(
            video,
            video._archipelagosHoverAudioButton,
          );
        }
      },
    );
  }

  function alignHoverAudio(video) {
    if (activeHoverVideo !== video || hoverPlayer.readyState === 0) {
      return;
    }

    if (Math.abs(hoverPlayer.currentTime - video.currentTime) > 0.12) {
      try {
        hoverPlayer.currentTime = video.currentTime;
      } catch (_error) {
        // The replacement video may not be seekable until metadata loads.
      }
    }
  }

  function stopHoverAudio(video) {
    if (video && activeHoverVideo !== video) {
      return;
    }

    var stoppedVideo = activeHoverVideo;
    hoverPlayer.pause();
    stopHoverSync();
    activeHoverVideo = null;
    if (stoppedVideo) {
      setHoverButtonState(stoppedVideo, false);
    }
  }

  function playHoverAudio(video) {
    var source = videoSource(video);
    if (!soundAuthorized || !source || activeHoverVideo === video) {
      return;
    }

    stopHoverAudio();
    activeHoverVideo = video;
    setHoverButtonState(video, true);

    if (hoverPlayer.src !== source) {
      hoverPlayer.src = source;
      hoverPlayer.load();
    }

    hoverPlayer.loop = video.loop;
    hoverPlayer.volume = video.volume;
    hoverPlayer.playbackRate = video.playbackRate;

    var beginPlayback = function () {
      if (activeHoverVideo !== video) {
        return;
      }
      alignHoverAudio(video);
      var playAttempt = hoverPlayer.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () {
          stopHoverAudio(video);
          // Current placeholders are silent; later audio-bearing replacements
          // will use these same filenames and interaction wiring.
        });
      }
    };

    if (hoverPlayer.readyState >= 1) {
      beginPlayback();
    } else {
      hoverPlayer.addEventListener("loadedmetadata", beginPlayback, {
        once: true,
      });
    }

    hoverSyncTimer = window.setInterval(function () {
      if (!video.isConnected || video.paused || video.ended) {
        stopHoverAudio(video);
        return;
      }
      alignHoverAudio(video);
    }, 200);
  }

  function pauseSharedAudio(video) {
    if (activeVideo !== video) {
      return;
    }
    audioPlayer.pause();
    stopSync();
  }

  function alignSharedAudio(video) {
    if (activeVideo !== video || audioPlayer.readyState === 0) {
      return;
    }

    if (Math.abs(audioPlayer.currentTime - video.currentTime) > 0.15) {
      try {
        audioPlayer.currentTime = video.currentTime;
      } catch (_error) {
        // The source may not be seekable until its metadata has loaded.
      }
    }
  }

  function playSharedAudio(video) {
    var source = videoSource(video);
    if (!soundAuthorized || !source) {
      return;
    }

    activeVideo = video;
    stopSync();

    if (audioPlayer.src !== source) {
      audioPlayer.src = source;
      audioPlayer.load();
      if (silentAudioUrl) {
        URL.revokeObjectURL(silentAudioUrl);
        silentAudioUrl = null;
      }
    }

    audioPlayer.loop = video.loop;
    audioPlayer.volume = video.volume;
    audioPlayer.playbackRate = video.playbackRate;

    var beginPlayback = function () {
      if (activeVideo !== video) {
        return;
      }
      alignSharedAudio(video);
      var playAttempt = audioPlayer.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () {
          // The visual remains available even if a browser denies sound.
        });
      }
    };

    if (audioPlayer.readyState >= 1) {
      beginPlayback();
    } else {
      audioPlayer.addEventListener("loadedmetadata", beginPlayback, {
        once: true,
      });
    }

    syncTimer = window.setInterval(function () {
      if (!video.isConnected || video.paused || video.ended) {
        pauseSharedAudio(video);
        return;
      }
      alignSharedAudio(video);
    }, 250);
  }

  function prepareVideo(video) {
    if (
      !(video instanceof HTMLVideoElement) ||
      video.hasAttribute(observedAttribute)
    ) {
      return;
    }

    video.setAttribute(observedAttribute, "true");

    // In the Hype export, an unchecked Mute setting produces an unmuted
    // element. Preserve that editorial choice, then mute the visual element so
    // its autoplay remains reliable while the shared player supplies sound.
    if (!video.muted) {
      video.setAttribute(audibleAttribute, "true");
      video.muted = true;
    }

    video.addEventListener("play", function () {
      if (video.getAttribute(audibleAttribute) === "true") {
        video.muted = true;
        playSharedAudio(video);
      }
    });

    video.addEventListener("volumechange", function () {
      if (
        video.getAttribute(audibleAttribute) === "true" &&
        !video.muted
      ) {
        video.muted = true;
      }
    });

    video.addEventListener("pause", function () {
      pauseSharedAudio(video);
    });
    video.addEventListener("ended", function () {
      pauseSharedAudio(video);
    });
    video.addEventListener("seeking", function () {
      alignSharedAudio(video);
    });
    video.addEventListener("ratechange", function () {
      if (activeVideo === video) {
        audioPlayer.playbackRate = video.playbackRate;
      }
      if (activeHoverVideo === video) {
        hoverPlayer.playbackRate = video.playbackRate;
      }
    });

    prepareHoverAudioVideo(video);
    video.addEventListener("loadstart", function () {
      prepareHoverAudioVideo(video);
    });
    video.addEventListener("loadedmetadata", function () {
      prepareHoverAudioVideo(video);
    });
  }

  function prepareVideosIn(node) {
    if (!node || node.nodeType !== 1) {
      return;
    }
    if (node instanceof HTMLVideoElement) {
      prepareVideo(node);
    }
    Array.prototype.forEach.call(
      node.querySelectorAll ? node.querySelectorAll("video") : [],
      prepareVideo,
    );
  }

  function observeVideos() {
    var container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    prepareVideosIn(container);
    new MutationObserver(function (mutationList) {
      mutationList.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes, prepareVideosIn);
      });
      window.setTimeout(scanHoverAudioVideos, 0);
    }).observe(container, {
      attributes: true,
      attributeFilter: ["src"],
      childList: true,
      subtree: true,
    });

    window.setTimeout(scanHoverAudioVideos, 0);
    window.setTimeout(scanHoverAudioVideos, 500);
  }

  document.addEventListener("pointerdown", authorizeSound, true);
  document.addEventListener("click", authorizeSound, true);

  poetryPlayer.addEventListener("ended", function () {
    if (activeAudioScene === "dawes-break") {
      turnDawesArrowFuchsia();
    }
    if (activeAudioScene === "assembly") {
      finishAssemblyPrelude();
    }
    activeAudioScene = null;
  });

  window.HYPE_eventListeners = window.HYPE_eventListeners || [];
  window.HYPE_eventListeners.push({
    type: "HypeSceneLoad",
    callback: handleSceneLoad,
  });
  window.HYPE_eventListeners.push({
    type: "HypeSceneUnload",
    callback: handleSceneUnload,
  });

  window.ArchipelagosAudioBridge = {
    isAuthorized: function () {
      return soundAuthorized;
    },
    activeVideo: function () {
      return activeVideo;
    },
    poetryPlayer: function () {
      return poetryPlayer;
    },
    hoverPlayer: function () {
      return hoverPlayer;
    },
    activeHoverVideo: function () {
      return activeHoverVideo;
    },
  };

  if (document.getElementById(containerId)) {
    observeVideos();
  } else {
    document.addEventListener("DOMContentLoaded", observeVideos, {
      once: true,
    });
  }
})();
