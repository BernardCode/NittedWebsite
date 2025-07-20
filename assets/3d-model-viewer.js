/**
 * Interactive 3D Model Viewer Controller
 * Manages state, animation playback, and user interaction for 3D models
 */
class Interactive3DViewer {
  constructor(modelViewerElement, options = {}) {
    this.modelViewer = modelViewerElement;
    this.options = {
      initialDelay: 1000,
      loopMode: "repeat",
      autoRotateSpeed: "30deg",
      loadingTimeout: 10000, // 10 seconds timeout
      maxRetries: 3,
      retryDelay: 2000,
      ...options,
    };

    // State management
    this.states = {
      LOADING: "loading",
      ANIMATING: "animating",
      INTERACTIVE: "interactive",
      ERROR: "error",
    };

    this.currentState = this.states.LOADING;
    this.isModelLoaded = false;
    this.isAnimationComplete = false;
    this.isUserInteracting = false;
    this.hasError = false;
    this.errorMessage = "";
    this.availableAnimations = [];
    this.animationMixer = null;
    this.animationActions = [];

    // Loading and error handling state
    this.loadingStartTime = null;
    this.loadingTimeout = null;
    this.retryCount = 0;
    this.loadingIndicator = null;
    this.errorContainer = null;

    this.initialize();
  }

  /**
   * Initialize the 3D viewer with event listeners and state setup
   */
  initialize() {
    this.setupEventListeners();
    this.initializeStates();
  }

  /**
   * Set up event listeners for model loading and user interaction
   */
  setupEventListeners() {
    // Model loading events
    this.modelViewer.addEventListener("load", () => this.handleModelLoad());
    this.modelViewer.addEventListener("error", (event) =>
      this.handleLoadError(event)
    );

    // Animation events - using model-viewer's animation API
    this.modelViewer.addEventListener("finished", () =>
      this.handleAnimationComplete()
    );

    // User interaction events
    this.modelViewer.addEventListener("camera-change", () =>
      this.handleUserInteraction()
    );

    // Touch and mouse events for interaction detection
    this.modelViewer.addEventListener("mousedown", () =>
      this.setUserInteracting(true)
    );
    this.modelViewer.addEventListener("mouseup", () =>
      this.setUserInteracting(false)
    );
    this.modelViewer.addEventListener("touchstart", () =>
      this.setUserInteracting(true)
    );
    this.modelViewer.addEventListener("touchend", () =>
      this.setUserInteracting(false)
    );
  }

  /**
   * Initialize the state machine
   */
  initializeStates() {
    this.transitionToState(this.states.LOADING);
  }

  /**
   * Transition to a new state and handle state-specific logic
   */
  transitionToState(newState) {
    const previousState = this.currentState;
    this.currentState = newState;

    console.log(`3D Viewer state transition: ${previousState} -> ${newState}`);

    switch (newState) {
      case this.states.LOADING:
        this.handleLoadingState();
        break;
      case this.states.ANIMATING:
        this.handleAnimatingState();
        break;
      case this.states.INTERACTIVE:
        this.handleInteractiveState();
        break;
      case this.states.ERROR:
        this.handleErrorState();
        break;
    }

    // Dispatch custom event for external listeners
    this.modelViewer.dispatchEvent(
      new CustomEvent("viewer-state-change", {
        detail: { previousState, currentState: newState },
      })
    );
  }

  /**
   * Handle model load completion
   */
  async handleModelLoad() {
    this.clearLoadingTimeout();
    this.hideLoadingIndicator();
    this.isModelLoaded = true;

    try {
      await this.detectModelAnimations();
      this.transitionToState(this.states.ANIMATING);
    } catch (error) {
      console.error("Error detecting animations:", error);
      // Continue to interactive state even if animation detection fails
      this.transitionToState(this.states.INTERACTIVE);
    }
  }

  /**
   * Detect and catalog available animations in the GLB model
   */
  async detectModelAnimations() {
    if (!this.modelViewer.model) {
      throw new Error("Model not loaded");
    }

    this.availableAnimations = [];

    // Check if model-viewer has animation names available
    if (
      this.modelViewer.availableAnimations &&
      this.modelViewer.availableAnimations.length > 0
    ) {
      this.availableAnimations = [...this.modelViewer.availableAnimations];
      console.log("Detected animations:", this.availableAnimations);
    } else {
      // Fallback: check the model's animations directly
      const model = this.modelViewer.model;
      if (model && model.animations && model.animations.length > 0) {
        this.availableAnimations = model.animations.map(
          (anim, index) => anim.name || `Animation_${index}`
        );
        console.log(
          "Detected animations from model:",
          this.availableAnimations
        );
      } else {
        console.log("No animations detected in model");
      }
    }
  }

