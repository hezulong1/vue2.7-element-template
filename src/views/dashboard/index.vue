<template>
  <div>
    <el-button type="primary" @click="open = !open">Primary</el-button>
    <el-button type="success" @click="$router.push('/components')">Goto Components</el-button>
    <el-button type="info" @click="$router.push('/user/signin')">Signin</el-button>
    <el-button type="danger">Danger</el-button>
    <el-button type="warning">Warning</el-button>

    <br>

    <el-button type="primary" size="small">Primary</el-button>
    <el-button type="success" plain>Success</el-button>
    <el-button type="info" circle>Info</el-button>
    <el-button disabled>Disabled</el-button>
    <el-button loading>Loading</el-button>

    <div>
      <ElCollapseTransition>
        <div v-show="open">
          <div class="transition-box">el-collapse-transition</div>
          <div class="transition-box">el-collapse-transition</div>
        </div>
      </ElCollapseTransition>
      <input
        v-model="toggle"
        type="checkbox"
        true-value="true"
        false-value="false"
      >
      <br>
      <span>toggle: {{ typeof toggle }}</span>

      <input id="jack" v-model="checkedNames" type="checkbox" value="1">
      <label for="jack">Jack</label>
      <input id="john" v-model="checkedNames" type="checkbox" value="2">
      <label for="john">John</label>
      <input id="mike" v-model="checkedNames" type="checkbox" value="3">
      <label for="mike">Mike</label>
      <br>
      <span>Checked names: {{ checkedNames }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import ElCollapseTransition from '@/components/base/CollapseTransition.vue';

const open = ref(false);
const checkedNames = ref([]);
const toggle = ref('yes');
</script>

<style>
  .transition-box {
    margin-bottom: 10px;
    width: 200px;
    height: 100px;
    border-radius: 4px;
    background-color: #409EFF;
    text-align: center;
    color: #fff;
    padding: 40px 20px;
    box-sizing: border-box;
    margin-right: 20px;
  }
</style>
