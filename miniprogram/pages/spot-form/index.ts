import { PAGE_MY_SPOTS, toMySpotDetail } from "../../constants/routes";
import type { MySpotDetail, SpotFormData } from "../../models/index";
import { uploadImages } from "../../services/file.service";
import { reverseGeocode } from "../../services/geo.service";
import {
  getMySpotDetail,
  rememberPendingSpotImages,
  savePrivateSpot,
  savePrivateSpotQuiet,
  submitPublishReview,
  submitUpdateReview,
  syncPendingSpotSnapshotQuiet,
} from "../../services/my-spot.service";

const emptyForm: SpotFormData = {
  name: "",
  type: "RIVER",
  description: "",
  province: "",
  city: "",
  district: "",
  address: "",
  latitude: null,
  longitude: null,
  coverUrl: "",
  imageUrls: [],
  fishSpecies: [],
  feeType: "FREE",
  feeAmount: null,
  parkingSupported: false,
  nightFishingSupported: false,
  visibility: "PRIVATE",
};

function emitSpotSaved(page: unknown, detail: MySpotDetail): void {
  const channel = (
    page as { getOpenerEventChannel?(): { emit(name: string, data: unknown): void } }
  ).getOpenerEventChannel?.();
  channel?.emit("spotSaved", detail);
}

