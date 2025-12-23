'use client';

import { ConnectWallet } from '@/components/ConnectWallet';
import { AgentActivity } from '@/components/AgentActivity';
import { InvoiceForm } from '@/components/InvoiceForm';
import { Portfolio } from '@/components/Portfolio';
import { Stats } from '@/components/Stats';
import { NetworkWarning, CurrentNetwork } from '@/components/NetworkWarning';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-black">
      {/* Network Warning */}
      <NetworkWarning />

      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏭</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Faktory</h1>
              <p className="text-xs text-gray-400">Turn Invoices into Yield</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CurrentNetwork />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-800 rounded-full text-xs text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Agent Active
            </div>
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        {!isConnected && (
          <div className="text-center py-16 mb-8">
            <h2 className="text-4xl font-bold mb-4">
              Turn Invoices into Yield.
              <br />
              <span className="text-blue-400">Automatically.</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Faktory tokenizes your invoices as RWAs on Mantle Network,
              then deploys an autonomous AI agent to optimize yield while protecting your privacy.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg">
                <span>📄</span> Tokenize Invoices
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg">
                <span>🤖</span> AI Yield Optimization
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg">
                <span>🔒</span> Privacy-Preserving
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg">
                <span>⚡</span> Low-Cost on Mantle
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <Stats />

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          {/* Left Column */}
          <div className="space-y-8">
            <InvoiceForm />
            <Portfolio />
          </div>

          {/* Right Column - Agent Activity */}
          <div>
            <AgentActivity />
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16 mb-8">
          <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                icon: '📄',
                title: 'Tokenize',
                description: 'Upload your invoice and mint it as an NFT on Mantle. Data is stored as privacy-preserving commitments.',
              },
              {
                step: '2',
                icon: '🔒',
                title: 'Deposit',
                description: 'Deposit your invoice NFT to the yield vault. Choose a starting strategy or let the agent decide.',
              },
              {
                step: '3',
                icon: '🤖',
                title: 'Optimize',
                description: 'Our AI agent continuously monitors and optimizes your yield strategy based on risk and market conditions.',
              },
              {
                step: '4',
                icon: '💰',
                title: 'Earn',
                description: 'Earn yield while waiting for invoice payment. Withdraw anytime with your accumulated returns.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {item.step}
                </div>
                <span className="text-3xl">{item.icon}</span>
                <h3 className="font-semibold mt-2 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-800 mt-16 pt-8 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-400">Faktory Protocol</p>
          <p className="mt-1">Built for Mantle Global Hackathon 2025</p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="flex items-center gap-1">
              <span>⛓️</span> Mantle
            </span>
            <span className="flex items-center gap-1">
              <span>🤖</span> AI Agent
            </span>
            <span className="flex items-center gap-1">
              <span>🔒</span> Privacy
            </span>
            <span className="flex items-center gap-1">
              <span>💰</span> RWA Yield
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
