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
  margin: 100px auto;
  box-shadow: 0 0 70px 6px rgb(0 0 0/6%);
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
  background-image: url(https://cdn.exia.xyz/img/blog/tiger.png);
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
