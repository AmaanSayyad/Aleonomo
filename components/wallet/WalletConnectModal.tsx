'use client';

import React from 'react';
import { useOverflowStore } from '@/lib/store';
import { usePrivy } from '@privy-io/react-auth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWalletConnection as useSuiConnection } from '@/lib/sui/wallet';
import { useModal } from 'connectkit';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Globe, ShieldCheck, Mail } from 'lucide-react';

export const WalletConnectModal: React.FC = () => {
    const isOpen = useOverflowStore(state => state.isConnectModalOpen);
    const setOpen = useOverflowStore(state => state.setConnectModalOpen);
    const setPreferredNetwork = useOverflowStore(state => state.setPreferredNetwork);

    const { login: loginPrivy } = usePrivy();
    const { select: selectSolanaWallet } = useWallet();
    const { setVisible: setSolanaModalVisible } = useWalletModal();
    const { connect: connectSui } = useSuiConnection();
    const { setOpen: openConnectKit } = useModal();

    const handlePrivyConnect = () => {
        setPreferredNetwork('BNB');
        loginPrivy();
        setOpen(false);
    };

    const handleWagmiConnect = () => {
        setPreferredNetwork('BNB');
        openConnectKit(true);
        setOpen(false);
    };

    const handleSolanaConnect = () => {
        setPreferredNetwork('SOL');
        setOpen(false);
        // Use the official Solana wallet adapter modal
        setTimeout(() => setSolanaModalVisible(true), 100);
    };

    const handleSuiConnect = () => {
        setPreferredNetwork('SUI');
        connectSui();
        setOpen(false);
    };

    const handleStellarConnect = async () => {
        const { openWalletModal } = await import('@/lib/stellar/wallet-kit');
        const address = await openWalletModal();
        if (address) {
            setPreferredNetwork('XLM');
            useOverflowStore.getState().setNetwork('XLM');
            useOverflowStore.getState().setAddress(address);
            useOverflowStore.getState().setIsConnected(true);
            // Fetch Stellar mainnet XLM balance
            useOverflowStore.getState().refreshWalletBalance();
        }
        setOpen(false);
    };

    const handleTezosConnect = async () => {
        try {
            const { BeaconWallet } = await import('@taquito/beacon-wallet');
            const { NetworkType } = await import('@airgap/beacon-sdk');

            const wallet = new BeaconWallet({
                name: "BYNOMO Protocol",
                preferredNetwork: NetworkType.MAINNET
            });

            await wallet.requestPermissions();
            const address = await wallet.getPKH();

            if (address) {
                setPreferredNetwork('XTZ');
                useOverflowStore.getState().setNetwork('XTZ');
                useOverflowStore.getState().setAddress(address);
                useOverflowStore.getState().setIsConnected(true);
                // Fetch Tezos mainnet XTZ balance
                useOverflowStore.getState().refreshWalletBalance();
                // Fetch Bynomo house balance for Tezos
                useOverflowStore.getState().fetchBalance(address);
            }
        } catch (error) {
            console.error("Tezos connection error:", error);
        }
        setOpen(false);
    };

    const handleAleoConnect = async () => {
        setOpen(false);
        try {
            // Placeholder for Aleo connection logic
            // We'll implement this in lib/aleo/wallet
            const { connectAleoWallet } = await import('@/lib/aleo/wallet');
            const address = await connectAleoWallet();

            if (address) {
                setPreferredNetwork('ALEO');
                useOverflowStore.getState().setNetwork('ALEO');
                useOverflowStore.getState().setAddress(address);
                useOverflowStore.getState().setIsConnected(true);
                // Fetch Aleo balance
                useOverflowStore.getState().refreshWalletBalance();
            }
        } catch (error) {
            console.error("Aleo connection error:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setOpen(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md max-h-[90vh] bg-[#0f0f0f] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-transparent shrink-0">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Connect Wallet</h2>
                            <p className="text-[11px] sm:text-sm text-gray-400 mt-1">Aleo Network is now active</p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                        >
                            <X className="w-5 h-5 text-gray-500 group-hover:text-white" />
                        </button>
                    </div>

                    {/* Options */}
                    <div className="p-4 sm:p-6 space-y-2 sm:space-y-3 overflow-y-auto no-scrollbar">
                        {/* Aleo Option */}
                        <button
                            onClick={handleAleoConnect}
                            className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 hover:bg-orange-500/10 border border-orange-500/20 rounded-xl transition-all group relative overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.05)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform shrink-0 shadow-inner">
                                <img src="/aleo.jpeg" alt="Aleo" className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm sm:text-base">Aleo Network</span>
                                    <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] bg-orange-500/20 text-orange-500 font-bold uppercase tracking-wider">Testnet</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Connect with Leo Wallet</p>
                            </div>
                            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
                        </button>

                        <div className="py-2 flex items-center gap-3 px-1">
                            <div className="h-[1px] flex-1 bg-white/5" />
                            <span className="text-[9px] text-gray-600 font-bold tracking-widest uppercase">Other networks coming soon</span>
                            <div className="h-[1px] flex-1 bg-white/5" />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white/5 text-center shrink-0">
                        <p className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            BYNOMO Protocol · Pyth Hermes
                        </p>
                        <p className="text-[9px] text-gray-600 mt-1">Powered by Pyth Hermes · BYNOMO Protocol</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
