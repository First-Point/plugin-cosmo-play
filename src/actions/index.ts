import createWallet from './createWallet';
import getWalletDetails from './getWalletDetails';
import registerWallet from './registerWallet';

export const actions = [
    createWallet,
    getWalletDetails,
    registerWallet,
];

export * from './createWallet';
export * from './getWalletDetails';
export * from './registerWallet'; 