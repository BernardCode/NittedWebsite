// Enhanced 3D Model Animation Controller
class ModelAnimationController {
  constructor(modelViewer) {
    this.modelViewer = modelViewer;
    this.isInitialAnimationComplete = false;
    this.isUserInteracting = false;
    this.autoRotateSpeed = 0.5; // Degrees per second
    this.initialAnimationDuration = 3000; // 3 seconds
    this.setupModel();
  }

  setupModel() {
    // Disable auto-rotate initially
    this.modelViewer.autoRotate = false;

    // Add loading state
    this.modelViewer.style.opacity = "0.7";
    this.modelViewer.style.transition = "opacity 0.5s ease";

    // Configure model viewer settings for better performance
    this.modelViewer.exposure = 1.2; // Increase exposure for better visibility
    this.modelViewer.shadowIntensity = 0; // Remove shadows
    this.modelViewer.environmentImage = null; // Remove environment reflections
    this.modelViewer.shadowSoftness = 0; // Remove soft shadows
    this.modelViewer.cameraOrbit = "0deg 0deg 2.5m"; // Start directly in front, closer
    this.modelViewer.fieldOfView = "30deg"; // More zoomed in
    this.modelViewer.minCameraOrbit = "auto auto 1.5m"; // Closer minimum zoom
    this.modelViewer.maxCameraOrbit = "auto auto 4m"; // Reasonable maximum zoom

    // Performance optimizations
    this.modelViewer.renderScale = 0.8; // Slightly lower resolution for better performance
    this.modelViewer.powerPreference = "high-performance";
    this.modelViewer.autoRotateDelay = 0;

    // Set up event listeners
    this.modelViewer.addEventListener("load", () => {
      if (!window.THREE) {
        console.warn(
          "window.THREE is not available. Animations may not play. Do not import Three.js directly; model-viewer provides it internally."
        );
      }
      this.fixMaterials();
      this.playInitialAnimation();
    });

    // Track user interaction
    this.modelViewer.addEventListener("camera-change", () => {
      if (this.isInitialAnimationComplete) {
        this.isUserInteracting = true;
        // Stop auto-rotate when user interacts
        this.modelViewer.autoRotate = false;

        // Resume auto-rotate after user stops interacting
        clearTimeout(this.interactionTimeout);
        this.interactionTimeout = setTimeout(() => {
          this.isUserInteracting = false;
          this.startAutoRotate();
        }, 2000); // 2 second delay after user stops interacting
      }
    });

    // Handle touch/mouse events
    this.modelViewer.addEventListener("pointerdown", () => {
      if (this.isInitialAnimationComplete) {
        this.isUserInteracting = true;
        this.modelViewer.autoRotate = false;
        this.modelViewer.style.cursor = "grabbing";
      }
    });

    this.modelViewer.addEventListener("pointerup", () => {
      if (this.isInitialAnimationComplete) {
        this.modelViewer.style.cursor = "grab";
        clearTimeout(this.interactionTimeout);
        this.interactionTimeout = setTimeout(() => {
          this.isUserInteracting = false;
          this.startAutoRotate();
        }, 2000);
      }
    });
  }

  playInitialAnimation() {
    // Get the model and its animations
    const model = this.modelViewer.model;
    if (!model) {
      // If model isn't loaded yet, try again in a bit
      setTimeout(() => this.playInitialAnimation(), 100);
      return;
    }

    // Check if the model has animations
    const animations = model.animations;
    console.log("Model animations found:", animations ? animations.length : 0);

    if (animations && animations.length > 0) {
      console.log(
        "Animation names:",
        animations.map((anim) => anim.name)
      );
      console.log("First animation duration:", animations[0].duration);

      if (window.THREE) {
        try {
          // Play the first animation using THREE.js
          const mixer = new window.THREE.AnimationMixer(model);
          const action = mixer.clipAction(animations[0]);
          action.setLoop(window.THREE.LoopOnce);
          action.clampWhenFinished = true;
          action.timeScale = 1.0; // Normal speed
          action.play();

          console.log("Animation started playing");

          // Update the mixer during the animation
          const clock = new window.THREE.Clock();
          const animate = () => {
            if (!this.isInitialAnimationComplete) {
              const delta = clock.getDelta();
              mixer.update(delta);
              requestAnimationFrame(animate);
            }
          };
          animate();

          // Mark animation as complete after the actual animation duration
          const animationDuration = animations[0].duration * 1000; // Convert to milliseconds
          console.log("Animation will complete in:", animationDuration, "ms");

          setTimeout(() => {
            this.isInitialAnimationComplete = true;
            this.startAutoRotate();
          }, Math.max(animationDuration, this.initialAnimationDuration));
        } catch (error) {
          console.log(
            "Animation playback failed, falling back to camera animation:",
            error
          );
          this.playCameraAnimation();
        }
      } else {
        console.log("THREE.js not available, using camera animation");
        this.playCameraAnimation();
      }
    } else {
      console.log("No animations found, using camera animation");
      // If no animations, play a camera animation instead
      this.playCameraAnimation();
    }
  }

