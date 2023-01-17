import { SavingsRounded, AccountBalance, Percent, SyncAlt, QuestionMark, Fireplace, LocalFireDepartment } from '@mui/icons-material';
import { Avatar, Tooltip } from '@mui/material';
import React from 'react';


interface IProps {
	coinType: string;
	size?: number;
}

export function CoinAvatar({ coinType: CoinType }: IProps) {
	return <Tooltip title='YC' arrow placement='top'>
	<Avatar sx={{ padding:1, color: "black", bgcolor: '#E6E8C9', fontSize: "13px", marginRight: 1}} >
		{CoinType}
	</Avatar>
</Tooltip>
}
