<template>
  <div id="toolbar-wrapper">
    <div id="toolbar">
      <img src="edit.svg" alt="编辑">
      <img src="share.svg" alt="分享">
    </div>
  </div>
</template>

<script>
export default {
  name: "toolbar"
}
</script>

<style scoped>
#toolbar-wrapper{
  width: 100%;
}

#toolbar{
  display: block;
  margin: 0 auto;
  width: 134px;
  height: 60px;
  line-height: 60px;
  background: RGBA(255,255,255,0.9);
  text-align: center;
  border-radius: 100000rem;
}
#toolbar img{
  width: 34px;
  height: 34px;
  margin: 13px;
}
#toolbar img:first-child{
  margin-left: 20px;
}
#toolbar img:last-child{
  margin-right: 20px;
}
</style>