  playCameraAnimation() {
    // Create a simple camera animation that starts from front view
    const startTime = Date.now();
    const duration = this.initialAnimationDuration;

    // Wait a bit for the model to be fully loaded
    setTimeout(() => {
      try {
        // Start from front view (0 degrees theta, 0 degrees phi)
        const startTheta = 0; // Front view
        const startPhi = 0; // Level view
        const startRadius = 2.5; // Close view

        // Create a more interesting animation path
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          if (progress < 1 && !this.isInitialAnimationComplete) {
            // Create a smooth easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);

            // Create a figure-8 pattern for more interesting movement
            const t = progress * Math.PI * 2;
            const newTheta = Math.sin(t) * 0.3; // Gentle side-to-side
            const newPhi = Math.sin(t * 2) * 0.1; // Gentle up-down
            const newRadius = startRadius + Math.sin(t * 3) * 0.3; // Gentle zoom in/out

            try {
              this.modelViewer.setCameraOrbit(
                newTheta,
                newPhi,
                newRadius,
                0, // target x
                0, // target y
                0 // target z
              );
            } catch (error) {
              console.log("Camera animation error:", error);
              // If camera animation fails, just complete the animation
              this.isInitialAnimationComplete = true;
              this.startAutoRotate();
              return;
            }

            requestAnimationFrame(animate);
          } else {
            this.isInitialAnimationComplete = true;
            this.startAutoRotate();
          }
        };

        animate();
      } catch (error) {
        console.log("Camera animation setup failed:", error);
        // Fallback to just auto-rotate
        setTimeout(() => {
          this.isInitialAnimationComplete = true;
          this.startAutoRotate();
        }, 1000);
      }
    }, 500); // Wait 500ms for model to be ready
  }

  startAutoRotate() {
    if (this.isInitialAnimationComplete && !this.isUserInteracting) {
      this.modelViewer.autoRotate = true;
      this.modelViewer.autoRotateDelay = 0;
      this.modelViewer.autoRotateSpeed = this.autoRotateSpeed;

      // Show the model is ready for interaction
      this.modelViewer.style.opacity = "1";
      this.modelViewer.setAttribute("loaded", "");

      // Add a subtle cursor hint
      this.modelViewer.style.cursor = "grab";
      this.modelViewer.title = "Drag to rotate • Scroll to zoom";
    }
  }

  fixMaterials() {
    // Fix material rendering issues
    try {
      const model = this.modelViewer.model;
      if (model && window.THREE) {
        // Traverse all objects in the model
        model.traverse((child) => {
          if (child.isMesh && child.material) {
            // Ensure materials are not transparent unless intended
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                mat.transparent = false;
                mat.opacity = 1.0;
                mat.side = window.THREE.DoubleSide; // Render both sides
              });
            } else {
              child.material.transparent = false;
              child.material.opacity = 1.0;
              child.material.side = window.THREE.DoubleSide; // Render both sides
            }
          }
        });
      }
    } catch (error) {
      console.log("Material fix failed:", error);
    }
  }

  stopAutoRotate() {
    this.modelViewer.autoRotate = false;
  }
}

// Initialize the controller when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const modelViewer = document.querySelector("model-viewer");
  if (modelViewer) {
    new ModelAnimationController(modelViewer);
  }
});

// Also handle dynamic loading
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const modelViewer = document.querySelector("model-viewer");
    if (modelViewer) {
      new ModelAnimationController(modelViewer);
    }
  });
} else {
  const modelViewer = document.querySelector("model-viewer");
  if (modelViewer) {
    new ModelAnimationController(modelViewer);
  }
}
