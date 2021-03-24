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