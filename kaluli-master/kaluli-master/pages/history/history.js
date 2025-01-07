Page({
  data: {
    groupedHistory: [],
    todayCalories: 0,
    todayProtein: 0
  },

  onShow() {
    this.loadHistory();
  },

  // 获取今天的日期字符串
  getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  },

  // 计算指定时段的总卡路里和蛋白质
  calculateMealStats(meals) {
    return meals.reduce((sum, food) => ({
      calories: sum.calories + (food.calories || 0),
      protein: sum.protein + (food.protein || 0)
    }), { calories: 0, protein: 0 });
  },

  // 加载并处理历史记录
  loadHistory() {
    const historyList = wx.getStorageSync('photoHistory') || [];
    const today = this.getTodayString();
    
    // 按日期分组
    const grouped = {};
    let todayCalories = 0;
    let todayProtein = 0;

    historyList.forEach(item => {
      const date = item.date;
      if (!grouped[date]) {
        grouped[date] = {
          date: date,
          totalDayCalories: 0,
          totalDayProtein: 0,
          isExpanded: date === today, // 默认只展开今天的记录
          meals: {
            '早餐': [],
            '午餐': [],
            '晚餐': [],
            '夜宵': []
          },
          mealCalories: {
            '早餐': 0,
            '午餐': 0,
            '晚餐': 0,
            '夜宵': 0
          },
          mealProtein: {
            '早餐': 0,
            '午餐': 0,
            '晚餐': 0,
            '夜宵': 0
          }
        };
      }
      
      // 添加到对应的时段
      grouped[date].meals[item.timePeriod].push(item);
      // 累加当天的卡路里和蛋白质
      grouped[date].totalDayCalories += item.calories || 0;
      grouped[date].totalDayProtein += item.protein || 0;
      // 如果是今天的记录，累加到今日总量
      if (date === today) {
        todayCalories += item.calories || 0;
        todayProtein += item.protein || 0;
      }
    });

    // 计算每个时段的卡路里和蛋白质
    Object.values(grouped).forEach(dayGroup => {
      Object.keys(dayGroup.meals).forEach(mealType => {
        const stats = this.calculateMealStats(dayGroup.meals[mealType]);
        dayGroup.mealCalories[mealType] = stats.calories;
        dayGroup.mealProtein[mealType] = stats.protein;
      });
    });

    // 转换为数组并按日期排序
    const groupedArray = Object.values(grouped).sort((a, b) => {
      return this.convertDateToTimestamp(b.date) - this.convertDateToTimestamp(a.date);
    });

    this.setData({
      groupedHistory: groupedArray,
      todayCalories: todayCalories,
      todayProtein: todayProtein
    });
  },

  // 切换分组的展开/折叠状态
  toggleGroup(e) {
    const date = e.currentTarget.dataset.date;
    const groupedHistory = this.data.groupedHistory.map(group => {
      if (group.date === date) {
        return { ...group, isExpanded: !group.isExpanded };
      }
      return group;
    });
    
    this.setData({ groupedHistory });
  },

  // 将日期字符串转换为时间戳
  convertDateToTimestamp(dateStr) {
    const year = dateStr.match(/(\d{4})年/)[1];
    const month = dateStr.match(/(\d{2})月/)[1];
    const day = dateStr.match(/(\d{2})日/)[1];
    return new Date(year, month - 1, day).getTime();
  },

  // 查看详情
  viewDetail(e) {
    const { imagePath } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageA/pages/detail/detail?imagePath=${imagePath}&fromHistory=true`
    });
  },

  // 删除记录
  deleteRecord(e) {
    const { imagePath, date, timePeriod } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          // 获取所有历史记录
          let historyList = wx.getStorageSync('photoHistory') || [];
          
          // 找到并删除对应记录（使用更精确的匹配条件）
          historyList = historyList.filter(item => {
            // 使用多个条件来确保只删除特定的记录
            return !(item.imagePath === imagePath && 
                    item.date === date && 
                    item.timePeriod === timePeriod);
          });
          
          // 保存更新后的历史记录
          wx.setStorageSync('photoHistory', historyList);
          
          // 重新加载历史记录
          this.loadHistory();
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  }
}) 