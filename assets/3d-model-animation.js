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

    // Set up event listeners
    this.modelViewer.addEventListener("load", () => {
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
    if (animations && animations.length > 0 && window.THREE) {
      try {
        // Play the first animation using THREE.js
        const mixer = new window.THREE.AnimationMixer(model);
        const action = mixer.clipAction(animations[0]);
        action.setLoop(window.THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.play();

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

        // Mark animation as complete after duration
        setTimeout(() => {
          this.isInitialAnimationComplete = true;
          this.startAutoRotate();
        }, this.initialAnimationDuration);
      } catch (error) {
        console.log(
          "Animation playback failed, falling back to camera animation:",
          error
        );
        this.playCameraAnimation();
      }
    } else {
      // If no animations, play a camera animation instead
      this.playCameraAnimation();
    }
  }

  playCameraAnimation() {
    // Create a simple camera animation that zooms in and rotates
    const startTime = Date.now();
    const duration = this.initialAnimationDuration;

    // Wait a bit for the model to be fully loaded
    setTimeout(() => {
      try {
        // Store initial camera position
        const initialCameraOrbit = this.modelViewer.getCameraOrbit();

        if (!initialCameraOrbit) {
          // Fallback if camera orbit is not available
          setTimeout(() => {
            this.isInitialAnimationComplete = true;
            this.startAutoRotate();
          }, 1000);
          return;
        }

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          if (progress < 1 && !this.isInitialAnimationComplete) {
            // Create a smooth easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);

            // Animate camera orbit (zoom in and rotate)
            const newRadius = initialCameraOrbit.radius * (1 - easeOut * 0.3); // Zoom in 30%
            const newTheta = initialCameraOrbit.theta + easeOut * Math.PI * 2; // Full rotation
            const newPhi = initialCameraOrbit.phi + easeOut * Math.PI * 0.5; // Tilt up

            try {
              this.modelViewer.setCameraOrbit(
                newTheta,
                newPhi,
                newRadius,
                initialCameraOrbit.target.x,
                initialCameraOrbit.target.y,
                initialCameraOrbit.target.z
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
