<template>
  <div id="toolbar-wrapper">
    <div id="toolbar">
      <img src="edit.svg" alt="编辑" @click="edit">
      <img src="share.svg" alt="分享" @click="handleCopy">
    </div>
  </div>
</template>

<script>
import { useClipboard } from 'v-clipboard3';
export default {
  name: "toolbar",
  data(){
    return {
      onEdit: false
    }
  },
  methods:{
    edit(){
      if(!this.$store.state.edit)
      {
        this.$store.commit('edit')
      }
      else
      {
        this.$store.commit('cancel')
      }
    },
   async handleCopy() {
    try {
      await useClipboard(location.href);
      alert('已将链接复制至粘贴板');
    } catch (error) {
      console.log(error);
      alert('复制链接失败辣QAQ');
    }
  },
  }
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
  cursor: pointer;
}
#toolbar img:first-child{
  margin-left: 20px;
}
#toolbar img:last-child{
  margin-right: 20px;
}
</style>