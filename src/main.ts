import '@/styles/ui/index.scss';
import '@/styles/index.scss';

import Vue from 'vue';
// Setup
import { createPinia, PiniaVuePlugin } from 'pinia';
import ElementUI from 'element-ui';
import router from './router';
import App from './App.vue';

Vue.config.productionTip = false;
Vue.use(ElementUI);
Vue.use(PiniaVuePlugin);

const pinia = createPinia();

new Vue({
  router,
  pinia,
  render: h => h(App),
}).$mount('#app');
