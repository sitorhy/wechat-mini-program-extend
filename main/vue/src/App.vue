<template>
  <div style="text-align: center;">
    <div id="nav">
      <router-link to="/">Home</router-link>
      |
      <router-link to="/checked">环境自检</router-link>
      |
      <router-link to="/props">Props</router-link>
      |
      <router-link to="/computed">Computed</router-link>
      |
      <router-link to="/watch">Watch</router-link>
      |
      <router-link to="/options">Options</router-link>
      |
      <router-link to="/provide">Provide</router-link>
      |
      <router-link to="/mixins">Mixins</router-link>
      |
      <router-link to="/query">Query</router-link>
      |
      <router-link to="/context">Context</router-link>
      |
      <router-link to="/store">Store</router-link>
      |
      <router-link to="/snake">综合测试 - 贪吃蛇</router-link>
    </div>
    <router-view/>
  </div>
</template>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
