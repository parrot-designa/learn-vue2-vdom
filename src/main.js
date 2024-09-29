import Vue from "vue";
import App from "./App.vue"; 

function render(h){
    return h(App);
}  
new Vue({
    render:render
}).$mount("#app");

