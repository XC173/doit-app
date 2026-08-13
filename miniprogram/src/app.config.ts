export default defineAppConfig({
  pages: [
    'pages/welcome/index',
    'pages/home/index',
    'pages/tasks/index',
    'pages/schedule/index',
    'pages/timer/index',
    'pages/profile/index',
    'pages/diagnosis/index',
    'pages/work-timer/index',
    'pages/task-detail/index',
    'pages/task-add/index',
    'pages/task-finish/index',
    'pages/analytics/index',
    'pages/index/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: 'Do-It',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5F7FA'
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#6366F1',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-selected.png',
        text: '首页'
      },
      {
        pagePath: 'pages/tasks/index',
        iconPath: 'assets/tabbar/tasks.png',
        selectedIconPath: 'assets/tabbar/tasks-selected.png',
        text: '任务'
      },
      {
        pagePath: 'pages/schedule/index',
        iconPath: 'assets/tabbar/schedule.png',
        selectedIconPath: 'assets/tabbar/schedule-selected.png',
        text: '日程'
      },
      {
        pagePath: 'pages/timer/index',
        iconPath: 'assets/tabbar/timer.png',
        selectedIconPath: 'assets/tabbar/timer-selected.png',
        text: '记录'
      },
      {
        pagePath: 'pages/profile/index',
        iconPath: 'assets/tabbar/profile.png',
        selectedIconPath: 'assets/tabbar/profile-selected.png',
        text: '我的'
      }
    ]
  }
})