  /**
   * Play the initial embedded animation
   */
  async playInitialAnimation() {
    if (this.availableAnimations.length === 0) {
      console.log("No animations to play, transitioning to interactive");
      setTimeout(
        () => this.transitionToState(this.states.INTERACTIVE),
        this.options.initialDelay
      );
      return;
    }

    try {
      // Play the first available animation
      const animationName = this.availableAnimations[0];
      this.modelViewer.animationName = animationName;
      this.modelViewer.play();

      console.log(`Playing animation: ${animationName}`);

      // Set up animation completion detection
      this.setupAnimationCompletionDetection();
    } catch (error) {
      console.error("Error playing animation:", error);
      this.transitionToState(this.states.INTERACTIVE);
    }
  }

  /**
   * Set up detection for when the initial animation completes
   */
  setupAnimationCompletionDetection() {
    // For the first loop completion, we'll use a timeout based on animation duration
    // This is a fallback since model-viewer doesn't always fire 'finished' reliably
    if (this.modelViewer.duration) {
      setTimeout(() => {
        if (this.currentState === this.states.ANIMATING) {
          this.handleAnimationComplete();
        }
      }, this.modelViewer.duration * 1000 + this.options.initialDelay);
    } else {
      // Fallback timeout if duration is not available
      setTimeout(() => {
        if (this.currentState === this.states.ANIMATING) {
          this.handleAnimationComplete();
        }
      }, 3000 + this.options.initialDelay);
    }
  }

  /**
   * Handle animation completion and transition to interactive state
   */
  handleAnimationComplete() {
    if (this.currentState === this.states.ANIMATING) {
      this.isAnimationComplete = true;
      this.transitionToState(this.states.INTERACTIVE);
    }
  }

  /**
   * Handle user interaction detection
   */
  handleUserInteraction() {
    if (this.currentState === this.states.INTERACTIVE) {
      // User is interacting with the model
      this.isUserInteracting = true;
    }
  }

  /**
   * Set user interaction state
   */
  setUserInteracting(isInteracting) {
    this.isUserInteracting = isInteracting;
  }

  /**
   * Handle loading state
   */
  handleLoadingState() {
    this.disableInteraction();
    this.modelViewer.classList.add("loading");
    this.showLoadingIndicator();
    this.startLoadingTimeout();
  }

  /**
   * Handle animating state
   */
  handleAnimatingState() {
    this.modelViewer.classList.remove("loading");
    this.modelViewer.classList.add("animating");
    this.disableInteraction();
    this.playInitialAnimation();
  }

  /**
   * Handle interactive state
   */
  handleInteractiveState() {
    this.modelViewer.classList.remove("loading", "animating");
    this.modelViewer.classList.add("interactive");
    this.enableInteraction();

    // Continue looping animation if available
    if (
      this.availableAnimations.length > 0 &&
      this.options.loopMode === "repeat"
    ) {
      this.modelViewer.play();
    }
  }

  /**
   * Handle error state
   */
  handleErrorState() {
    this.modelViewer.classList.add("error");
    this.disableInteraction();
    this.showFallback();
  }

  /**
   * Disable user interaction with the 3D model
   */
  disableInteraction() {
    this.modelViewer.cameraControls = false;
    this.modelViewer.style.pointerEvents = "none";
    this.modelViewer.setAttribute("interaction-policy", "none");
  }

  /**
   * Enable user interaction with the 3D model
   */
  enableInteraction() {
    this.modelViewer.cameraControls = true;
    this.modelViewer.style.pointerEvents = "auto";
    this.modelViewer.setAttribute("interaction-policy", "always-allow");

    // Set auto-rotate if specified
    if (this.options.autoRotateSpeed) {
      this.modelViewer.autoRotate = true;
      this.modelViewer.autoRotateDelay = 3000; // Start auto-rotate after 3 seconds of inactivity
    }
  }

