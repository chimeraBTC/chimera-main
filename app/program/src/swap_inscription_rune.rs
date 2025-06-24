//! # Inscription to Rune Swap Module
//! 
//! This module implements the logic for swapping a Bitcoin inscription for Runes.
//! The swap is performed atomically using Bitcoin transactions with the Arch Network's
//! program framework to ensure trustless execution.

use std::str::FromStr;

use arch_program::{
    account::AccountInfo, 
    input_to_sign::InputToSign, 
    msg, 
    program::next_account_info,
    program::set_transaction_to_sign, 
    program_error::ProgramError, 
    pubkey::Pubkey,
    transaction_to_sign::TransactionToSign,
};
use bitcoin::{
    self, 
    absolute::LockTime, 
    transaction::Version, 
    OutPoint, 
    ScriptBuf, 
    Sequence, 
    Transaction,
    TxIn, 
    Txid, 
    Witness,
};
use borsh::{BorshDeserialize, BorshSerialize};

/// Executes the swap of an inscription for Runes.
/// 
/// This function constructs a Bitcoin transaction that:
/// 1. Spends the inscription UTXO (provided by the user)
/// 2. Includes any additional inputs/outputs from the user's PSBT
/// 3. Signs the transaction with the program's private key
/// 
/// # Arguments
/// * `accounts` - A slice of account information. Should contain exactly one account (the program's account).
/// * `program_id` - The public key of the program.
/// * `instruction_data` - Serialized `SwapInscriptionRuneParams` containing the swap details.
/// 
/// # Returns
/// * `Result<(), ProgramError>` - Returns `Ok(())` on success, or a `ProgramError` on failure.
pub(crate) fn swap_inscription_rune(
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

    // Deserialize the instruction data into SwapInscriptionRuneParams
    let params: SwapInscriptionRuneParams =
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

    // Add the inscription UTXO as the first input
    tx.input.push(TxIn {
        previous_output: OutPoint {
            txid: Txid::from_str(&params.inscription_txid).unwrap(),
            vout: params.inscription_vout as u32,
        },
        script_sig: ScriptBuf::new(),  // Will be filled during signing
        sequence: Sequence::MAX,       // Disable BIP68 relative locktime
        witness: Witness::new(),       // Will be filled during signing
    });

    // Add all inputs from the user's PSBT
    for input in &user_swap_tx.input {
        tx.input.push(input.clone());
    }

    // Add all outputs from the user's PSBT
    for output in &user_swap_tx.output {
        tx.output.push(output.clone());
    }

    msg!("Constructed transaction: {:?}", tx);

    // Prepare the transaction for signing
    // Only the first input (the inscription) needs to be signed by the program
    let tx_to_sign = TransactionToSign {
        tx_bytes: &bitcoin::consensus::serialize(&tx),
        inputs_to_sign: &[InputToSign {
            index: 0,  // Only sign the first input (the inscription)
            signer: account.key.clone(),
        }],
    };

    msg!("Transaction ready for signing: {:?}", tx_to_sign);

    // Forward the transaction to the Arch Network runtime for signing and broadcasting
    set_transaction_to_sign(accounts, tx_to_sign)
}

/// Parameters required for the inscription to rune swap.
/// 
/// This struct is serialized/deserialized using Borsh for secure cross-program invocation.
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct SwapInscriptionRuneParams {
    /// The transaction ID of the inscription UTXO being spent
    pub inscription_txid: String,
    
    /// The output index of the inscription UTXO being spent
    pub inscription_vout: u8,
    
    /// The user's PSBT containing additional inputs/outputs for the swap
    pub user_swap_psbt: Vec<u8>,
}
