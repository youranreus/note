import Vue from 'vue'
import App from './App.vue'
import Vuex from 'vuex'
import router from './router'
import axios from "axios"
import Clipboard from 'v-clipboard3';


Vue.config.productionTip = false
Vue.use(Vuex);
Vue.prototype.$axios = axios
Vue.use(Clipboard)

const operation = new Vuex.Store({
  state: {
    count: 0,
    edit: false
  },
  mutations: {
    edit(state){
      state.edit = true
    },
    cancel(state){
      state.edit = false
    }
  }
})

new Vue({
  router,
  render: h => h(App),
  store: operation
}).$mount('#app')
