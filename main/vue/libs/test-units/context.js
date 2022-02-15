function beforeCreate() {
    this.p3.a = 999;
    this.p3 = {a: 1000};
    this.p3.a++;
    this.p3.a++;
}

const common = {
    staticData: 100,
    computed: {
        p1() {
            return 666;
        },
        p2() {
            return this.p1 + 200;
        },
        p3: {
            get() {
                this.p3RefreshTime++;
                return this.p4;
            },
            set(v) {
                this.p4 = v;
            }
        },
        p5() {
            return JSON.stringify(this.p3);
        },
        p5History() {
            this.arr.push(this.p5);
            return this.arr;
        }
    },
    data() {
        return {
            p4: {
                a: 100
            },
            p3RefreshTime: 0,
            arr: []
        };
    },
    methods: {
        test() {
            console.log(this.data)
        }
    },
};

export const compatibleContext = {
    ...common,
    ...typeof wx === "undefined" ? {
        mounted: beforeCreate
    } : {beforeCreate}
};

export const runtimeContext = {
    ...common,
    mounted: beforeCreate
};