<template>
  <div class="loading-bar-wrapper">
    <div class="typewriter">
      <h1>Loading zanex.dev</h1>
    </div>
    <div class="loading-bar"></div>
  </div>
</template>

<script>
export default {
  name: "LoadingComponent"
}
</script>

<style scoped>
.loading-bar {
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 5px;
  width: 150px;
  background-color: transparent;
  border-radius: 5px;
  overflow: hidden;
}

@keyframes loading {
  0% { transform: translateX(-100%); }
  50%, 75% { transform: translateX(0%); }
  100% { transform: translateX(0%); }
}

.loading-bar::before {
  content: "";
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: #fff;
  animation: loading 2.8s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}

.loading-bar-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  opacity: 0;
  animation: fade-in 0.5s forwards;
}

.typewriter {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: "JetBrainsMono NF", monospace;
  font-size: 2vw;
  color: #fff;
}

.typewriter h1 {
  overflow: hidden;
  white-space: nowrap;
  margin: 0 auto;
  letter-spacing: .15em;
  animation: typing 0.5s steps(40, end);
}

.typewriter h1::after {
  animation: blink-caret .75s step-end infinite;
  visibility: hidden;
}

@keyframes typing {
  from { width: 0 }
  to {
    width: 100%;
    visibility: visible;
  }
}

@keyframes blink-caret {
  from, to { border-color: transparent }
  50% { border-color: white; }
}
</style>