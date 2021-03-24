<template>
  <div id="main">
  </div>
</template>

<script>
export default {
  name: "noteMain",
  methods:{
    createNote(){
      this.$router.push({path:'/'+this.randomString(8)});
    },
    randomString(e) {
      e = e || 32;
      let t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
          a = t.length,
          n = "",
          i = 0;
      for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
      return n
    }
  },
  created(){
    this.createNote();
  }

}
</script>

<style scoped>

#new{
  width: 100px;
  height: 140px;
  /*border: 1px solid black;*/
  text-align: center;
  border-radius: 10px;
  margin: 50px auto;
  cursor: pointer;
}
#new img{
  width: 100px;
  height: 100px;
}
@media screen and (max-width: 768px) {
  #new img{
    width: 50px;
    height: 50px;
  }
  #new{
    width:65px;
    height: 90px;
  }
}
</style>