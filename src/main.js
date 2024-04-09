import { createWebHashHistory, createRouter } from "vue-router";
import { createApp } from 'vue'
import App from './App.vue'
import HomePage from "@/pages/HomePage.vue";
import ProjectsPage from "@/pages/ProjectsPage.vue";
import ContactPage from "@/pages/ContactPage.vue";

const pages = [
    { id: 1, name: 'Home', slug: '/', isLoaded: false },
    { id: 2, name: 'Projects', slug: '/projects', isLoaded: false },
    { id: 2, name: 'Contact', slug: '/contact', isLoaded: false },
];

const routes = [
    { path: '/', component: HomePage, name: 'Home' },
    { path: '/projects', component: ProjectsPage, name: 'Projects' },
    { path: '/contact', component: ContactPage, name: 'Contact' }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    document.title = "zanex.dev - " + to.name;
    const page = pages.find(page => page.slug === to.path);
    if (page) {
        page.isLoaded = true;
    }
    next();
});

const app = createApp(App);
app.use(router);
app.provide('pages', pages);
app.mount('#app');