Page({
  data: {
    mode: "create",
    spotId: "",
    originalVisibility: "PRIVATE",
    typeLabels: ["江河", "湖泊", "水库", "池塘", "黑坑", "海钓", "其他"],
    typeValues: ["RIVER", "LAKE", "RESERVOIR", "POND", "BLACK_PIT", "SEA", "OTHER"],
    typeIndex: 0,
    feeLabels: ["免费", "收费", "未知"],
    feeValues: ["FREE", "PAID", "UNKNOWN"],
    feeIndex: 0,
    fishText: "",
    submitting: false,
    uploadingImages: false,
    form: { ...emptyForm } as SpotFormData,
    imageUploadTasks: [] as Promise<void>[],
  },
  async onLoad(options: Record<string, string>) {
    const latitude = options.latitude ? Number(options.latitude) : null;
    const longitude = options.longitude ? Number(options.longitude) : null;
    this.setData({
      mode: options.mode || "create",
      spotId: options.spotId || "",
      form: {
        ...this.data.form,
        latitude,
        longitude,
        address: latitude && longitude ? "地图选点位置" : "",
      },
    });
    if (latitude && longitude && options.mode !== "edit") {
      this.fillAddress(latitude, longitude);
    }
    if (options.mode === "edit" && options.spotId) {
      await this.loadSpot(options.spotId);
    }
  },
  async fillAddress(latitude: number, longitude: number, fallbackAddress = "") {
    try {
      const geo = await reverseGeocode(latitude, longitude);
      this.setData({
        "form.province": geo.province || "",
        "form.city": geo.city || "",
        "form.district": geo.district || "",
        "form.address": geo.address || fallbackAddress || "地图选点位置",
      });
    } catch (_error) {
      if (fallbackAddress) {
        this.setData({ "form.address": fallbackAddress });
      }
    }
  },
  async loadSpot(id: string) {
    const detail = await getMySpotDetail(id);
    if (!detail) {
      wx.showToast({ title: "钓点不存在", icon: "none" });
      return;
    }
    const form = this.detailToForm(detail);
    this.setData({
      form,
      originalVisibility: detail.visibility,
      fishText: form.fishSpecies.join(" "),
      typeIndex: this.data.typeValues.indexOf(form.type),
      feeIndex: this.data.feeValues.indexOf(form.feeType),
    });
  },
  detailToForm(detail: MySpotDetail): SpotFormData {
    return {
      name: detail.name,
      type: detail.type || "RIVER",
      description: detail.description || "",
      province: "",
      city: "",
      district: "",
      address: detail.address || "",
      latitude: detail.latitude,
      longitude: detail.longitude,
      coverUrl: detail.coverUrl || "",
      imageUrls: detail.imageUrls || [],
      fishSpecies: detail.fishSpecies || [],
      feeType: detail.feeType || "UNKNOWN",
      feeAmount: detail.feeAmount || null,
      parkingSupported: !!detail.parkingSupported,
      nightFishingSupported: !!detail.nightFishingSupported,
      visibility: detail.visibility,
    };
  },
  setField(event: WechatMiniprogram.Input) {
    const field = event.currentTarget.dataset.field as string;
    this.setData({ [`form.${field}`]: event.detail.value });
  },
  setSwitch(event: WechatMiniprogram.SwitchChange) {
    const field = event.currentTarget.dataset.field as string;
    this.setData({ [`form.${field}`]: event.detail.value });
  },
  changeType(event: WechatMiniprogram.PickerChange) {
    const typeIndex = Number(event.detail.value);
    this.setData({ typeIndex, "form.type": this.data.typeValues[typeIndex] });
  },
  changeFee(event: WechatMiniprogram.PickerChange) {
    const feeIndex = Number(event.detail.value);
    this.setData({ feeIndex, "form.feeType": this.data.feeValues[feeIndex] });
  },
  changeVisibility(event: WechatMiniprogram.SwitchChange) {
    this.setData({ "form.visibility": event.detail.value ? "PUBLIC" : "PRIVATE" });
  },
  setFish(event: WechatMiniprogram.Input) {
    this.setData({
      fishText: event.detail.value,
      "form.fishSpecies": event.detail.value.split(/[ ,，、]+/).filter(Boolean),
    });
  },
  trackImageUpload(task: Promise<void>) {
    const tasks = this.data.imageUploadTasks.concat(task);
    this.setData({ imageUploadTasks: tasks, uploadingImages: true });
    task.finally(() => {
      const nextTasks = this.data.imageUploadTasks.filter((item) => item !== task);
      this.setData({ imageUploadTasks: nextTasks });
      if (!nextTasks.length) {
        this.setData({ uploadingImages: false });
      }
    });
  },
  async waitImageUploads() {
    const tasks = this.data.imageUploadTasks;
    if (tasks.length) {
      wx.showLoading({ title: "图片处理中" });
      await Promise.all(tasks);
      wx.hideLoading();
    }
  },
  getUploadedForm(): SpotFormData {
    const imageUrls = this.data.form.imageUrls.filter((url) => /^https?:\/\//.test(url));
    const coverUrl = /^https?:\/\//.test(this.data.form.coverUrl)
      ? this.data.form.coverUrl
      : imageUrls[0] || "";
    return { ...this.data.form, imageUrls, coverUrl };
  },
  syncUploadedImagesLater(id: string) {
    const tasks = this.data.imageUploadTasks;
    if (!tasks.length || !id) {
      return;
    }
    Promise.all(tasks).then(() => {
      const form = this.getUploadedForm();
      if (form.imageUrls.length) {
        const sync =
          this.data.form.visibility === "PRIVATE"
            ? savePrivateSpotQuiet
            : syncPendingSpotSnapshotQuiet;
        if (this.data.form.visibility !== "PRIVATE") {
          rememberPendingSpotImages(id, form);
        }
        sync(form, id);
      }
    });
  },
  chooseImages() {
    wx.chooseMedia({
      count: 9 - this.data.form.imageUrls.length,
      mediaType: ["image"],
      sizeType: ["compressed"],
      success: (res: WechatMiniprogram.ChooseMediaSuccessCallbackResult) => {
        const tempImages = res.tempFiles.map((file) => file.tempFilePath);
        const nextImages = this.data.form.imageUrls.concat(tempImages).slice(0, 9);
        this.setData({
          "form.imageUrls": nextImages,
          "form.coverUrl": this.data.form.coverUrl || nextImages[0],
        });
        const task = uploadImages(tempImages)
          .then((images) => {
            const imageMap = tempImages.reduce(
              (map: Record<string, string>, tempPath: string, index: number) => {
                map[tempPath] = images[index];
                return map;
              },
              {},
            );
            const imageUrls = this.data.form.imageUrls.map((url) => imageMap[url] || url);
            const coverUrl = imageMap[this.data.form.coverUrl] || this.data.form.coverUrl;
            this.setData({
              "form.imageUrls": imageUrls,
              "form.coverUrl": coverUrl || imageUrls[0] || "",
            });
          })
          .catch(() => {
            const imageUrls = this.data.form.imageUrls.filter((url) => !tempImages.includes(url));
            const coverUrl = tempImages.includes(this.data.form.coverUrl)
              ? imageUrls[0] || ""
              : this.data.form.coverUrl;
            this.setData({ "form.imageUrls": imageUrls, "form.coverUrl": coverUrl });
            wx.showToast({ title: "图片上传失败", icon: "none" });
          });
        this.trackImageUpload(task);
      },
    });
  },
  removeImage(event: WechatMiniprogram.TouchEvent) {
    const index = Number(event.currentTarget.dataset.index);
    const imageUrls = this.data.form.imageUrls.filter((_, i) => i !== index);
    const removedUrl = this.data.form.imageUrls[index];
    const coverUrl =
      this.data.form.coverUrl === removedUrl ? imageUrls[0] || "" : this.data.form.coverUrl;
    this.setData({ "form.imageUrls": imageUrls, "form.coverUrl": coverUrl });
  },
  previewImage(event: WechatMiniprogram.TouchEvent) {
    const index = Number(event.currentTarget.dataset.index);
    wx.previewImage({
      urls: this.data.form.imageUrls,
      current: this.data.form.imageUrls[index],
    });
  },
  chooseLocation() {
    wx.chooseLocation({
      latitude: this.data.form.latitude || undefined,
      longitude: this.data.form.longitude || undefined,
      success: (res: WechatMiniprogram.ChooseLocationSuccessCallbackResult) => {
        this.setData({
          "form.latitude": res.latitude,
          "form.longitude": res.longitude,
          "form.address": res.address || res.name,
        });
        this.fillAddress(res.latitude, res.longitude, res.address || res.name);
      },
    });
  },
  validate(): boolean {
    const form = this.data.form;
    if (!form.name.trim() || !form.address.trim() || !form.latitude || !form.longitude) {
      wx.showToast({ title: "请填写名称、地址和位置", icon: "none" });
      return false;
    }
    return true;
  },
  async submit() {
    if (this.data.submitting || !this.validate()) {
      return;
    }
    this.setData({ submitting: true });
    try {
      const form = this.getUploadedForm();
      let detail: MySpotDetail;
      let targetSpotId = this.data.spotId;
      if (
        this.data.mode === "edit" &&
        this.data.spotId &&
        this.data.originalVisibility === "PRIVATE" &&
        this.data.form.visibility === "PUBLIC"
      ) {
        detail = await savePrivateSpot({ ...form, visibility: "PRIVATE" }, this.data.spotId);
        await submitPublishReview(this.data.spotId);
      } else if (form.visibility === "PRIVATE") {
        detail = await savePrivateSpot(form, this.data.spotId || undefined);
        targetSpotId = detail.id;
      } else if (this.data.mode === "edit" && this.data.spotId) {
        await submitUpdateReview(this.data.spotId, form);
        detail = { ...this.data.form, id: this.data.spotId } as unknown as MySpotDetail;
      } else {
        detail = await savePrivateSpot({ ...form, visibility: "PRIVATE" });
        targetSpotId = detail.id;
        await submitPublishReview(detail.id);
      }
      if ((targetSpotId || detail.id) && this.data.form.visibility === "PUBLIC") {
        rememberPendingSpotImages(targetSpotId || detail.id, this.data.form);
      }
      this.syncUploadedImagesLater(targetSpotId || detail.id);
      emitSpotSaved(this, detail);
      wx.redirectTo({
        url:
          targetSpotId || detail.id
            ? toMySpotDetail(targetSpotId || detail.id)
            : PAGE_MY_SPOTS,
      });
    } catch (_error) {
      wx.showToast({
        title: _error instanceof Error ? _error.message.slice(0, 28) : "提交失败",
        icon: "none",
      });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
