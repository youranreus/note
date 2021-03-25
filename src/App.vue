<template>
  <div id="app">
    <router-view/>
  </div>

</template>

<script>
</script>

<style>
#app {
  width: 800px;
  padding: 15px;
  border-radius: 15px;
  margin: 20px auto;
  border: 2px solid RGBA(0,0,0,0.02);
  background: #fff;
}

*{
  font-family: BlinkMacSystemFont, "Hiragino Sans GB", "Microsoft YaHei", 微软雅黑, sans-serif;
}

html::before {
  content: '';
  position: fixed;
  z-index: -1;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  background-repeat: no-repeat;
  background-size: cover;
  -webkit-background-size: cover;
  -o-background-size: cover;
  background-position: center 0;
  background-image: url(/bg_pattern1.png);
}
.clear,.clear::before,.clear::after{
  display: block;
  clear: both;
}
.clear::before,.clear::after{
  content: '';
}

@media screen and (max-width: 768px) {
  #app{
    width: 90%;
  }
}

</style>
