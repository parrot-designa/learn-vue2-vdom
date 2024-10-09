<template>
  <Child />
</template>

<script>
import Child from "./child.vue";
console.log(Child);
export default {
  components: { Child },
  data() {
    return {
      apple: "苹果",
      dynamicComponent: "span",
    };
  },
};
</script>

 