<template>
  <div>
    <p><span>num={{ num }}</span></p>
    <p><span>str={{ str }}</span></p>
    <p><span>bool={{ bool }}</span></p>
    <p><span>obj={{ obj }}</span></p>
    <p><span>name={{ name }}</span></p>
    <p><span>d={{ d }}</span></p>
    <p><span>dd={{ dd }}</span></p>
    <p><span>c={{ c }}</span></p>
    <p><span>e={{ e }}</span></p>
    <p><span>age={{ age }}</span></p>
    <p><span>foods={{ foods }}</span></p>
    <p><span>f={{ f }}</span></p>
    <p><span>f[0].obj.num2=</span><span>{{  f[0].obj.num2 }}</span></p>
    <p><span>h={{ h }}</span></p>
  </div>
</template>

<script>
import Props from "../../libs/test-units/props";

export default {
  name: "Props",
  ...Props
}
</script>

<style scoped>

</style>