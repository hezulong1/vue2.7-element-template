import '@/styles/index.scss';

import Vue from 'vue';
// Setup
import ElementUI from 'element-ui';
import router from './router';
import App from './App.vue';

Vue.config.productionTip = false;
Vue.use(ElementUI);

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
