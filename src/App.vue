<template>
  <div v-if="isLoading" key="loading" class="loading-wrapper">
    <LoadingComponent />
  </div>
  <div v-else class="fade">
    <div class="content">
      <div class="navbar-wrapper">
        <div class="navbar" :class="{ scrolled: scrolled }">
          <router-link v-for="page in pages" :key="page.id" :to="page.slug" class="navbar-item" active-class="active">{{ page.name }}</router-link>
        </div>
      </div>
      <RouterView />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import LoadingComponent from "@/components/LoadingComponent.vue";

let initialLoad = true;

export default defineComponent({
  name: "App",
  inject: ['pages'],
  components: { LoadingComponent },
  data() {
    return {
      scrolled: false,
    };
  },
  setup() {
    const isLoading = ref(true);

    onMounted(() => {
      if (initialLoad) {
        setTimeout(() => {
          isLoading.value = false;
          initialLoad = false;
        }, 1400);
      } else {
        isLoading.value = false;
      }
    });

    return { isLoading };
  },
  methods: {
    handleScroll() {
      this.scrolled = window.scrollY > 0;
    },
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll);
  }
});
</script>

<style>
div {
  animation: fade-in 0.5s;
  animation-fill-mode: forwards;
}

body::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url("assets/img/background.png") no-repeat;
  background-size: cover;
  filter: blur(0.08vh) brightness(0.8) contrast(1.2) saturate(1.2);
  z-index: -1;
}

body {
  background-color: rgba(25, 25, 25);
  font-family: 'JetBrains Mono', sans-serif;
  color: #fff;
  margin: 0;
  padding: 0;
}

.navbar-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  height: 100px;
  width: 100%;
  top: 0;
  z-index: 99;
}

.navbar {
  background-color: rgba(25, 25, 25, 0.2);
  padding: 15px;
  border-radius: 25px;
  box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.3);
  background-color: rgba(25, 25, 25, 0.2);
  transition: background-color 0.3s ease;
}

.navbar.scrolled {
  background-color: rgba(25, 25, 25, 0.8);
}

.navbar-item {
  color: #fff;
  text-decoration: none;
  margin: 0 20px;
  font-size: 20px;
  text-transform: uppercase;
  position: relative;
}

.navbar-item::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  height: 2px;
  width: 0;
  background: white;
  transition: width 0.3s ease, opacity 0.3s ease;
  opacity: 0;
}

.navbar-item:hover::after {
  width: 100%;
  opacity: 1;
}

.active::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  height: 2px;
  width: 100%;
  background: white;
  transition: width 0.3s ease, opacity 0.3s ease;
  opacity: 1;
}

.content {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 100px;
  flex-direction: column;
}

.fade {
  animation: fade-in 1s;
}

@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes fade-out {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
</style>