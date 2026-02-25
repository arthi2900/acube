// @ts-nocheck
import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const APP_ID = import.meta.env.VITE_APP_ID;
const API_ENV = import.meta.env.VITE_API_ENV;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Id': APP_ID,
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => (response as any).data,
  (error: any) => {
    console.error('API 请求错误:', error);
    if (error.response?.data?.status === 999) {
      throw new Error(error.response.data.msg);
    }
    return Promise.reject(error);
  }
);

export const ttsApi = {
  // 短文本在线合成（同步返回音频或可播放链接）
  async synthesizeShort(text: string): Promise<any> {
    const payload = {
      tex: text,
      cuid: '00-11-22-33-44-55',
      ctp: 1,
      per: 106
    };

    // 参考文档：短文本在线合成API
    // 调用地址通过网关代理到短TTS接口
    return apiClient.post(`/api/${API_ENV}/runtime/apicenter/source/proxy/nY1YrenyAFtHN3S38sQFYZ`, payload,  { responseType: 'blob' } );
  }
};

export default apiClient;