Page({
  data: {
    hasUserInfo: false,
    gender: 'male',
    age: '',
    height: '',
    weight: '',
    activityLevelIndex: 0,
    goalIndex: 0,
    bmr: 0,
    activityCalories: 0,
    goalAdjustment: 0,
    dailyCalories: 0,
    bmi: 0,
    activityLevels: [
      { name: '久坐少动', factor: 1.2 },
      { name: '轻度活动', factor: 1.375 },
      { name: '中等活动', factor: 1.55 },
      { name: '高强度活动', factor: 1.725 },
      { name: '非常高强度活动', factor: 1.9 }
    ],
    goals: [
      { name: '减重', adjustment: -400 },
      { name: '维持体重', adjustment: 0 },
      { name: '增肌', adjustment: 400 }
    ],
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    calendarDays: [],
    dailyCalorieGoal: 0, // 每日推荐摄入量
    showFoodList: false,
    selectedDate: '',
    dayFoods: []
  },

  onLoad() {
    // 尝试获取存储的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        hasUserInfo: true,
        ...userInfo
      });
      this.calculateAll();
    }
    this.initCalendar();
  },

  // 页面显示时更新日历
  onShow() {
    // 如果已经设置了用户信息，重新计算并更新日历
    if (this.data.hasUserInfo) {
      this.calculateAll();
    }
  },

  // 计算BMR（基础代谢率）
  calculateBMR() {
    const { gender, age, height, weight } = this.data;
    let bmr = 0;
    
    if (gender === 'male') {
      // 男性：BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 + 5
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      // 女性：BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 - 161
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    return Math.round(bmr);
  },

  // 计算BMI
  calculateBMI() {
    const { height, weight } = this.data;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  },

  // 计算所有数值
  calculateAll() {
    const bmr = this.calculateBMR();
    const activityFactor = this.data.activityLevels[this.data.activityLevelIndex].factor;
    const goalAdjustment = this.data.goals[this.data.goalIndex].adjustment;
    
    const activityCalories = Math.round(bmr * activityFactor - bmr);
    const dailyCalories = Math.round(bmr * activityFactor + goalAdjustment);
    const bmi = this.calculateBMI();

    this.setData({
      bmr,
      activityCalories,
      goalAdjustment,
      dailyCalories,
      bmi,
      dailyCalorieGoal: dailyCalories // 更新每日推荐摄入量
    });

    // 重新生成日历以更新状态颜色
    this.initCalendar();
  },

  // 表单输入处理函数
  onGenderChange(e) {
    this.setData({ gender: e.detail.value });
  },

  onAgeChange(e) {
    this.setData({ age: parseInt(e.detail.value) || '' });
  },

  onHeightChange(e) {
    this.setData({ height: parseFloat(e.detail.value) || '' });
  },

  onWeightChange(e) {
    this.setData({ weight: parseFloat(e.detail.value) || '' });
  },

  onActivityLevelChange(e) {
    this.setData({ activityLevelIndex: parseInt(e.detail.value) });
  },

  onGoalChange(e) {
    this.setData({ goalIndex: parseInt(e.detail.value) });
  },

  // 保存用户信息
  saveUserInfo() {
    const { gender, age, height, weight, activityLevelIndex, goalIndex } = this.data;
    
    // 验证输入
    if (!age || !height || !weight) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    if (age < 15 || age > 100) {
      wx.showToast({
        title: '请输入有效年龄',
        icon: 'none'
      });
      return;
    }

    if (height < 100 || height > 250) {
      wx.showToast({
        title: '请输入有效身高',
        icon: 'none'
      });
      return;
    }

    if (weight < 30 || weight > 200) {
      wx.showToast({
        title: '请输入有效体重',
        icon: 'none'
      });
      return;
    }

    // 保存用户信息
    const userInfo = {
      gender,
      age,
      height,
      weight,
      activityLevelIndex,
      goalIndex
    };
    
    wx.setStorageSync('userInfo', userInfo);
    
    this.setData({
      hasUserInfo: true
    });
    
    // 计算所有数值并更新日历
    this.calculateAll();

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  // 编辑信息
  editInfo() {
    this.setData({
      hasUserInfo: false
    });
  },

  // 初始化日历
  initCalendar: function() {
    const date = new Date(this.data.currentYear, this.data.currentMonth - 1, 1);
    this.generateCalendarDays(date);
  },

  // 生成日历数据
  generateCalendarDays: function(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startPadding = firstDay.getDay();
    const endPadding = 6 - lastDay.getDay();
    
    // 添加上个月的日期
    if (startPadding > 0) {
      const prevLastDay = new Date(year, month, 0);
      for (let i = startPadding - 1; i >= 0; i--) {
        const day = prevLastDay.getDate() - i;
        days.push({
          day,
          date: `${year}-${month === 0 ? 12 : month}-${day}`,
          isCurrentMonth: false,
          status: '',
          calories: 0
        });
      }
    }
    
    // 添加当前月的日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        day: i,
        date: `${year}-${month + 1}-${i}`,
        isCurrentMonth: true,
        status: this.getDateStatus(i),
        calories: this.getDateCalories(i)
      });
    }
    
    // 添加下个月的日期
    if (endPadding > 0) {
      for (let i = 1; i <= endPadding; i++) {
        days.push({
          day: i,
          date: `${year}-${month + 2}-${i}`,
          isCurrentMonth: false,
          status: '',
          calories: 0
        });
      }
    }
    
    this.setData({
      calendarDays: days
    });
  },

  // 获取日期状态
  getDateStatus: function(day) {
    const calories = this.getDateCalories(day);
    if (!calories) return '';
    
    const goal = this.data.dailyCalorieGoal;
    if (!goal) return '';  // 如果没有设置目标，返回空状态
    
    // 超出目标则显示红色，否则显示绿色
    return calories > goal ? 'excess' : 'normal';
  },

  // 获取日期的卡路里摄入量
  getDateCalories: function(day) {
    const { currentYear, currentMonth } = this.data;
    const targetDate = `${currentYear}年${String(currentMonth).padStart(2, '0')}月${String(day).padStart(2, '0')}日`;
    
    // 获取历史记录
    const historyList = wx.getStorageSync('photoHistory') || [];
    
    // 找到目标日期的所有记录
    const dayRecords = historyList.filter(item => item.date === targetDate);
    
    // 如果没有记录，返回0
    if (dayRecords.length === 0) {
      return 0;
    }
    
    // 计算当天的总卡路里摄入量
    const totalCalories = dayRecords.reduce((sum, record) => {
      return sum + (record.calories || 0);
    }, 0);
    
    return Math.round(totalCalories);
  },

  // 上个月
  prevMonth: function() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 1) {
      currentMonth = 12;
      currentYear--;
    } else {
      currentMonth--;
    }
    this.setData({ currentYear, currentMonth });
    this.initCalendar();
  },

  // 下个月
  nextMonth: function() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 12) {
      currentMonth = 1;
      currentYear++;
    } else {
      currentMonth++;
    }
    this.setData({ currentYear, currentMonth });
    this.initCalendar();
  },

  // 选择日期
  selectDay: function(e) {
    const { currentYear, currentMonth } = this.data;
    const day = e.currentTarget.dataset.date.split('-')[2];
    const targetDate = `${currentYear}年${String(currentMonth).padStart(2, '0')}月${String(day).padStart(2, '0')}日`;
    
    // 获取历史记录
    const historyList = wx.getStorageSync('photoHistory') || [];
    
    // 找到目标日期的所有记录
    const dayFoods = historyList.filter(item => item.date === targetDate);
    
    // 按时间排序
    dayFoods.sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });

    // 计算当天总摄入量
    const dayTotalCalories = dayFoods.reduce((sum, food) => sum + (food.calories || 0), 0);
    const dayTotalProtein = dayFoods.reduce((sum, food) => sum + (food.protein || 0), 0);
    
    this.setData({
      selectedDate: targetDate,
      dayFoods,
      dayTotalCalories,
      dayTotalProtein,
      showFoodList: true
    });
  },

  // 关闭食物列表
  closeFoodList: function() {
    this.setData({
      showFoodList: false
    });
  },

  // 阻止事件冒泡
  stopPropagation: function(e) {
    // 阻止点击食物列表容器时关闭弹窗
  },

  // 查看食物详情
  viewFoodDetail: function(e) {
    const imagePath = e.currentTarget.dataset.imagePath;
    wx.navigateTo({
      url: `/packageA/pages/detail/detail?imagePath=${imagePath}&fromHistory=true`
    });
  }
}); 