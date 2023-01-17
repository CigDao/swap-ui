import { Box, Container, Divider,  Typography, useMediaQuery } from '@mui/material';
import React from 'react';
import logo from '@assets/images/cig_logo.png';
import { theme } from '@misc/theme';
import NavBar from '@components/NavBar/NavBar';


interface IProps {
	renderContent: Function;
}

export default function LogoWrapper({renderContent}: IProps) {
	const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

	return (<>
			<Box sx={{ display: 'flex', flexGrow: 1, flexDirection:"column", }}>
				<Box sx={{display: 'flex', flexGrow: 1, justifyContent: "center", flexDirection:"column", textAlign: "center"}}>
					<Box>
						<img style={{ filter: 'drop-shadow(5px 5px 5px rgba(0,0,0, 0.4))' }} src={logo} width={isSmallScreen ? '25%' : '12%'} />
					</Box>
					<Typography sx={{ paddingTop: 2, textAlign: 'center', fontSize: isSmallScreen ? 32 : undefined }} color='#ffffff' variant='h3'>
						My Little Protocol
					</Typography>
					<Typography color='primary' variant='h6' sx={{ marginTop: 0 }}>
						From The CigDao Team, To You
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', flexGrow: 1}}>
							<Box sx={{ display: 'flex', flexGrow: 1}}>
								{renderContent()}
							</Box>
				</Box>
			</Box>
		</>
	);
}
