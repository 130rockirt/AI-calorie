Page({
  data: {
    imagePath: '',
    isCalculating: false,
    foodInfo: null,
    currentDate: '',
    currentTime: '',
    timePeriod: '',
    isEditing: false,
    editForm: {
      foodName: '',
      weight: '',
      calories: '',
      protein: ''
    }
  },

  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel();
    
    eventChannel.on('acceptDataFromOpenerPage', (data) => {
      console.log('接收到的数据:', data);
      
      if (data.from === 'text') {
        // 如果是从文本识别页面来的，直接使用传递的数据
        this.setData({
          imagePath: data.data.imagePath,
          foodInfo: data.data,
          currentDate: data.data.date,
          currentTime: data.data.time,
          timePeriod: data.data.timePeriod,
          isCalculating: false  // 确保加载状态为false
        });
        
        // 保存到历史记录
        this.saveToHistory();
        return;  // 直接返回，不执行后续的图片处理逻辑
      }

      // 从拍照或相册进入的处理逻辑
      const { imagePath, fromHistory } = options;
      if (!imagePath) {
        console.error('未提供图片路径');
        return;
      }

      this.setData({ 
        imagePath
      });
      
      if (fromHistory === 'true') {
        // 从历史记录进入，直接获取已有数据
        const historyList = wx.getStorageSync('photoHistory') || [];
        const record = historyList.find(item => item.imagePath === imagePath);
        if (record) {
          this.setData({
            foodInfo: {
              foodName: record.foodName,
              weight: record.weight,
              calories: record.calories,
              protein: record.protein || 0,
              analysis: record.analysis || '暂无分析'
            },
            currentDate: record.date,
            currentTime: record.time,
            timePeriod: record.timePeriod
          });
        }
      } else {
        // 从拍照或相册进入，需要计算
        this.setData({
          ...this.formatDateTime()
        });
        this.calculateFoodInfo();
      }
    });

    // 如果没有通过事件通道传递数据，则使用 options 参数
    if (options && !options.waitingForEventChannel) {
      const { imagePath, fromHistory } = options;
      if (!imagePath) {
        console.error('未提供图片路径');
        return;
      }

      this.setData({ 
        imagePath
      });
      
      if (fromHistory === 'true') {
        // 从历史记录进入，直接获取已有数据
        const historyList = wx.getStorageSync('photoHistory') || [];
        const record = historyList.find(item => item.imagePath === imagePath);
        if (record) {
          this.setData({
            foodInfo: {
              foodName: record.foodName,
              weight: record.weight,
              calories: record.calories,
              protein: record.protein || 0,
              analysis: record.analysis || '暂无分析'
            },
            currentDate: record.date,
            currentTime: record.time,
            timePeriod: record.timePeriod
          });
        }
      } else {
        // 从拍照或相册进入，需要计算
        this.setData({
          ...this.formatDateTime()
        });
        this.calculateFoodInfo();
      }
    }
  },

  // 开始编辑
  startEdit() {
    // 从当前日期中提取年月日
    const dateMatch = this.data.currentDate.match(/(\d{4})年(\d{2})月(\d{2})日/);
    const rawDate = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '';

    this.setData({
      isEditing: true,
      editForm: {
        foodName: this.data.foodInfo.foodName,
        weight: this.data.foodInfo.weight,
        calories: this.data.foodInfo.calories,
        protein: this.data.foodInfo.protein,
        analysis: this.data.foodInfo.analysis,
        date: this.data.currentDate,
        rawDate: rawDate, // 用于日期选择器的格式
        time: this.data.currentTime,
        timePeriod: this.data.timePeriod
      }
    });
  },

  // 取消编辑
  cancelEdit() {
    this.setData({
      isEditing: false,
      editForm: {
        foodName: '',
        weight: '',
        calories: '',
        protein: '',
        analysis: '',
        date: '',
        time: '',
        timePeriod: ''
      }
    });
  },

  // 处理输入变化
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`editForm.${field}`]: value
    });
  },

  // 处理时段选择
  onTimePeriodChange(e) {
    const timePeriods = ['早餐', '午餐', '晚餐', '夜宵'];
    this.setData({
      'editForm.timePeriod': timePeriods[e.detail.value]
    });
  },

  // 处理日期选择
  onDateChange(e) {
    const rawDate = e.detail.value;
    const [year, month, day] = rawDate.split('-');
    const formattedDate = `${year}年${month}月${day}日`;
    
    this.setData({
      'editForm.rawDate': rawDate,
      'editForm.date': formattedDate
    });
  },

  // 处理时间选择
  onTimeChange(e) {
    const time = e.detail.value;
    const hours = parseInt(time.split(':')[0]);
    
    this.setData({
      'editForm.time': time,
      'editForm.timePeriod': this.getTimePeriod(hours)
    });
  },

  // 保存编辑
  saveEdit() {
    const { foodName, weight, calories, protein, analysis, date, time, timePeriod } = this.data.editForm;
    
    // 验证输入
    if (!foodName.trim()) {
      wx.showToast({
        title: '请输入食物名称',
        icon: 'none'
      });
      return;
    }

    if (!weight || isNaN(weight) || weight <= 0) {
      wx.showToast({
        title: '请输入有效的重量',
        icon: 'none'
      });
      return;
    }

    if (!calories || isNaN(calories) || calories <= 0) {
      wx.showToast({
        title: '请输入有效的卡路里',
        icon: 'none'
      });
      return;
    }

    if (!protein || isNaN(protein) || protein < 0) {
      wx.showToast({
        title: '请输入有效的蛋白质含量',
        icon: 'none'
      });
      return;
    }

    if (!analysis.trim()) {
      wx.showToast({
        title: '请输入分析内容',
        icon: 'none'
      });
      return;
    }

    // 更新foodInfo
    const updatedFoodInfo = {
      foodName: foodName.trim(),
      weight: Number(weight),
      calories: Number(calories),
      protein: Number(protein),
      analysis: analysis.trim()
    };

    this.setData({
      foodInfo: updatedFoodInfo,
      currentDate: date,
      currentTime: time,
      timePeriod: timePeriod,
      isEditing: false
    });

    // 更新历史记录
    let historyList = wx.getStorageSync('photoHistory') || [];
    const index = historyList.findIndex(item => item.imagePath === this.data.imagePath);
    
    if (index !== -1) {
      historyList[index] = {
        ...historyList[index],
        ...updatedFoodInfo,
        date: date,
        time: time,
        timePeriod: timePeriod
      };
      wx.setStorageSync('photoHistory', historyList);
    }

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  // 获取时段
  getTimePeriod(hours) {
    if (hours >= 5 && hours < 10) {
      return '早餐';
    } else if (hours >= 10 && hours < 15) {
      return '午餐';
    } else if (hours >= 15 && hours < 20) {
      return '晚餐';
    } else {
      return '夜宵';
    }
  },

  // 格式化日期和时间
  formatDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return {
      currentDate: `${year}年${month}月${day}日`,
      currentTime: `${hours}:${minutes}`,
      timePeriod: this.getTimePeriod(now.getHours())
    };
  },

  async calculateFoodInfo() {
    this.setData({ isCalculating: true });
    
    // 模拟计算卡路里
    const result = await this.calculateCalories(this.data.imagePath);
    
    // 检查结果是否有效
    if (result.weight === 0 && result.calories === 0 && result.protein === 0) {
      wx.showToast({
        title: '无法识别食物，请重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({
        isCalculating: false,
        foodInfo: null
      });
      return;
    }

    this.setData({
      isCalculating: false,
      foodInfo: result
    });

    // 保存到历史记录
    this.saveToHistory();
  },

  async calculateCalories(imagePath) {
    try {
      // 压缩图片
      const compressedImage = await new Promise((resolve, reject) => {
        wx.compressImage({
          src: imagePath,
          quality: 10,
          success: res => {
            resolve(res.tempFilePath);
          },
          fail: err => {
            console.error('压缩图片失败:', err);
            reject(err);
          }
        });
      });

      // 将压缩后的图片转为base64
      const fileManager = wx.getFileSystemManager();
      const base64 = await new Promise((resolve, reject) => {
        fileManager.readFile({
          filePath: compressedImage,
          encoding: 'base64',
          success: res => {
            resolve(res.data);
          },
          fail: err => {
            console.error('读取图片失败:', err);
            reject(err);
          }
        });
      });
      // console.log('base64:', base64);
      // 简化云函数调用
      const res = await wx.cloud.callFunction({
        name: 'calculateCalories_online',
        data: {
          imageBase64: base64
        }
      });

      console.log('云函数完整响应:', res);
      const { result } = res;
      console.log('云函数result字段:', result);

      if (!result) {
        throw new Error('云函数返回为空');
      }

      // 添加类型转换，确保数值类型正确
      const weight = Number(result.weight) || 0;
      const calories = Number(result.calories) || 0;
      const protein = Number(result.protein) || 0;
      
      return {
        foodName: result.foodName || '未知食物',
        weight: weight,
        calories: calories,
        protein: protein,
        analysis: result.analysis || '暂无分析'
      };

    } catch (error) {
      console.error('识别食物失败，详细错误:', error);
      wx.showToast({
        title: '识别失败，请重试',
        icon: 'none',
        duration: 200000
      });
      return {
        foodName: '未知食物',
        weight: 0,
        calories: 0,
        protein: 0,
        analysis: '暂无分析'
      };
    }
  },

  saveToHistory() {
    // 如果foodInfo为空或者重量和卡路里为0，不保存
    if (!this.data.foodInfo || this.data.foodInfo.weight === 0 || this.data.foodInfo.calories === 0) {
      return;
    }

    // 获取现有历史记录
    let historyList = wx.getStorageSync('photoHistory') || [];
    
    // 添加新记录
    historyList.unshift({
      id: Date.now(),
      imagePath: this.data.imagePath,
      date: this.data.currentDate,
      time: this.data.currentTime,
      timePeriod: this.data.timePeriod,
      ...this.data.foodInfo
    });
    
    // 保存回存储
    wx.setStorageSync('photoHistory', historyList);
  },

  back() {
    wx.navigateBack();
  },

  confirm() {
    wx.navigateBack();
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        // 只更新图片路径，不进行分析
        this.setData({
          imagePath: tempFilePath
        });

        // 更新历史记录中的图片
        let historyList = wx.getStorageSync('photoHistory') || [];
        const index = historyList.findIndex(item => 
          item.date === this.data.currentDate && 
          item.time === this.data.currentTime &&
          item.foodName === this.data.foodInfo.foodName
        );
        
        if (index !== -1) {
          historyList[index].imagePath = tempFilePath;
          wx.setStorageSync('photoHistory', historyList);

          wx.showToast({
            title: '图片更新成功',
            icon: 'success'
          });
        }
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  }
}) 