Page({
  data: {
    cameraPosition: 'back',
    hasCamera: false
  },

  onLoad() {
    this.checkCameraAuth();
  },

  checkCameraAuth() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.camera']) {
          this.setData({ hasCamera: true });
        } else {
          wx.authorize({
            scope: 'scope.camera',
            success: () => {
              this.setData({ hasCamera: true });
            },
            fail: () => {
              wx.showModal({
                title: '提示',
                content: '需要相机权限才能使用拍照功能，是否去设置？',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting({
                      success: (res) => {
                        if (res.authSetting['scope.camera']) {
                          this.setData({ hasCamera: true });
                        }
                      }
                    });
                  }
                }
              });
            }
          });
        }
      }
    });
  },

  async takePhoto() {
    if (!this.data.hasCamera) {
      this.checkCameraAuth();
      return;
    }

    const ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        // 跳转到详情页
        wx.navigateTo({
          url: `/packageA/pages/detail/detail?imagePath=${res.tempImagePath}&fromHistory=false`
        })
      },
      fail: (err) => {
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        })
      }
    })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        // 跳转到详情页
        wx.navigateTo({
          url: `/packageA/pages/detail/detail?imagePath=${tempFilePath}&fromHistory=false`
        })
      },
      fail: (err) => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  error(e) {
    console.error('相机错误：', e.detail);
    this.setData({ hasCamera: false });
    wx.showToast({
      title: '相机出错，请检查权限',
      icon: 'none'
    })
  },

  switchCamera() {
    this.setData({
      cameraPosition: this.data.cameraPosition === 'back' ? 'front' : 'back'
    })
  }
}) 