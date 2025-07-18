import React from 'react';
import { Button, Stack } from '@mui/material';
import { useNotifications } from '../hooks/useNotifications';

// 這是一個示例組件，展示如何使用全域 Snackbar
const SnackbarDemo: React.FC = () => {
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotifications();

  const handleSuccessClick = () => {
    notifySuccess('操作成功完成！');
  };

  const handleErrorClick = () => {
    notifyError('發生錯誤，請稍後再試');
  };

  const handleWarningClick = () => {
    notifyWarning('這是一個警告訊息');
  };

  const handleInfoClick = () => {
    notifyInfo('這是一個資訊訊息');
  };

  // 模擬 API 錯誤回應
  const handleApiErrorClick = () => {
    const mockApiError = {
      response: {
        data: {
          message: '伺服器回應的錯誤訊息'
        }
      }
    };
    notifyError(mockApiError);
  };

  return (
    <Stack spacing={2} direction="row" sx={{ padding: 2 }}>
      <Button variant="contained" color="success" onClick={handleSuccessClick}>
        顯示成功訊息
      </Button>
      <Button variant="contained" color="error" onClick={handleErrorClick}>
        顯示錯誤訊息
      </Button>
      <Button variant="contained" color="warning" onClick={handleWarningClick}>
        顯示警告訊息
      </Button>
      <Button variant="contained" color="info" onClick={handleInfoClick}>
        顯示資訊訊息
      </Button>
      <Button variant="outlined" color="error" onClick={handleApiErrorClick}>
        模擬 API 錯誤
      </Button>
    </Stack>
  );
};

export default SnackbarDemo;