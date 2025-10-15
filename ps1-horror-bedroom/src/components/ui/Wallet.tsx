import React from "react";
import "./Wallet.css";

interface WalletProps {
  balances: { [key: string]: number };
}

/**
 * Wallet Component
 *
 * A PS1 horror-themed display for player currency/balances.
 */
const Wallet: React.FC<WalletProps> = ({ balances }) => {
  const hasBalances = Object.keys(balances).length > 0;

  return (
    <div className="wallet-display">
      {/* Scanline overlay and corner decorations for CRT effect */}
      <div className="scanlines"></div>

      {/* List of Balances */}
      <div className="balance-list">
        {hasBalances ? (
          Object.entries(balances).map(([currency, amount]) => (
            <div key={currency} className="balance-item">
              <span className="balance-amount">
                {(amount / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD"
                })}
              </span>
            </div>
          ))
        ) : (
          <div className="balance-item empty">NO DATA</div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
