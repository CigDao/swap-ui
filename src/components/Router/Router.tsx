
import Swap from '@modules/Swap/Swap';
import WalletConnector from '@modules/WalletConnector/WalletConnector';
import AddLiquidity from '@modules/Liquidity/AddLiquidity';
import React, { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

export default function Router() {
	let location = useLocation();
	const [provider, setProvider] = useState<string>();

	return (
		<Routes>
			<Route path='/'>
				<Route index element={<WalletConnector provider={provider} setProvider={setProvider} />} />
			</Route>
			<Route path='/swap'>
				<Route index element={<Swap provider={provider} />} />
			</Route>
			<Route path='/liquidity' >
				<Route index element={<AddLiquidity provider={provider}/>}/>
			</Route>
		</Routes>
	);
};
