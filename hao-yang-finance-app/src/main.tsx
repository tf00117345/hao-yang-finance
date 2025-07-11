import { StrictMode } from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { createRoot } from 'react-dom/client';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import App from './App.tsx';
import './index.css';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export interface Environment {
	ip_address: string;
	date_format: string;
	datetime_format: string;
	image_url: string;
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
