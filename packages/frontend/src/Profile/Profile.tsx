{/* prettier-ignore */ }
import './Profile.css';

import jwtDecode from 'jwt-decode';
import React, { useState, useEffect } from 'react';
import Blockies from 'react-blockies';

import { Auth } from '../types';
import Web3 from 'web3';

let web3: Web3 | undefined = undefined; // Will hold the web3 instance

interface Props {
	auth: Auth;
	onLoggedOut: () => void;
}

interface State {
	loading: boolean;
	user?: {
		id: number;
		username: string;
	};
	username: string;
}

interface JwtDecoded {
	payload: {
		id: string;
		publicAddress: string;
	};
}

export const Profile = ({ auth, onLoggedOut }: Props): JSX.Element => {
	const [log, setLog] = useState<string[]>([]);

	const addToken = (params: any) =>
		(window as any).ethereum
			.request({ method: 'wallet_watchAsset', params })
			.then(() => setLog([...log, 'Success, Token added!']))
			.catch((error: Error) =>
				setLog([...log, `Error: ${error.message}`])
			);

	const addTestnetRifToken = () =>
		addToken({
			type: 'ERC20',
			options: {
				address: '0xbf2cf4cddd54957d29d97874c1dc6b320eacac9b',
				symbol: 'kat',
				decimals: 18,
				image:
					'https://honeysanime.com/wp-content/uploads/2016/06/Chi-Yamada-Chis-Sweet-Home.jpg',
			},
		});
	const clickHandler = async (reciever: string, quantity: any) => {
		// Check if MetaMask is installed
		if (!(window as any).ethereum) {
			window.alert('Please install MetaMask first.');
			return;
		}

		if (!web3) {
			try {
				// Request account access if needed
				await (window as any).ethereum.enable();

				// We don't know window.web3 version, so we use our own instance of Web3
				// with the injected provider given by MetaMask
				web3 = new Web3((window as any).ethereum);
			} catch (error) {
				window.alert('You need to allow MetaMask.');
				return;
			}
		}

		const coinbase = await web3.eth.getCoinbase();
		if (!coinbase) {
			window.alert('Please activate MetaMask first.');
			return;
		}

		const publicAddress = coinbase.toLowerCase();
		payMeta(publicAddress, reciever, quantity);

		// Look if user with current publicAddress is already present on backend
		// fetch(
		// 	`${process.env.REACT_APP_BACKEND_URL}/users?publicAddress=${publicAddress}`
		// 	// Popup MetaMask confirmation modal to sign message
		// 	.then(handleSignMessage)
		// 	// Send signature to backend on the /auth route
		// 	.then(handleAuthenticate)
		// 	// Pass accessToken back to parent component (to save it in localStorage)
		// 	.then(onLoggedIn)
		// 	.catch((err) => {
		// 		window.alert(err);
		// 		setLoading(false);
		// 	});
	};
	async function payMeta(sender: any, receiver: any, strEther: any) {
		console.log(
			`payWithMetamask(receiver=${receiver}, sender=${sender}, strEther=${strEther})`
		);
		try {
			const params = {
				from: sender,
				to: receiver,
				value: strEther,
				gas: 39000,
			};
			await (window as any).ethereum.enable();
			const web3 = new Web3(
				Web3.givenProvider || 'ws://some.local-or-remote.node:8546'
			);
			(window as any).web3 = new Web3(window as any);
			const sendHash = web3.eth.sendTransaction(params);
			console.log('txnHash is ' + String(sendHash));
		} catch (e) {
			console.log('payment fail!');
			console.log(e);
		}
	}

	const [state, setState] = useState<State>({
		loading: false,
		user: undefined,
		username: '',
	});

	useEffect(() => {
		const { accessToken } = auth;
		const {
			payload: { id },
		} = jwtDecode<JwtDecoded>(accessToken);

		fetch(`${process.env.REACT_APP_BACKEND_URL}/users/${id}`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})
			.then((response) => response.json())
			.then((user) => setState({ ...state, user }))
			.catch(window.alert);
	}, []);

	const handleChange = ({
		target: { value },
	}: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, username: value });
	};

	const handleSubmit = () => {
		const { accessToken } = auth;
		const { user, username } = state;

		setState({ ...state, loading: true });

		if (!user) {
			window.alert(
				'The user id has not been fetched yet. Please try again in 5 seconds.'
			);
			return;
		}

		fetch(`${process.env.REACT_APP_BACKEND_URL}/users/${user.id}`, {
			body: JSON.stringify({ username }),
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			method: 'PATCH',
		})
			.then((response) => response.json())
			.then((user) => setState({ ...state, loading: false, user }))
			.catch((err) => {
				window.alert(err);
				setState({ ...state, loading: false });
			});
	};

	const { accessToken } = auth;

	const {
		payload: { publicAddress },
	} = jwtDecode<JwtDecoded>(accessToken);

	const { loading, user } = state;

	const username = user && user.username;

	return (
		<div className="Profile">
			<p>
				Logged in as <Blockies seed={publicAddress} />
			</p>
			<div>
				My username is {username ? <pre>{username}</pre> : 'not set.'}{' '}
				My publicAddress is <pre>{publicAddress}</pre>
			</div>
			<div>
				<label htmlFor="username">Change username: </label>
				<input name="username" onChange={handleChange} />
				<button disabled={loading} onClick={handleSubmit}>
					Submit
				</button>
			</div>
			<section>
				<h2>Add my token</h2>
				<p>
					Click below to add the <strong>kat</strong> token.
				</p>
				<button
					onClick={() =>
						clickHandler(
							'0x2682EC5Cf4F24409E50bD95125eb22357d280149',
							10000
						)
					}
				>
					{' '}
					Pay me
				</button>
				<button onClick={addTestnetRifToken}> Add KAT token</button>
			</section>
			<p>
				<button onClick={onLoggedOut}>Logout</button>
			</p>
		</div>
	);
};
