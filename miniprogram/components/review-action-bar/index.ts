Component({
  properties: {
    disabled: Boolean,
  },
  methods: {
    approve() {
      this.triggerEvent("approve");
    },
    reject() {
      this.triggerEvent("reject");
    },
  },
});
