<template>
  <div>
    <fieldset>
      <legend>CollapseTransition</legend>
      <el-flex items="center">
        <span>属性：</span>
        <code>fade=</code><el-checkbox v-model="fade">{{ fade }}</el-checkbox>
      </el-flex>
      <el-button @click="open = !open">{{ open ? 'Visible' : 'Hidden' }}</el-button>

      <ElCollapseTransition :fade="fade">
        <div v-show="open">
          <div class="transition-box">el-collapse-transition</div>
          <div class="transition-box">el-collapse-transition</div>
        </div>
      </ElCollapseTransition>
    </fieldset>

    <fieldset>
      <legend>Checkbox & Radio</legend>
      <el-flex items="center">
        <span>属性：</span>
        <code>button =</code><el-checkbox v-model="buttonFace">{{ buttonFace }}</el-checkbox>
      </el-flex>

      <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAllChange">全选</el-checkbox>
      <el-checkbox-group v-model="checkedCities" :button="buttonFace" @change="handleCheckedCitiesChange">
        <el-checkbox v-for="city in cities" :key="city" :label="city" />
      </el-checkbox-group>

      <el-radio-group v-model="radio" :button="buttonFace">
        <el-radio value="1">在职</el-radio>
        <el-radio label="2">离职</el-radio>
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
      <el-flex items="center">
        <span>属性：</span>
        <code>disabled=</code>
        <el-button small style="margin-right: 4px" @click="disabled = !disabled">{{ disabled }}</el-button>
        <code>to=</code>
        <el-radio v-model="toRef" label="body">Body</el-radio>
        <el-radio v-model="toRef" label="#target">#target</el-radio>
      </el-flex>
      <el-button id="show-modal" type="primary" plain @click="showModal = true">Show Modal</el-button>

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
        content="<b>确认删除</b>"
        raw-content
        placement="top"
        trigger="click"
        :hide-after="100"
      >
        <el-button type="danger">Delete</el-button>
      </el-tooltip>
    </fieldset>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import ElCollapseTransition from '@/components/base/CollapseTransition.vue';
import Modal from './Modal.vue';
// CollapseTransition
const open = ref(false);
const fade = ref(false);

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
const buttonFace = ref(false);

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
