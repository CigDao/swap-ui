import { createTheme } from '@mui/material';

export const theme = createTheme({
	palette: {
		primary: {
			main: '#DDAD62'
		},
		secondary: {
			main: '#D4BCAE'
		},
		background: {
			default: '#E6E8C9'
		}
	},
	typography: {
		h1: {
			fontFamily: 'backcountry',
			textTransform: 'uppercase',
			textShadow: '1px 1px 1px #000000'
		},
		h2: {
			fontFamily: 'backcountry',
			textTransform: 'uppercase',
			textShadow: '1px 1px 1px #000000'
		},
		h3: {
			fontFamily: 'backcountry',
			textTransform: 'uppercase',
			textShadow: '1px 1px 1px #000000'
		},
		h4: {
			fontFamily: 'backcountry',
			textTransform: 'uppercase',
			textShadow: '1px 1px 1px #000000'
		},
		h5: {
			fontFamily: 'backcountry',
			textTransform: 'uppercase',
			textShadow: '1px 1px 1px #000000'
		},
		h6: {
			textShadow: '1px 1px 1px #000000'
		}
	}
});
