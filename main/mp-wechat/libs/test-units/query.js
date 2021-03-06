const mixin = {
    watch: {
        p6: {
            handler(v, ov) {
                console.log(`immediate test p6_2 ${JSON.stringify(ov)} => ${JSON.stringify(v)}`);
            },
            immediate: true
        }
    }
};

export default {
    mixins: [mixin],
    props: {
        p1: {
            type: Number,
            default: 0
        },
        p2: {
            type: String,
            default: "str"
        }
    },
    computed: {
        p4() {
            return 666;
        },
        p5() {
            return this.p4 + 200;
        },
        p6: {
            get() {
                this.p6Count++;
                return this.p6Entity;
            },
            set(v) {
                console.log('p6 setter');
                this.p6Entity = v;
            }
        },
        p6Str() {
            return JSON.stringify(this.p6);
        }
    },
    data() {
        return {
            p3: "",
            p6Count: 0,
            p6Entity: {a: 100}
        }
    },
    watch: {
        p6: {
            handler(v, ov) {
                console.log(`immediate test p6 ${JSON.stringify(ov)} => ${JSON.stringify(v)}`);
            },
            immediate: true,
            deep: true
        },
        p1: {
            handler: function (v, ov) {
                console.log(`p1 ${ov} => ${v}`);
                this.p3 = this.p2 + " " + this.p1;
            },
            immediate: true // Vue外部属性会覆盖默认值，不会触发
        },
        p2(v, ov) {
            console.log(`p2 ${ov} => ${v}`);
            this.p3 = this.p2 + " " + this.p1;
        }
    },
    mounted() {
        this.p6.a = 999;
    }
}