  /**
   * Show loading indicator with spinner animation
   */
  showLoadingIndicator() {
    this.hideLoadingIndicator(); // Remove any existing indicator

    this.loadingIndicator = document.createElement("div");
    this.loadingIndicator.className = "model-viewer-loading";
    this.loadingIndicator.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
      </div>
      <div class="loading-text">Loading 3D Model...</div>
    `;

    this.modelViewer.appendChild(this.loadingIndicator);
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    if (this.loadingIndicator) {
      this.loadingIndicator.remove();
      this.loadingIndicator = null;
    }
  }

  /**
   * Start loading timeout to handle loading failures
   */
  startLoadingTimeout() {
    this.loadingStartTime = Date.now();

    this.loadingTimeout = setTimeout(() => {
      if (this.currentState === this.states.LOADING) {
        this.handleLoadError({
          detail: {
            message:
              "Model loading timeout - file may be too large or connection is slow",
          },
        });
      }
    }, this.options.loadingTimeout);
  }

  /**
   * Clear loading timeout
   */
  clearLoadingTimeout() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
  }

  /**
   * Handle loading errors with retry mechanism
   */
  handleLoadError(event) {
    this.clearLoadingTimeout();
    this.hideLoadingIndicator();

    this.hasError = true;
    this.errorMessage = event.detail?.message || "Failed to load 3D model";
    console.error("3D Model loading error:", this.errorMessage);

    // Attempt retry if we haven't exceeded max retries
    if (this.retryCount < this.options.maxRetries) {
      this.retryCount++;
      console.log(
        `Retrying model load (attempt ${this.retryCount}/${this.options.maxRetries})`
      );

      this.showRetryIndicator();

      setTimeout(() => {
        this.retryModelLoad();
      }, this.options.retryDelay);
    } else {
      console.error(
        `Max retries (${this.options.maxRetries}) exceeded. Showing fallback.`
      );
      this.transitionToState(this.states.ERROR);
    }
  }

  /**
   * Show retry indicator
   */
  showRetryIndicator() {
    this.hideErrorContainer();

    const retryIndicator = document.createElement("div");
    retryIndicator.className = "model-viewer-retry";
    retryIndicator.innerHTML = `
      <div class="retry-spinner">
        <div class="spinner-ring"></div>
      </div>
      <div class="retry-text">Retrying... (${this.retryCount}/${this.options.maxRetries})</div>
    `;

    this.modelViewer.appendChild(retryIndicator);

    // Remove retry indicator after delay
    setTimeout(() => {
      retryIndicator.remove();
    }, this.options.retryDelay - 500);
  }

  /**
   * Retry loading the model
   */
  retryModelLoad() {
    this.hasError = false;
    this.errorMessage = "";
    this.isModelLoaded = false;

    // Reset state and try loading again
    this.transitionToState(this.states.LOADING);

    // Force reload by updating the src attribute
    const currentSrc = this.modelViewer.src;
    this.modelViewer.src = "";

    // Small delay to ensure the src change is processed
    setTimeout(() => {
      this.modelViewer.src = currentSrc;
    }, 100);
  }

  /**
   * Show fallback content when model fails to load
   */
  showFallback() {
    this.hideLoadingIndicator();
    this.showErrorContainer();
  }

  /**
   * Show error container with fallback options
   */
  showErrorContainer() {
    this.hideErrorContainer(); // Remove any existing error container

    this.errorContainer = document.createElement("div");
    this.errorContainer.className = "model-viewer-error";

    // Check if browser supports model-viewer
    const isUnsupportedBrowser = !this.checkBrowserSupport();

    if (isUnsupportedBrowser) {
      this.errorContainer.innerHTML = `
        <div class="error-content">
          <div class="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h3 class="error-title">3D Viewer Not Supported</h3>
          <p class="error-message">Your browser doesn't support 3D model viewing. Please try using a modern browser like Chrome, Firefox, Safari, or Edge.</p>
          <div class="fallback-content">
            ${this.getFallbackContent()}
          </div>
        </div>
      `;
    } else {
      this.errorContainer.innerHTML = `
        <div class="error-content">
          <div class="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 class="error-title">Failed to Load 3D Model</h3>
          <p class="error-message">${this.errorMessage}</p>
          <div class="error-actions">
            <button class="retry-button" onclick="this.closest('model-viewer').interactiveViewer.manualRetry()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Try Again
            </button>
          </div>
          <div class="fallback-content">
            ${this.getFallbackContent()}
          </div>
        </div>
      `;
    }

    this.modelViewer.appendChild(this.errorContainer);
  }

  /**
   * Hide error container
   */
  hideErrorContainer() {
    if (this.errorContainer) {
      this.errorContainer.remove();
      this.errorContainer = null;
    }
  }

  /**
   * Get fallback content (static image or placeholder)
   */
  getFallbackContent() {
    // Try to get poster image from model-viewer
    const posterSrc = this.modelViewer.poster;
    if (posterSrc) {
      return `<img src="${posterSrc}" alt="${
        this.modelViewer.alt || "3D Model Preview"
      }" class="fallback-image">`;
    }

    // Check for fallback content in the model-viewer element
    const existingFallback =
      this.modelViewer.querySelector(".fallback-content");
    if (existingFallback) {
      return existingFallback.innerHTML;
    }

    // Default placeholder
    return `
      <div class="fallback-placeholder">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <p>3D Model Preview</p>
      </div>
    `;
  }

  /**
   * Check if browser supports model-viewer and WebGL
   */
  checkBrowserSupport() {
    // Check for WebGL support
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) {
      return false;
    }

    // Check for custom elements support (required for model-viewer)
    if (!window.customElements) {
      return false;
    }

    // Check for basic ES6 features
    try {
      new Function("class Test {}");
    } catch (e) {
      return false;
    }

    return true;
  }

  /**
   * Manual retry method for external button clicks
   */
  manualRetry() {
    this.retryCount = 0; // Reset retry count for manual retry
    this.retryModelLoad();
  }

  /**
   * Get current viewer state
   */
  getState() {
    return {
      currentState: this.currentState,
      isModelLoaded: this.isModelLoaded,
      isAnimationComplete: this.isAnimationComplete,
      isUserInteracting: this.isUserInteracting,
      hasError: this.hasError,
      errorMessage: this.errorMessage,
      availableAnimations: this.availableAnimations,
    };
  }

  /**
   * Manually trigger animation playback (for external controls)
   */
  playAnimation(animationName = null) {
    if (this.availableAnimations.length === 0) {
      console.warn("No animations available to play");
      return;
    }

    const targetAnimation = animationName || this.availableAnimations[0];
    if (this.availableAnimations.includes(targetAnimation)) {
      this.modelViewer.animationName = targetAnimation;
      this.modelViewer.play();
    } else {
      console.warn(`Animation "${targetAnimation}" not found`);
    }
  }

  /**
   * Pause animation playback
   */
  pauseAnimation() {
    this.modelViewer.pause();
  }

  /**
   * Restart animation from the beginning
   */
  restartAnimation() {
    this.modelViewer.currentTime = 0;
    this.modelViewer.play();
  }

  /**
   * Cleanup resources when viewer is destroyed
   */
  destroy() {
    // Clear timeouts
    this.clearLoadingTimeout();

    // Remove loading and error UI elements
    this.hideLoadingIndicator();
    this.hideErrorContainer();

    // Remove event listeners
    this.modelViewer.removeEventListener("load", this.handleModelLoad);
    this.modelViewer.removeEventListener("error", this.handleLoadError);
    this.modelViewer.removeEventListener(
      "finished",
      this.handleAnimationComplete
    );
    this.modelViewer.removeEventListener(
      "camera-change",
      this.handleUserInteraction
    );

    // Clean up animation resources
    if (this.animationMixer) {
      this.animationMixer.stopAllAction();
      this.animationMixer = null;
    }

    this.animationActions = [];
    this.availableAnimations = [];

    // Reset state
    this.currentState = this.states.LOADING;
    this.isModelLoaded = false;
    this.isAnimationComplete = false;
    this.isUserInteracting = false;
    this.hasError = false;
    this.errorMessage = "";
    this.retryCount = 0;
  }
}

// Auto-initialize viewers when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const modelViewers = document.querySelectorAll(
    'model-viewer[data-interactive="true"]'
  );

  modelViewers.forEach((viewer) => {
    // Get configuration from data attributes
    const options = {
      initialDelay: parseInt(viewer.dataset.initialDelay) || 1000,
      loopMode: viewer.dataset.loopMode || "repeat",
      autoRotateSpeed: viewer.dataset.autoRotateSpeed || "30deg",
    };

    // Initialize the interactive viewer
    const interactiveViewer = new Interactive3DViewer(viewer, options);

    // Store reference on the element for external access
    viewer.interactiveViewer = interactiveViewer;
  });
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = Interactive3DViewer;
}
