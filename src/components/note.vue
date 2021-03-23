<template>
    <div id="note">
      <textarea name="content" id="content" rows="10" v-model="content"></textarea>
      <toolbar/>
    </div>
</template>

<script>
import toolbar from "@/components/toolbar.vue";
export default {
  name: "note",
  components:{
    toolbar
  },
  data(){
    return {
      sid: this.$route.params.sid,
      content: "加载中...",
      key: ""
    }
  }
}
</script>

<style scoped>
#note{
  position: relative;
}
textarea{
  display: inline-block;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  padding: .5em .6em;
  border: 0;
  border-radius: 5px;
  background: rgba(250,250,250,0.9);
  color: #43454A;
  resize: none;
  width: 100%;
  margin-bottom: 10px;
  outline: none;
  font-size: 17px;
}
</style>