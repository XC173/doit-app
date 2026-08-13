import { useState, useEffect } from 'react';
import { Check, ArrowRight, Sparkles, Target, Calendar, Clock, Zap, BarChart3, Settings, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: Target,
    title: '智能任务管理',
    description: '创建、分类、追踪您的任务，支持子任务拆分和优先级排序',
    color: 'from-primary to-purple-500',
  },
  {
    icon: Calendar,
    title: '日程安排',
    description: '可视化日历视图，轻松规划您的每一天，任务与日程同步管理',
    color: 'from-secondary to-teal-500',
  },
  {
    icon: Clock,
    title: '时间记录',
    description: '自动记录工作时间，生成时间线视图，分析您的时间使用习惯',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Zap,
    title: '专注工作',
    description: '5分钟强制专注启动，帮助您快速进入高效工作状态',
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: BarChart3,
    title: '数据分析',
    description: '可视化图表展示工作效率、任务完成率等关键指标',
    color: 'from-emerald-500 to-green-500',
  },
  {
    icon: Settings,
    title: '个性化设置',
    description: '自定义主题、提醒方式和工作偏好，打造专属工作环境',
    color: 'from-cyan-500 to-blue-500',
  },
];

export function Welcome({ onGetStarted }: { onGetStarted: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % features.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>全新体验</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            高效工作，
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              从这里开始
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Do-It 是您的智能任务管理与时间管理助手，帮助您更好地规划工作、追踪时间、提升效率。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-lg font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            >
              <span>开始使用</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={scrollToFeatures}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-full text-lg font-medium hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <span>了解更多</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="relative max-w-md mx-auto">
            <div
              className={`bg-white rounded-3xl shadow-2xl p-8 transition-all duration-300 ${
                isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              {(() => {
                const FeatureIcon = features[currentStep].icon;
                return (
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${features[currentStep].color} flex items-center justify-center`}>
                    <FeatureIcon className="w-10 h-10 text-white" />
                  </div>
                );
              })()}
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {features[currentStep].title}
              </h3>
              <p className="text-gray-600">
                {features[currentStep].description}
              </p>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAnimating(true);
                    setTimeout(() => {
                      setCurrentStep(index);
                      setIsAnimating(false);
                    }, 300);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-primary'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-8 h-8 text-gray-400 rotate-90" />
        </div>
      </section>

      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">功能介绍</h2>
            <p className="text-lg text-gray-600">
              全面的任务管理和时间管理功能，助您实现高效工作
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
                >
                  <div className={`w-16 h-16 mb-6 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <FeatureIcon className="w-8 h-8 text-white" />
                  </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">准备好提升效率了吗？</h2>
          <p className="text-xl text-white/80 mb-10">
            加入数千名高效工作者的行列，让 Do-It 成为您的得力助手
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-primary rounded-full text-lg font-medium hover:bg-gray-50 transition-colors shadow-lg"
            >
              <span>立即开始</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-8 text-white">
            <div>
              <p className="text-4xl font-bold">10K+</p>
              <p className="text-white/70">用户信赖</p>
            </div>
            <div>
              <p className="text-4xl font-bold">500K+</p>
              <p className="text-white/70">任务完成</p>
            </div>
            <div>
              <p className="text-4xl font-bold">98%</p>
              <p className="text-white/70">用户满意度</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">快速开始</h2>
            <p className="text-lg text-gray-600">
              只需3个简单步骤，即可开始高效工作之旅
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: '01',
                title: '创建您的第一个任务',
                description: '在任务管理中添加您的待办事项，设置优先级和截止日期',
                icon: Target,
              },
              {
                step: '02',
                title: '规划您的日程',
                description: '将任务安排到日历中，合理分配时间，避免任务堆积',
                icon: Calendar,
              },
              {
                step: '03',
                title: '开始专注工作',
                description: '点击开始处理，进入专注模式，高效完成您的任务',
                icon: Zap,
              },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {item.step}
                    </span>
                    <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                  </div>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-lg font-medium hover:opacity-90 transition-all shadow-lg"
            >
              <Check className="w-5 h-5" />
              <span>开始我的高效之旅</span>
            </button>
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">
            © 2026 Do-It. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}