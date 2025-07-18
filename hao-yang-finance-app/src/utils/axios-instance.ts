import axios, { AxiosInstance } from 'axios';

export const axiosInstance: AxiosInstance = axios.create({
	baseURL: 'https://localhost:7034/api',
	headers: {
		'Content-Type': 'application/json',
	},
});

// 可於此加入 request/response 攔截器
// axiosInstance.interceptors.request.use(...)
// axiosInstance.interceptors.response.use(...)
