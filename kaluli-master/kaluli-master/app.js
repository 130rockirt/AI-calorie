App({
  
  globalData: {
    userInfo: null
  },
  onLaunch() {
    // 初始化云环境
    wx.cloud.init({
      env: 'kaluli-1g9oge5p85f72de5',
      traceUser: true
    });
  },
  onShow() {
    // 小程序显示时执行
  },
  onHide() {
    // 小程序隐藏时执行
  }
}) 