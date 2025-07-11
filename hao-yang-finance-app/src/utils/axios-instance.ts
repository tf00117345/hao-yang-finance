import axios, { AxiosInstance } from 'axios';

export const axiosInstance: AxiosInstance = axios.create({
	// TODO: 根據實際需求設定 baseURL
	baseURL: 'http://localhost:3000/api',
	headers: {
		'Content-Type': 'application/json',
	},
});

// 可於此加入 request/response 攔截器
// axiosInstance.interceptors.request.use(...)
// axiosInstance.interceptors.response.use(...)
