"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi"
import { injected } from "wagmi/connectors"
import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { getChainMeta } from "@/lib/contracts/addresses"

const navItems = [
  { href: "/dashboard", label: "portfolio" },
  { href: "/dashboard/mint", label: "mint" },
  { href: "/dashboard/agent", label: "agent" },
  { href: "/dashboard/issuer", label: "issuer" },
]

export function TerminalNav() {
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const [mounted, setMounted] = useState(false)

  const meta = getChainMeta(chainId)
  const chainLabel = meta?.shortName || (chainId === 31337 ? 'LOCAL' : 'EVM')

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="sticky top-0 z-50 h-12 border-b border-[#1f1f1f] bg-[#0a0a0a] px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#10b981] rounded" />
          <span className="font-semibold text-sm">
            <span className="text-[#10b981]">f</span>aktory
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-1.5 text-xs transition-colors rounded",
                isActive(item.href)
                  ? "text-[#e5e5e5] bg-[#1a1a1a]"
                  : "text-[#666666] hover:text-[#e5e5e5]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {mounted && isConnected && address ? (
          <button
            onClick={() => disconnect()}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#1f1f1f] rounded text-xs font-mono hover:border-[#10b981] transition-colors"
          >
            <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full" />
            {address.slice(0, 6)}...{address.slice(-4)}
          </button>
        ) : (
          <button
            onClick={() => connect({ connector: injected() })}
            disabled={!mounted || isPending}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-[#666666] hover:text-[#e5e5e5] transition-colors disabled:opacity-50"
          >
            {isPending ? "connecting..." : "connect"}
          </button>
        )}

        <div className="network-badge">{chainLabel}</div>
      </div>
    </nav>
  )
}
