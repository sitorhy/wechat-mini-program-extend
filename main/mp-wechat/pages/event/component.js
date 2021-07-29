import {ComponentEx} from "../../libs/mp-extend/extend";

ComponentEx({
    properties: {
        index: {
            type: Number
        }
    },
    data: {},
    methods: {
        checkParent() {
            console.log('--component--');
            console.log(this.$children);
            console.log(this.$parent);
            console.log('--component--');
        }
    }
});
