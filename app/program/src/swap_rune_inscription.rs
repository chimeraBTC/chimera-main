//! # Rune to Inscription Swap Module
//! 
//! This module implements the logic for swapping Runes for a Bitcoin inscription.
//! The swap is performed atomically using Bitcoin transactions with the Arch Network's
//! program framework to ensure trustless execution.

use std::str::FromStr;

use arch_program::{
    account::AccountInfo,
    input_to_sign::InputToSign,
    msg,
    program::{
        next_account_info, 
        set_transaction_to_sign,
    },
    program_error::ProgramError,
    pubkey::Pubkey,
    transaction_to_sign::TransactionToSign,
};
use bitcoin::{
    self, 
    Transaction, 
    transaction::Version, 
    absolute::LockTime, 
    OutPoint, 
    TxIn, 
    Txid, 
    ScriptBuf, 
    Sequence, 
    Witness 
};
use borsh::{BorshDeserialize, BorshSerialize};

/// Executes the swap of Runes for an inscription.
/// 
/// This function constructs a Bitcoin transaction that:
/// 1. Spends the Rune UTXOs (provided by the user)
/// 2. Includes any additional inputs/outputs from the user's PSBT
/// 3. Signs the transaction with the program's private key for the Rune inputs
/// 
/// # Arguments
/// * `accounts` - A slice of account information. Should contain exactly one account (the program's account).
/// * `_program_id` - The public key of the program (unused in this function).
/// * `instruction_data` - Serialized `SwapRuneInscriptionParams` containing the swap details.
/// 
/// # Returns
/// * `Result<(), ProgramError>` - Returns `Ok(())` on success, or a `ProgramError` on failure.
pub fn swap_rune_inscription(
    accounts: &[AccountInfo],
    _program_id: &Pubkey,
    instruction_data: &[u8],
) -> Result<(), ProgramError> {
    // Verify exactly one account is provided (the program's account)
    if accounts.len() != 1 {
        return Err(ProgramError::Custom(501));
    }
    
    let account_iter = &mut accounts.iter();
    let account = next_account_info(account_iter)?;

    // Deserialize the instruction data into SwapRuneInscriptionParams
    let params: SwapRuneInscriptionParams =
        borsh::from_slice(&instruction_data[1..]).map_err(|_e| ProgramError::InvalidArgument)?;
    
    // Deserialize the user's PSBT into a Bitcoin transaction
    let user_swap_tx: Transaction =
        bitcoin::consensus::deserialize(&params.user_swap_psbt).unwrap();
        
    msg!("Processing user's swap transaction: {:?}", user_swap_tx);

    // Create a new transaction with version 2 and no lock time
    let mut tx = Transaction {
        version: Version::TWO,
        lock_time: LockTime::ZERO,
        input: vec![],
        output: vec![],
    };
    
    // Track the number of inputs from the user's PSBT
    let mut user_input_count = 0;
    
    // Add all inputs from the user's PSBT first
    for input in &user_swap_tx.input {
        tx.input.push(input.clone());
        user_input_count += 1;
    }

    // Add all outputs from the user's PSBT
    for output in &user_swap_tx.output {
        tx.output.push(output.clone());
    }
    
    // Add each Rune UTXO as an input to the transaction
    for (i, txid) in params.rune_txids.iter().enumerate() {
        let vout = params.rune_vouts.get(i).ok_or_else(|| {
            msg!("Mismatch between rune_txids and rune_vouts");
            ProgramError::InvalidArgument
        })?;
        
        tx.input.push(TxIn {
            previous_output: OutPoint {
                txid: Txid::from_str(txid).map_err(|_| {
                    msg!("Invalid txid format: {}", txid);
                    ProgramError::InvalidArgument
                })?,
                vout: *vout as u32,
            },
            script_sig: ScriptBuf::new(),  // Will be filled during signing
            sequence: Sequence::MAX,       // Disable BIP68 relative locktime
            witness: Witness::new(),       // Will be filled during signing
        });
    }

    msg!("Constructed transaction: {:?}", tx);

    // Prepare the inputs that need to be signed by the program
    // These are the Rune UTXOs that were added after the user's inputs
    let mut inputs_to_sign = Vec::new();
    for (i, _) in params.rune_txids.iter().enumerate() {
        inputs_to_sign.push(InputToSign {
            index: user_input_count + i as u32,  // Index of the Rune input to sign
            signer: account.key.clone(),
        });
    }

    let tx_to_sign = TransactionToSign {
        tx_bytes: &bitcoin::consensus::serialize(&tx),
        inputs_to_sign: &inputs_to_sign,
    };

    msg!("Transaction ready for signing: {:?}", tx_to_sign);

    // Forward the transaction to the Arch Network runtime for signing and broadcasting
    set_transaction_to_sign(accounts, tx_to_sign)
}

/// Parameters required for the rune to inscription swap.
/// 
/// This struct is serialized/deserialized using Borsh for secure cross-program invocation.
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct SwapRuneInscriptionParams {
    /// List of transaction IDs containing the Rune UTXOs to be spent
    pub rune_txids: Vec<String>,
    
    /// List of output indices corresponding to the Rune UTXOs
    pub rune_vouts: Vec<u8>,
    
    /// The user's PSBT containing additional inputs/outputs for the swap
    pub user_swap_psbt: Vec<u8>
}