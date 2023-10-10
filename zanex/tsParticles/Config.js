(async () => {
  await loadPolygonPath(tsParticles);

  await tsParticles.load({
    particles: {
      color: {
        value: "#8600ff"
      },
      move: {
        attract: {
          enable: false,
          distance: 100,
          rotate: {
            x: 2000,
            y: 2000
          }
        },
        direction: "none",
        enable: true,
        outModes: {
          default: "destroy"
        },
        path: {
          clamp: false,
          enable: true,
          delay: {
            value: 0
          },
          generator: "polygonPathGenerator",
          options: {
            sides: 6,
            turnSteps: 50,
            angle: 50
          }
        },
        random: false,
        speed: 5,
        straight: false,
        trail: {
          fillColor: "#000",
          length: 20,
          enable: true
        }
      },
      number: {
        density: {
          enable: true,
          area: 1000
        },
        value: 0
      },
      opacity: {
        value: 0.5
      },
      shape: {
        type: "circle"
      },
      size: {
        value: 3
      }
    },
    fullScreen: {
      zIndex: -1
    },
    emitters: {
      direction: "none",
      rate: {
        quantity: 1,
        delay: 0.25
      },
      size: {
        width: 0,
        height: 0
      },
      position: {
        x: 50,
        y: 50
      }
    }
  });
})();