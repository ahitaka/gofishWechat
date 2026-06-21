import { TAB_COMMUNITY } from "../../constants/routes";
import type { FishingSpot, PublishForm } from "../../models/index";
import { uploadImages } from "../../services/file.service";
import { getMyMapSpots } from "../../services/my-spot.service";
import { createPost } from "../../services/post.service";
import { getSpots } from "../../services/spot.service";

function defaultForm(): PublishForm {
  return {
    type: "catch",
    content: "",
    images: [],
    tags: [],
    visibility: "public",
  };
}

function mergeSpots(publicSpots: FishingSpot[], mySpots: FishingSpot[]): FishingSpot[] {
  const map: Record<string, FishingSpot> = {};
  publicSpots.concat(mySpots).forEach((spot) => {
    map[spot.id] = spot;
  });
  return Object.values(map);
}

Page({
  data: {
    types: [
      { label: "晒鱼获", value: "catch" },
      { label: "分享钓点", value: "spot" },
      { label: "发布动态", value: "post" },
    ],
    visibilityOptions: [
      { label: "公开", value: "public" },
      { label: "粉丝", value: "followers" },
      { label: "私密", value: "private" },
    ],
    spots: [] as FishingSpot[],
    filteredSpots: [] as FishingSpot[],
    spotKeyword: "",
    selectedSpotName: "",
    fishText: "",
    weightText: "",
    lengthText: "",
    baitText: "",
    tagsText: "",
    form: defaultForm(),
    uploadingImages: false,
    submitting: false,
    imageUploadTasks: [] as Promise<void>[],
  },
  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: "pages/publish/index" });
    }
    this.loadSpots();
  },
  async loadSpots() {
    const [publicSpots, mySpots] = await Promise.all([getSpots(), getMyMapSpots()]);
    const spots = mergeSpots(publicSpots, mySpots);
    this.setData({
      spots,
      filteredSpots: this.filterSpots(this.data.spotKeyword, spots),
    });
  },
  filterSpots(keyword: string, spots: FishingSpot[]): FishingSpot[] {
    const value = keyword.trim();
    if (!value) {
      return spots;
    }
    return spots.filter((spot) => spot.name.includes(value) || spot.address.includes(value));
  },
  changeType(event: WechatMiniprogram.TouchEvent) {
    this.setData({ "form.type": event.currentTarget.dataset.value });
  },
  onContentInput(event: WechatMiniprogram.Input) {
    this.setData({ "form.content": event.detail.value });
  },
  trackImageUpload(task: Promise<void>) {
    const tasks = (this.data.imageUploadTasks || []).concat(task);
    this.setData({ imageUploadTasks: tasks });
    this.setData({ uploadingImages: true });
    task.finally(() => {
      const nextTasks = this.data.imageUploadTasks.filter((item) => item !== task);
      this.setData({ imageUploadTasks: nextTasks });
      if (!nextTasks.length) {
        this.setData({ uploadingImages: false });
      }
    });
  },
  getUploadedForm(): PublishForm {
    return {
      ...this.data.form,
      images: this.data.form.images.filter((url) => /^https?:\/\//.test(url)),
    };
  },
  chooseImages() {
    wx.chooseMedia({
      count: 9 - this.data.form.images.length,
      mediaType: ["image"],
      sizeType: ["compressed"],
      success: (res: WechatMiniprogram.ChooseMediaSuccessCallbackResult) => {
        const tempImages = res.tempFiles.map((file) => file.tempFilePath);
        this.setData({ "form.images": this.data.form.images.concat(tempImages).slice(0, 9) });
        const task = uploadImages(tempImages)
          .then((images) => {
            const imageMap = tempImages.reduce(
              (map: Record<string, string>, tempPath: string, index: number) => {
                map[tempPath] = images[index];
                return map;
              },
              {},
            );
            this.setData({
              "form.images": this.data.form.images.map((url) => imageMap[url] || url),
            });
          })
          .catch(() => {
            this.setData({
              "form.images": this.data.form.images.filter((url) => !tempImages.includes(url)),
            });
            wx.showToast({ title: "图片上传失败", icon: "none" });
          });
        this.trackImageUpload(task);
      },
    });
  },
  onSpotKeywordInput(event: WechatMiniprogram.Input) {
    const spotKeyword = event.detail.value;
    this.setData({
      spotKeyword,
      filteredSpots: this.filterSpots(spotKeyword, this.data.spots),
    });
  },
  chooseSpot(event: WechatMiniprogram.TouchEvent) {
    const spot = this.data.filteredSpots[Number(event.currentTarget.dataset.index)];
    if (!spot) {
      return;
    }
    wx.showModal({
      title: "确认钓点",
      content: `钓点：${spot.name}\n位置：${spot.address || "暂无位置"}`,
      confirmText: "确认",
      cancelText: "取消",
      success: (res: WechatMiniprogram.ShowModalSuccessCallbackResult) => {
        if (!res.confirm) {
          return;
        }
        this.setData({
          selectedSpotName: spot.name,
          spotKeyword: spot.name,
          filteredSpots: this.filterSpots(spot.name, this.data.spots),
          "form.spotId": spot.id,
        });
      },
    });
  },
  onFishInput(event: WechatMiniprogram.Input) {
    this.setData({
      fishText: event.detail.value,
      "form.fishSpecies": event.detail.value.split(/[ ,，、]+/).filter(Boolean),
    });
  },
  onWeightInput(event: WechatMiniprogram.Input) {
    this.setData({
      weightText: event.detail.value,
      "form.weightKg": event.detail.value ? Number(event.detail.value) : undefined,
    });
  },
  onLengthInput(event: WechatMiniprogram.Input) {
    this.setData({
      lengthText: event.detail.value,
      "form.lengthCm": event.detail.value ? Number(event.detail.value) : undefined,
    });
  },
  onBaitInput(event: WechatMiniprogram.Input) {
    this.setData({
      baitText: event.detail.value,
      "form.bait": event.detail.value,
    });
  },
  onTagsInput(event: WechatMiniprogram.Input) {
    this.setData({
      tagsText: event.detail.value,
      "form.tags": event.detail.value.split(/\s+/).filter(Boolean),
    });
  },
  changeVisibility(event: WechatMiniprogram.TouchEvent) {
    this.setData({ "form.visibility": event.currentTarget.dataset.value });
  },
  resetForm() {
    this.setData({
      imageUploadTasks: [],
      selectedSpotName: "",
      spotKeyword: "",
      filteredSpots: this.data.spots,
      fishText: "",
      weightText: "",
      lengthText: "",
      baitText: "",
      tagsText: "",
      form: defaultForm(),
      uploadingImages: false,
      submitting: false,
    });
  },
  async submit() {
    if (this.data.submitting) {
      return;
    }
    if (!this.data.form.content.trim()) {
      wx.showToast({ title: "请填写内容", icon: "none" });
      return;
    }
    if (!this.data.form.spotId) {
      wx.showToast({ title: "请选择钓点", icon: "none" });
      return;
    }
    this.setData({ submitting: true });
    try {
      await createPost(this.getUploadedForm() as unknown as Record<string, unknown>);
      wx.setStorageSync("communityNeedRefresh", true);
      wx.showToast({ title: "发布成功" });
      this.resetForm();
      setTimeout(() => {
        wx.switchTab({ url: TAB_COMMUNITY });
      }, 600);
    } catch (_error) {
      wx.showToast({ title: "发布失败", icon: "none" });
      this.setData({ submitting: false });
    }
  },
});
