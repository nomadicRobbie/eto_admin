<template>
  <div id="app">
    <MainNavigation />
    <router-view />
  </div>
</template>

<script>
import MainNavigation from "./components/MainNavigation.vue";

export default {
  name: "App",
  components: {
    MainNavigation,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  background-color: var(--background-colour);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: inherit;
}
</style>
