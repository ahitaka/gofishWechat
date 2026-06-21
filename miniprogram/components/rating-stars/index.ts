Component({
  properties: {
    score: {
      type: Number,
      value: 0,
      observer() {
        this.updateStars();
      },
    },
  },
  data: {
    stars: [] as { active: boolean }[],
    scoreText: "0.0",
  },
  lifetimes: {
    attached() {
      this.updateStars();
    },
  },
  methods: {
    updateStars() {
      const score = Math.max(0, Math.min(5, Number(this.data.score) || 0));
      const activeCount = Math.round(score);
      this.setData({
        scoreText: score.toFixed(1),
        stars: [1, 2, 3, 4, 5].map((item) => ({ active: item <= activeCount })),
      });
    },
  },
});
