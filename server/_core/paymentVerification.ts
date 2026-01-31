/**
 * Payment verification service for BSC and Solana
 * Monitors blockchain transactions and verifies payments
 */
import { ethers } from 'ethers';
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { PAYMENT_CONFIG } from '../../shared/paymentConfig';

/**
 * Verify BSC USDT payment
 */
export async function verifyBSCPayment(txHash: string, expectedAmount: number, senderAddress: string): Promise<{
  success: boolean;
  amount?: number;
  error?: string;
}> {
  try {
    // Connect to BSC
    const provider = new ethers.JsonRpcProvider(PAYMENT_CONFIG.bsc.rpcUrls[0]);
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return { success: false, error: 'Transaction not found or not confirmed yet' };
    }
    
    // Check if transaction was successful
    if (receipt.status !== 1) {
      return { success: false, error: 'Transaction failed' };
    }
    
    // Parse logs to find USDT transfer event
    // USDT Transfer event signature: Transfer(address indexed from, address indexed to, uint256 value)
    const transferEventSignature = ethers.id('Transfer(address,address,uint256)');
    
    const transferLog = receipt.logs.find(log => 
      log.topics[0] === transferEventSignature &&
      log.address.toLowerCase() === PAYMENT_CONFIG.bsc.usdt.address.toLowerCase()
    );
    
    if (!transferLog) {
      return { success: false, error: 'No USDT transfer found in transaction' };
    }
    
    // Decode transfer event
    const iface = new ethers.Interface([
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ]);
    const decodedLog = iface.parseLog({
      topics: transferLog.topics as string[],
      data: transferLog.data,
    });
    
    if (!decodedLog) {
      return { success: false, error: 'Failed to decode transfer event' };
    }
    
    const from = decodedLog.args[0].toLowerCase();
    const to = decodedLog.args[1].toLowerCase();
    const value = decodedLog.args[2];
    
    // Verify sender
    if (from !== senderAddress.toLowerCase()) {
      return { success: false, error: 'Sender address mismatch' };
    }
    
    // Verify receiver
    if (to !== PAYMENT_CONFIG.bsc.receiverAddress.toLowerCase()) {
      return { success: false, error: 'Receiver address mismatch' };
    }
    
    // Convert amount to USD (USDT has 18 decimals on BSC)
    const amountUSD = parseFloat(ethers.formatUnits(value, PAYMENT_CONFIG.bsc.usdt.decimals));
    
    // Verify amount (allow 1% tolerance for gas/slippage)
    const tolerance = expectedAmount * 0.01;
    if (amountUSD < expectedAmount - tolerance) {
      return { 
        success: false, 
        error: `Insufficient payment amount. Expected: ${expectedAmount}, Received: ${amountUSD}` 
      };
    }
    
    return { success: true, amount: amountUSD };
  } catch (error) {
    console.error('[Payment Verification] BSC error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Verify Solana USDC payment
 */
export async function verifySolanaPayment(signature: string, expectedAmount: number, senderAddress: string): Promise<{
  success: boolean;
  amount?: number;
  error?: string;
}> {
  try {
    // Connect to Solana
    const connection = new Connection(PAYMENT_CONFIG.solana.rpcUrl, 'confirmed');
    
    // Get transaction
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
    
    if (!tx) {
      return { success: false, error: 'Transaction not found or not confirmed yet' };
    }
    
    // Check if transaction was successful
    if (tx.meta?.err) {
      return { success: false, error: 'Transaction failed' };
    }
    
    // Find USDC transfer instruction
    const usdcMint = new PublicKey(PAYMENT_CONFIG.solana.usdc.mint);
    const receiverPubkey = new PublicKey(PAYMENT_CONFIG.solana.receiverAddress);
    
    let transferAmount = 0;
    let transferFound = false;
    
    // Parse instructions to find USDC transfer
    for (const instruction of tx.transaction.message.instructions) {
      if ('parsed' in instruction && instruction.parsed.type === 'transfer') {
        const info = instruction.parsed.info;
        
        // Check if it's a USDC transfer to our receiver
        if (info.destination === PAYMENT_CONFIG.solana.receiverAddress) {
          transferAmount = info.amount / Math.pow(10, PAYMENT_CONFIG.solana.usdc.decimals);
          transferFound = true;
          break;
        }
      }
    }
    
    if (!transferFound) {
      return { success: false, error: 'No USDC transfer found in transaction' };
    }
    
    // Verify amount (allow 1% tolerance)
    const tolerance = expectedAmount * 0.01;
    if (transferAmount < expectedAmount - tolerance) {
      return { 
        success: false, 
        error: `Insufficient payment amount. Expected: ${expectedAmount}, Received: ${transferAmount}` 
      };
    }
    
    return { success: true, amount: transferAmount };
  } catch (error) {
    console.error('[Payment Verification] Solana error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Poll for payment confirmation
 * Checks blockchain for transaction confirmation with retry logic
 */
export async function pollPaymentConfirmation(
  txHash: string,
  chain: 'bsc' | 'solana',
  expectedAmount: number,
  senderAddress: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<{
  success: boolean;
  amount?: number;
  error?: string;
}> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[Payment Poll] Attempt ${attempt}/${maxAttempts} for ${chain} tx: ${txHash}`);
    
    const result = chain === 'bsc'
      ? await verifyBSCPayment(txHash, expectedAmount, senderAddress)
      : await verifySolanaPayment(txHash, expectedAmount, senderAddress);
    
    if (result.success) {
      console.log(`[Payment Poll] Payment confirmed! Amount: ${result.amount}`);
      return result;
    }
    
    // If error is "not found", continue polling
    if (result.error?.includes('not found') || result.error?.includes('not confirmed')) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      continue;
    }
    
    // Other errors are fatal
    return result;
  }
  
  return { 
    success: false, 
    error: 'Payment confirmation timeout. Please contact support with your transaction hash.' 
  };
}
