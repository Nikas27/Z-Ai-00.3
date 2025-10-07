import { PaymentMethod } from '../types';

// In a real application, this service would fetch live data from a crypto API
// like CoinMarketCap or CoinGecko. For this project, we'll use a stateful service
// with a timer to simulate live market fluctuations.

const SATS_PER_BTC = 100_000_000;

class CryptoPriceService {
  private rates: { [key: string]: number } = {
    BTC: 65000.0,
    ETH: 3500.0,
    USDT: 1.0,
    SOL: 150.0,
    LTC: 75.0,
  };
  private intervalId: number | null = null;

  start() {
    if (this.intervalId) return; // Already running

    this.intervalId = window.setInterval(() => {
      // Simulate market fluctuations (e.g., +/- 0.5%)
      this.rates.BTC *= 1 + (Math.random() - 0.5) * 0.005;
      this.rates.ETH *= 1 + (Math.random() - 0.5) * 0.005;
      this.rates.SOL *= 1 + (Math.random() - 0.5) * 0.008; // Solana is more volatile
      this.rates.LTC *= 1 + (Math.random() - 0.5) * 0.006;
      // USDT is a stablecoin, but we can add a tiny fluctuation for realism
      this.rates.USDT = 1 + (Math.random() - 0.5) * 0.0002;

      // Notify the application that rates have been updated
      window.dispatchEvent(new CustomEvent('cryptoRatesUpdated'));
    }, 3000); // Update every 3 seconds
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getRates(): { [key: string]: number } {
    return { ...this.rates };
  }

  getRate(cryptoSymbol: string): number | null {
      const upperSymbol = cryptoSymbol.toUpperCase();
      return this.rates[upperSymbol] || null;
  }

  convertUsdToCrypto(usdAmount: number, cryptoSymbol: string): number | null {
    const upperSymbol = cryptoSymbol.toUpperCase();
    const rate = this.rates[upperSymbol];

    if (!rate) {
      console.warn(`Unsupported crypto symbol for conversion: ${cryptoSymbol}`);
      return null;
    }

    switch (upperSymbol) {
      case 'BTC':
        const btcValue = usdAmount / rate;
        // Return the value in BTC for data consistency, not satoshis.
        // Display logic will handle the conversion to sats.
        return parseFloat(btcValue.toFixed(8));
      case 'ETH':
        return parseFloat((usdAmount / rate).toFixed(6));
      case 'USDT':
        return parseFloat((usdAmount / rate).toFixed(2));
      case 'SOL':
        return parseFloat((usdAmount / rate).toFixed(4));
      case 'LTC':
        return parseFloat((usdAmount / rate).toFixed(5));
      default:
        return null;
    }
  }
}

// Export a singleton instance of the service
export const cryptoPriceService = new CryptoPriceService();