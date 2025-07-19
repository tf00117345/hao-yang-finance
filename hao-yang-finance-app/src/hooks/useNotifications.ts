import { useSnackbar } from '../contexts/SnackbarContext';

export const useNotifications = () => {
	const { showSuccessMessage, showErrorMessage, showWarningMessage, showInfoMessage } = useSnackbar();

	const notifySuccess = (message: string) => {
		showSuccessMessage(message);
	};

	const notifyError = (error: any) => {
		if (typeof error === 'string') {
			showErrorMessage(error);
		} else if (error?.response?.data?.message) {
			// API 錯誤回應格式: { message: "錯誤訊息" }
			showErrorMessage(error.response.data.message);
		} else if (error?.response?.data?.errors) {
			// 驗證錯誤格式: { errors: ["錯誤1", "錯誤2"] }
			const errorMessages = error.response.data.errors.join(', ');
			showErrorMessage(errorMessages);
		} else if (error?.response?.data && typeof error.response.data === 'string') {
			// 直接字串錯誤回應
			showErrorMessage(error.response.data);
		} else if (error?.message) {
			// JavaScript Error 對象
			showErrorMessage(error.message);
		} else {
			showErrorMessage('發生未知錯誤');
		}
	};

	const notifyWarning = (message: string) => {
		showWarningMessage(message);
	};

	const notifyInfo = (message: string) => {
		showInfoMessage(message);
	};

	// 針對後端 API 回應的特殊處理
	const notifyApiResponse = (response: any, successMessage?: string) => {
		if (response?.success) {
			notifySuccess(successMessage || response.message || '操作成功');
		} else {
			notifyError(response?.message || '操作失敗');
		}
	};

	return {
		notifySuccess,
		notifyError,
		notifyWarning,
		notifyInfo,
		notifyApiResponse,
	};
};
