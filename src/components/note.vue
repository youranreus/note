<template>
    <div id="note" class="clear">
      <textarea name="content" id="content" rows="10" v-model="content"></textarea>
      <toolbar/>
      <div id="key-area" v-if="this.$store.state.edit">
        <input type="text" v-model="key" placeholder="密钥">
        <button @click="updateNote">修改</button>
      </div>
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
  },
  methods:{
    getContent(){
      let that = this;
      that.$axios.get("https://i.exia.xyz/note/get/"+this.sid).then(response => {
        that.$nextTick(() => {
          if(response.data.content === undefined)
          {
            that.content = response.data[0].content;
          }
          else
          {
            that.content = response.data.content;
            that.key = response.data.key;
          }
        })
      });
    },
    updateNote(){
      let that = this;
      if(that.key === "")
      {
        alert("请填写密钥");
        return;
      }
      that.$axios.get("https://i.exia.xyz/note/modify/"+this.sid+"?key="+that.key+"&content="+that.content).then(response => {
        that.$nextTick(() => {
          console.log(response);
          if(response.data !== 1)
          {
            if(response.data === 0)
            {
              alert("真的有改动吗");
            }
            else
            {
              alert(response.data);
            }

          }
          else
          {
            alert("修改成功");
          }
        })
      });
    }
  },
  created() {
    this.getContent();
  }
}
</script>

<style scoped>
#note{
  position: relative;
}
textarea,#key-area input{
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
#key-area{
  text-align: center;
}
#key-area input{
  width: 100px;
}
#key-area button{
  padding: .5rem 1.6rem;
  border-radius: 100rem;
  display: inline-block;
  opacity: 1;
  font-size: .875rem;
  line-height: 1.5;
  font-weight: 500;
  color: white!important;
  border: .0625rem solid rgba(250,250,250,0.7) !important;
  background: #07F;
  outline: none;
  margin-left: 20px;
}
</style>