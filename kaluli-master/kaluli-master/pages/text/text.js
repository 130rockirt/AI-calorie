Page({
  data: {
    inputText: '',
    result: null,
    loading: false,
    showUnrecognized: false
  },

  // 输入文本变化时的处理函数
  onInputChange(e) {
    this.setData({
      inputText: e.detail.value,
      showUnrecognized: false
    });
  },

  // 提交文本进行识别
  async submitText() {
    if (!this.data.inputText.trim()) {
      wx.showToast({
        title: '请输入食物描述',
        icon: 'none'
      });
      return;
    }

    this.setData({ 
      loading: true,
      showUnrecognized: false
    });

    try {
      const result = await wx.cloud.callFunction({
        name: 'calculateCaloriesText',
        data: {
          text: this.data.inputText
        }
      });

      console.log('识别结果:', result);

      if (result && result.result) {
        const foodData = result.result;
        
        // 修改判断逻辑：只有当foodName为"暂时无法识别"且weight、calories、protein都为0时才显示无法识别
        if (foodData.foodName === "暂时无法识别" && 
            foodData.weight === 0 && 
            foodData.calories === 0 && 
            foodData.protein === 0) {
          this.setData({
            showUnrecognized: true
          });
        } else {
          // 获取当前时间
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          
          // 构建完整的食物数据
          const completeData = {
            ...foodData,
            imagePath: '/images/empty.png',
            date: `${year}年${month}月${day}日`,
            time: `${hours}:${minutes}`,
            timePeriod: this.getTimePeriod(hours)
          };

          wx.navigateTo({
            url: '/packageA/pages/detail/detail',
            success: (res) => {
              res.eventChannel.emit('acceptDataFromOpenerPage', { 
                data: completeData,
                from: 'text'
              });
            }
          });
        }
      } else {
        this.setData({
          showUnrecognized: true
        });
      }
    } catch (error) {
      console.error('识别失败:', error);
      this.setData({
        showUnrecognized: true
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 获取时段
  getTimePeriod(hours) {
    hours = parseInt(hours);
    if (hours >= 5 && hours < 10) {
      return '早餐';
    } else if (hours >= 10 && hours < 15) {
      return '午餐';
    } else if (hours >= 15 && hours < 20) {
      return '晚餐';
    } else {
      return '夜宵';
    }
  }
}) 