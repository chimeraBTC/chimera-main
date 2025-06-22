use std::str::FromStr;

use arch_program::{
    account::AccountInfo,
    input_to_sign::InputToSign,
    msg,
    program::{
        next_account_info, set_transaction_to_sign,
    },
    program_error::ProgramError,
    pubkey::Pubkey,
    transaction_to_sign::TransactionToSign,
};
use bitcoin::{self, Transaction, transaction::Version, absolute::LockTime, OutPoint, TxIn, Txid, ScriptBuf, Sequence, Witness };
use borsh::{BorshDeserialize, BorshSerialize};


pub fn swap_rune_inscription(
    accounts: &[AccountInfo],
    program_id: &Pubkey,
    instruction_data: &[u8],
) -> Result<(), ProgramError> {
    
    if accounts.len() != 1 {
        return Err(ProgramError::Custom(501));
    }
    
    let account_iter = &mut accounts.iter();
    let account = next_account_info(account_iter)?;

    let params: SwapRuneInscriptionParams =
        borsh::from_slice(&instruction_data[1..]).map_err(|_e| ProgramError::InvalidArgument)?;
    let user_swap_tx: Transaction =
        bitcoin::consensus::deserialize(&params.user_swap_psbt).unwrap();
        
    msg!("User Sign Tx {:?}", user_swap_tx);

    let mut tx = Transaction {
        version: Version::TWO,
        lock_time: LockTime::ZERO,
        input: vec![],
        output: vec![],
    };
    let mut sign_index: u32 = 0;
    
    for (index, input) in user_swap_tx.input.iter().enumerate() {
        tx.input.push(input.clone());
        sign_index += 1;
    }

    for (index, output) in user_swap_tx.output.iter().enumerate() {
        tx.output.push(output.clone());
    }
    
    for (i, txid) in params.rune_txids.iter().enumerate() {
        let vout = params.rune_vouts.get(i).unwrap(); // Safely get vout corresponding to txid
        tx.input.push(TxIn {
            previous_output: OutPoint {
                txid: Txid::from_str(txid).unwrap(),
                vout: *vout as u32,
            },
            script_sig: ScriptBuf::new(),
            sequence: Sequence::MAX,
            witness: Witness::new(),
        });
    }

    msg!("User Tx {:?}", tx);

    // Prepare inputs to sign
    let mut inputs_to_sign = Vec::new();
    for (index, _) in params.rune_txids.iter().enumerate() {
        inputs_to_sign.push(InputToSign {
            index: sign_index + index as u32, // Ensure the index matches the input index
            signer: account.key.clone(),
        });
    }

    let tx_to_sign = TransactionToSign {
        tx_bytes: &bitcoin::consensus::serialize(&tx),
        inputs_to_sign: &inputs_to_sign,
    };

    msg!("tx_to_sign{:?}", tx_to_sign);

    set_transaction_to_sign(accounts, tx_to_sign)
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct SwapRuneInscriptionParams {
    pub rune_txids: Vec<String>,
    pub rune_vouts: Vec<u8>,
    pub user_swap_psbt: Vec<u8>
}