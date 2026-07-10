<template>
  <div>
    <fieldset>
      <legend>CollapseTransition</legend>
      <el-button @click="open = !open">CollapseTransition</el-button>
      <ElCollapseTransition>
        <div v-show="open">
          <div class="transition-box">el-collapse-transition</div>
          <div class="transition-box">el-collapse-transition</div>
        </div>
      </ElCollapseTransition>
    </fieldset>

    <fieldset>
      <legend>Checkbox & Radio</legend>
      <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAllChange">全选</el-checkbox>
      <el-checkbox-group v-model="checkedCities" @change="handleCheckedCitiesChange">
        <el-checkbox v-for="city in cities" :key="city" :label="city" />
      </el-checkbox-group>
      <el-radio-group v-model="radio">
        <el-radio value="1">备选项 A</el-radio>
        <el-radio label="2">备选项 B</el-radio>
      </el-radio-group>
      <el-radio-group v-model="radio">
        <el-radio label="1" button>备选项 C</el-radio>
        <el-radio label="2" button>备选项 D</el-radio>
      </el-radio-group>
    </fieldset>

    <fieldset>
      <legend>Scrollbar</legend>
      <div class="wrapper">
        <el-scrollbar>
          <div v-for="item in 20" :key="item" class="item">item {{ item }}</div>
        </el-scrollbar>
      </div>
    </fieldset>

    <fieldset>
      <legend>Teleport</legend>
      <button id="show-modal" @click="showModal = true"><span>Show Modal</span>   <b>1</b></button>

      <button @click="disabled = !disabled">{{ disabled ? 'off' : 'on' }}</button>
      <el-checkbox v-model="toRef" true-value="body" false-value="#target">{{ toRef }}</el-checkbox>

      <el-teleport ref="telRef" :to="toRef" :disabled="disabled">
        <Modal :show="showModal" @close="showModal = false">
          <template #header>
            <h3>Custom Header</h3>
          </template>

          <template #body>
            <input>
            <input>
            <input>
            <input>
          </template>
        </Modal>
      </el-teleport>

      <div id="target">
        <h1>I am Target</h1>
      </div>

      <p>🚀Open Devtools to see what is going on</p>
    </fieldset>

    <fieldset>
      <legend>Tooltip</legend>
      <el-tooltip
        content="<b>Hello</b>"
        raw-content
        effect="light"
        placement="top"
        :hide-after="100"
      >
        <el-button>Top</el-button>
      </el-tooltip>
    </fieldset>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import ElCollapseTransition from '@/components/base/CollapseTransition.vue';
import Modal from '../components/Modal.vue';
// CollapseTransition
const open = ref(false);

// Checkbox
const cities = ['上海', '北京', '广州', '深圳'];
const checkAll = ref(false);
const checkedCities = ref(['上海', '北京']);
const isIndeterminate = ref(true);
function handleCheckAllChange(val: boolean) {
  checkedCities.value = val ? [...cities] : [];
  isIndeterminate.value = false;
}
function handleCheckedCitiesChange(value: string[]) {
  let checkedCount = value.length;
  checkAll.value = checkedCount === cities.length;
  isIndeterminate.value = checkedCount > 0 && checkedCount < cities.length;
}

// Radio
const radio = ref('1');

// Teleport
const showModal = ref(false);
const disabled = ref(false);
const telRef = ref();
const toRef = ref('body');
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

  .wrapper {
    display: flex;
    height: 20vh;
    flex-direction: column;
    overflow: hidden;
    background: #fff;
  }
</style>
