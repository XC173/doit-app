import { useEffect } from 'react';
import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const Index: React.FC = () => {
  useEffect(() => {
    Taro.switchTab({ url: '/pages/home/index' });
  }, []);

  return <View className={styles.container} />;
};

export default Index;