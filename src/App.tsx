import Router from '@components/Router/Router';
import { theme } from '@misc/theme';
import { ThemeProvider } from '@mui/material';
import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';

export default function App() {
	return (
		<ThemeProvider theme={theme}>
			<BrowserRouter>
				<Router />
			</BrowserRouter>
		</ThemeProvider>
	);
}
